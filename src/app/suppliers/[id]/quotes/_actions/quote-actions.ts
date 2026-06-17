'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUserId, requireCurrentUser, isOwner } from '@/lib/auth';
import { translateBatch } from '@/lib/translate';
import { quoteCreateSchema } from '../_validations/quote-schema';

export type QuoteFormState = {
  status: 'idle' | 'success' | 'error';
  errors?: Record<string, string[] | undefined>;
  message?: string;
};

// 从 FormData 提取 tagIds(多值字段,Object.fromEntries 抓不全)
function extractTagIds(formData: FormData): number[] {
  return formData
    .getAll('tagIds')
    .map((v) => parseInt(v as string, 10))
    .filter((n) => !isNaN(n) && n > 0);
}

// ===== 创建报价 =====
export async function createQuote(
  supplierId: number,
  _prevState: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = quoteCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return {
      status: 'error',
      errors: flat.fieldErrors,
      message: '表单校验失败,请检查标红的字段',
    };
  }

  const tagIds = extractTagIds(formData);
  const createdById = await requireUserId();

  try {
    await prisma.quote.create({
      data: {
        supplierId,
        contactId: parsed.data.contactId ?? null,
        productNameZh: parsed.data.productNameZh,
        productNameRu: parsed.data.productNameRu || null,
        productSpecZh: parsed.data.productSpecZh || null,
        productSpecRu: parsed.data.productSpecRu || null,
        productNameRuAutoTranslated: parsed.data.productNameRuAutoTranslated,
        productSpecRuAutoTranslated: parsed.data.productSpecRuAutoTranslated,
        unitPrice: parsed.data.unitPrice,
        currency: parsed.data.currency,
        unitZh: parsed.data.unitZh || null,
        unitRu: parsed.data.unitRu || null,
        moq: parsed.data.moq ?? null,
        quotedAt: parsed.data.quotedAt,
        validUntil: parsed.data.validUntil ?? null,
        leadTimeDays: parsed.data.leadTimeDays ?? null,
        paymentTerms: parsed.data.paymentTerms || null,
        source: parsed.data.source || null,
        createdById,
        quoteTags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
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

// ===== 更新报价 =====
export async function updateQuote(
  quoteId: number,
  _prevState: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = quoteCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return {
      status: 'error',
      errors: flat.fieldErrors,
      message: '表单校验失败,请检查标红的字段',
    };
  }

  const tagIds = extractTagIds(formData);
  const existing = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!existing) return { status: 'error', message: '报价不存在' };

  // 权限:只有创建者本人 或 ADMIN 能改
  const user = await requireCurrentUser();
  if (!isOwner(existing, user)) {
    return { status: 'error', message: '只能修改自己创建的报价' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.quote.update({
        where: { id: quoteId },
        data: {
          contactId: parsed.data.contactId ?? null,
          productNameZh: parsed.data.productNameZh,
          productNameRu: parsed.data.productNameRu || null,
          productSpecZh: parsed.data.productSpecZh || null,
          productSpecRu: parsed.data.productSpecRu || null,
          productNameRuAutoTranslated: parsed.data.productNameRuAutoTranslated,
          productSpecRuAutoTranslated: parsed.data.productSpecRuAutoTranslated,
          unitPrice: parsed.data.unitPrice,
          currency: parsed.data.currency,
          unitZh: parsed.data.unitZh || null,
          unitRu: parsed.data.unitRu || null,
          moq: parsed.data.moq ?? null,
          quotedAt: parsed.data.quotedAt,
          validUntil: parsed.data.validUntil ?? null,
          leadTimeDays: parsed.data.leadTimeDays ?? null,
          paymentTerms: parsed.data.paymentTerms || null,
          source: parsed.data.source || null,
        },
      });
      // 重置 tag 关联:删除所有旧的,创建新的
      await tx.quoteTag.deleteMany({ where: { quoteId } });
      if (tagIds.length > 0) {
        await tx.quoteTag.createMany({
          data: tagIds.map((tagId) => ({ quoteId, tagId })),
        });
      }
    });
  } catch (err) {
    return {
      status: 'error',
      message: '保存失败:' + (err instanceof Error ? err.message : '未知错误'),
    };
  }

  revalidatePath(`/suppliers/${existing.supplierId}`);
  redirect(`/suppliers/${existing.supplierId}`);
}

// ===== 归档 / 恢复 =====
async function assertQuoteOwnership(quoteId: number) {
  const existing = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { createdById: true, supplierId: true },
  });
  if (!existing) throw new Error('报价不存在');
  const user = await requireCurrentUser();
  if (!isOwner(existing, user)) throw new Error('只能操作自己创建的报价');
  return existing;
}

export async function archiveQuote(quoteId: number): Promise<void> {
  await assertQuoteOwnership(quoteId);
  const q = await prisma.quote.update({
    where: { id: quoteId },
    data: { status: 'ARCHIVED' },
  });
  revalidatePath(`/suppliers/${q.supplierId}`);
}

export async function restoreQuote(quoteId: number): Promise<void> {
  await assertQuoteOwnership(quoteId);
  const q = await prisma.quote.update({
    where: { id: quoteId },
    data: { status: 'ACTIVE' },
  });
  revalidatePath(`/suppliers/${q.supplierId}`);
}

// ===== 翻译 =====
export type QuoteTranslateField = 'productName' | 'productSpec';

export type TranslateQuoteFieldsResult =
  | { ok: true; results: { field: QuoteTranslateField; translated: string }[] }
  | { ok: false; error: string };

export async function translateQuoteFields(
  input: { field: QuoteTranslateField; text: string }[],
  direction: 'zh-to-ru' | 'ru-to-zh' = 'zh-to-ru',
): Promise<TranslateQuoteFieldsResult> {
  if (input.length === 0) return { ok: true, results: [] };
  const from = direction === 'zh-to-ru' ? 'zh' : 'ru';
  const to = direction === 'zh-to-ru' ? 'ru' : 'zh';
  try {
    const translated = await translateBatch(
      input.map((i) => ({ text: i.text, from, to })),
    );
    return {
      ok: true,
      results: input.map((i, idx) => ({ field: i.field, translated: translated[idx] })),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : '翻译失败',
    };
  }
}