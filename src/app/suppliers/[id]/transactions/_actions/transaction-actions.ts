'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { translateBatch } from '@/lib/translate';
import { transactionCreateSchema } from '../_validations/transaction-schema';

const DEV_FALLBACK_ADMIN_ID = 'P3wbHXCGnCMPy0k6LO4paUqASBYRgRQK';

async function getUserId(): Promise<string> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user?.id ?? DEV_FALLBACK_ADMIN_ID;
  } catch {
    return DEV_FALLBACK_ADMIN_ID;
  }
}

export type TransactionFormState = {
  status: 'idle' | 'success' | 'error';
  errors?: Record<string, string[] | undefined>;
  message?: string;
};

function parseFormData(formData: FormData) {
  const itemsRaw = formData.get('items');
  const paymentsRaw = formData.get('payments');
  const obj = Object.fromEntries(formData) as Record<string, unknown>;
  delete obj.items;
  delete obj.payments;
  obj.items = JSON.parse(typeof itemsRaw === 'string' ? itemsRaw : '[]');
  obj.payments = JSON.parse(typeof paymentsRaw === 'string' ? paymentsRaw : '[]');
  return obj;
}

export async function createTransaction(
  supplierId: number,
  _prevState: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const raw = parseFormData(formData);
  const parsed = transactionCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return {
      status: 'error',
      errors: flat.fieldErrors,
      message: '表单校验失败',
    };
  }

  const createdById = await getUserId();
  const { items, payments, ...main } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          supplierId,
          contactId: main.contactId,
          orderedAt: new Date(main.orderedAt),
          totalAmount: main.totalAmount,
          currency: main.currency,
          notesZh: main.notesZh,
          notesRu: main.notesRu,
          notesRuAutoTranslated: main.notesRuAutoTranslated,
          status: main.status,
          createdById,
        },
      });
      if (items.length > 0) {
        await tx.transactionItem.createMany({
          data: items.map((item, idx) => ({
            transactionId: transaction.id,
            quoteId: item.quoteId ?? null,
            productNameZh: item.productNameZh,
            productNameRu: item.productNameRu,
            productNameRuAutoTranslated: item.productNameRuAutoTranslated,
            productSpecZh: item.productSpecZh,
            productSpecRu: item.productSpecRu,
            productSpecRuAutoTranslated: item.productSpecRuAutoTranslated,
            quantity: item.quantity,
            unitZh: item.unitZh,
            unitRu: item.unitRu,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            sortOrder: idx,
          })),
        });
      }
      // payments 在 create 场景永远是全新行,直接 createMany 即可(无需 diff)
      if (payments.length > 0) {
        await tx.payment.createMany({
          data: payments.map((p) => ({
            transactionId: transaction.id,
            paidAt: new Date(p.paidAt),
            amount: p.amount,
            currency: p.currency,
            method: p.method,
            purposeZh: p.purposeZh,
            purposeRu: p.purposeRu,
            purposeRuAutoTranslated: p.purposeRuAutoTranslated,
            createdById,
          })),
        });
      }
    });
  } catch (err) {
    return {
      status: 'error',
      message: '保存失败:' + (err instanceof Error ? err.message : '未知错误'),
    };
  }

  revalidatePath(`/suppliers/${supplierId}`);
  redirect(`/suppliers/${supplierId}`);
}

export async function updateTransaction(
  transactionId: number,
  _prevState: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const raw = parseFormData(formData);
  const parsed = transactionCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return {
      status: 'error',
      errors: flat.fieldErrors,
      message: '表单校验失败',
    };
  }

  const createdById = await getUserId();
  const { items, payments, ...main } = parsed.data;

  const existing = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: { supplierId: true },
  });
  if (!existing) {
    return { status: 'error', message: '订单不存在' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 主表 update
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          contactId: main.contactId,
          orderedAt: new Date(main.orderedAt),
          totalAmount: main.totalAmount,
          currency: main.currency,
          notesZh: main.notesZh,
          notesRu: main.notesRu,
          notesRuAutoTranslated: main.notesRuAutoTranslated,
          status: main.status,
        },
      });

      // items 继续走"先删后插"
      await tx.transactionItem.deleteMany({ where: { transactionId } });
      if (items.length > 0) {
        await tx.transactionItem.createMany({
          data: items.map((item, idx) => ({
            transactionId,
            quoteId: item.quoteId ?? null,
            productNameZh: item.productNameZh,
            productNameRu: item.productNameRu,
            productNameRuAutoTranslated: item.productNameRuAutoTranslated,
            productSpecZh: item.productSpecZh,
            productSpecRu: item.productSpecRu,
            productSpecRuAutoTranslated: item.productSpecRuAutoTranslated,
            quantity: item.quantity,
            unitZh: item.unitZh,
            unitRu: item.unitRu,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            sortOrder: idx,
          })),
        });
      }

      // payments 走 diff 三分类,保留稳定 id,挂的截图不会被误删
      const existingPayments = await tx.payment.findMany({
        where: { transactionId },
        select: { id: true },
      });
      const existingIds = new Set(existingPayments.map((p) => p.id));

      // 提交里"声明自己是已存在记录"的 id 集合(且确实在 DB 里)
      const keepIds = new Set(
        payments
          .filter((p) => p.id != null && existingIds.has(p.id))
          .map((p) => p.id as number),
      );

      // 1. DELETE: 在 DB 但提交里没保留的 → 物理删,级联清掉截图
      const toDelete = [...existingIds].filter((id) => !keepIds.has(id));
      if (toDelete.length > 0) {
        await tx.payment.deleteMany({ where: { id: { in: toDelete } } });
      }

      // 2. UPDATE 或 3. CREATE
      for (const p of payments) {
        const data = {
          paidAt: new Date(p.paidAt),
          amount: p.amount,
          currency: p.currency,
          method: p.method,
          purposeZh: p.purposeZh,
          purposeRu: p.purposeRu,
          purposeRuAutoTranslated: p.purposeRuAutoTranslated,
        };
        if (p.id != null && existingIds.has(p.id)) {
          await tx.payment.update({ where: { id: p.id }, data });
        } else {
          await tx.payment.create({
            data: { ...data, transactionId, createdById },
          });
        }
      }
    });
  } catch (err) {
    return {
      status: 'error',
      message: '保存失败:' + (err instanceof Error ? err.message : '未知错误'),
    };
  }

  revalidatePath(`/suppliers/${existing.supplierId}`);
  // 改动:保存后回到同一编辑页,让用户立即管理新建 Payment 的截图
  redirect(`/suppliers/${existing.supplierId}/transactions/${transactionId}/edit`);
}

export async function archiveTransaction(id: number) {
  const t = await prisma.transaction.findUnique({
    where: { id },
    select: { supplierId: true },
  });
  if (!t) return;
  await prisma.transaction.update({
    where: { id },
    data: { isActive: false },
  });
  revalidatePath(`/suppliers/${t.supplierId}`);
}

export async function restoreTransaction(id: number) {
  const t = await prisma.transaction.findUnique({
    where: { id },
    select: { supplierId: true },
  });
  if (!t) return;
  await prisma.transaction.update({
    where: { id },
    data: { isActive: true },
  });
  revalidatePath(`/suppliers/${t.supplierId}`);
}

export type TranslateTransactionFieldResult =
  | { ok: true; translated: string }
  | { ok: false; error: string };

export async function translateTransactionText(
  text: string,
): Promise<TranslateTransactionFieldResult> {
  if (!text.trim()) return { ok: false, error: '中文为空,无法翻译' };
  try {
    const translated = await translateBatch([{ text, from: 'zh', to: 'ru' }]);
    return { ok: true, translated: translated[0] };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : '翻译失败',
    };
  }
}