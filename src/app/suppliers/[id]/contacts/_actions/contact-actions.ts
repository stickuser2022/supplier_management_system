'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { logActionError } from '@/lib/utils';
import { requireUserId, requireCurrentUser, isOwner } from '@/lib/auth';
import { translateBatch } from '@/lib/translate';
import { contactCreateSchema } from '../_validations/contact-schema';

// ===== 表单状态 =====

export type ContactFormState = {
  status: 'idle' | 'success' | 'error';
  errors?: Record<string, string[] | undefined>;
  message?: string;
};

// ===== 共用工具 =====

function cleanEmpty<T extends Record<string, unknown>>(obj: T): T {
  // 把可选字符串字段的 "" 转 null,数据库存 null 比 "" 干净
  const out = { ...obj };
  for (const k of Object.keys(out)) {
    if (out[k] === '') (out as Record<string, unknown>)[k] = null;
  }
  return out;
}

// ===== 创建联系人 =====
export async function createContact(
  supplierId: number,
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = contactCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return {
      status: 'error',
      errors: flat.fieldErrors,
      message: '表单校验失败,请检查标红的字段',
    };
  }

  const createdById = await requireUserId();
  const data = cleanEmpty({
    ...parsed.data,
    nameRu: parsed.data.nameRu || null,
    roleZh: parsed.data.roleZh || null,
    roleRu: parsed.data.roleRu || null,
    phone: parsed.data.phone || null,
    wechat: parsed.data.wechat || null,
    email: parsed.data.email || null,
    whatsapp: parsed.data.whatsapp || null,
    telegram: parsed.data.telegram || null,
    qq: parsed.data.qq || null,
    supplierId,
    createdById,
  });

  try {
    await prisma.$transaction(async (tx) => {
      const newContact = await tx.contact.create({ data });
      if (parsed.data.isPrimary) {
        // 设为主要:把同 supplier 下其他联系人的 isPrimary 全置 false
        await tx.contact.updateMany({
          where: { supplierId, NOT: { id: newContact.id } },
          data: { isPrimary: false },
        });
      }
    });
  } catch (err) {
    logActionError('createContact', err);
    return {
      status: 'error',
      message: '保存失败:' + (err instanceof Error ? err.message : '未知错误'),
    };
  }

  revalidatePath(`/suppliers/${supplierId}`);
  redirect(`/suppliers/${supplierId}`);
}

// ===== 更新联系人 =====
export async function updateContact(
  contactId: number,
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = contactCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return {
      status: 'error',
      errors: flat.fieldErrors,
      message: '表单校验失败,请检查标红的字段',
    };
  }

  // 拿 supplierId(更新时不允许改归属)+ 顺手做权限检查
  const existing = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!existing) {
    return { status: 'error', message: '联系人不存在' };
  }
  const supplierId = existing.supplierId;

  // 权限:只有创建者本人 或 ADMIN 能改
  const user = await requireCurrentUser();
  if (!isOwner(existing, user)) {
    return { status: 'error', message: '只能修改自己创建的联系人' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.contact.update({
        where: { id: contactId },
        data: {
          nameZh: parsed.data.nameZh,
          nameRu: parsed.data.nameRu || null,
          roleZh: parsed.data.roleZh || null,
          roleRu: parsed.data.roleRu || null,
          nameRuAutoTranslated: parsed.data.nameRuAutoTranslated,
          roleRuAutoTranslated: parsed.data.roleRuAutoTranslated,
          phone: parsed.data.phone || null,
          wechat: parsed.data.wechat || null,
          email: parsed.data.email || null,
          whatsapp: parsed.data.whatsapp || null,
          telegram: parsed.data.telegram || null,
          qq: parsed.data.qq || null,
          isPrimary: parsed.data.isPrimary,
        },
      });
      if (parsed.data.isPrimary) {
        await tx.contact.updateMany({
          where: { supplierId, NOT: { id: contactId } },
          data: { isPrimary: false },
        });
      }
    });
  } catch (err) {
    logActionError('updateContact', err);
    return {
      status: 'error',
      message: '保存失败:' + (err instanceof Error ? err.message : '未知错误'),
    };
  }

  revalidatePath(`/suppliers/${supplierId}`);
  redirect(`/suppliers/${supplierId}`);
}

// ===== 归档 / 恢复 / 设为主要 =====
// archive/restore/setPrimary 都属于编辑动作,只有创建者本人或 ADMIN 能操作

async function assertContactOwnership(contactId: number) {
  const existing = await prisma.contact.findUnique({
    where: { id: contactId },
    select: { createdById: true, supplierId: true },
  });
  if (!existing) throw new Error('联系人不存在');
  const user = await requireCurrentUser();
  if (!isOwner(existing, user)) throw new Error('只能操作自己创建的联系人');
  return existing;
}

export async function archiveContact(contactId: number): Promise<void> {
  await assertContactOwnership(contactId);
  const c = await prisma.contact.update({
    where: { id: contactId },
    data: { status: 'ARCHIVED' },
  });
  revalidatePath(`/suppliers/${c.supplierId}`);
}

export async function restoreContact(contactId: number): Promise<void> {
  await assertContactOwnership(contactId);
  const c = await prisma.contact.update({
    where: { id: contactId },
    data: { status: 'ACTIVE' },
  });
  revalidatePath(`/suppliers/${c.supplierId}`);
}

export async function setPrimaryContact(contactId: number): Promise<void> {
  await assertContactOwnership(contactId);
  const c = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!c) return;
  await prisma.$transaction([
    prisma.contact.updateMany({
      where: { supplierId: c.supplierId, NOT: { id: contactId } },
      data: { isPrimary: false },
    }),
    prisma.contact.update({
      where: { id: contactId },
      data: { isPrimary: true },
    }),
  ]);
  revalidatePath(`/suppliers/${c.supplierId}`);
}

// ===== 翻译 =====
export type ContactTranslateField = 'name' | 'role';

export type TranslateContactFieldsResult =
  | { ok: true; results: { field: ContactTranslateField; translated: string }[] }
  | { ok: false; error: string };

export async function translateContactFields(
  input: { field: ContactTranslateField; text: string }[],
  direction: 'zh-to-ru' | 'ru-to-zh' = 'zh-to-ru',
): Promise<TranslateContactFieldsResult> {
  if (input.length === 0) return { ok: true, results: [] };
  const from = direction === 'zh-to-ru' ? 'zh' : 'ru';
  const to = direction === 'zh-to-ru' ? 'ru' : 'zh';
  try {
    const translated = await translateBatch(
      input.map((item) => ({ text: item.text, from, to })),
    );
    return {
      ok: true,
      results: input.map((item, i) => ({
        field: item.field,
        translated: translated[i],
      })),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : '翻译失败',
    };
  }
}