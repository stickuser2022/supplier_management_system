'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { logActionError } from '@/lib/utils';
import { requireUserId, requireCurrentUser, isOwner } from '@/lib/auth';
import { translateBatch } from '@/lib/translate';
import { originalIntentSchema } from '../_validations/original-intent-schema';

// ===== 表单状态 =====

export type OriginalIntentFormState = {
  status: 'idle' | 'success' | 'error';
  errors?: Record<string, string[] | undefined>;
  message?: string;
};

// ===== 保存原始意图（创建 / 更新合一，因为是一对一） =====

export async function saveOriginalIntent(
  supplierId: number,
  _prevState: OriginalIntentFormState,
  formData: FormData,
): Promise<OriginalIntentFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = originalIntentSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return {
      status: 'error',
      errors: flat.fieldErrors,
      message: '表单校验失败，请检查标红的字段',
    };
  }

  const userId = await requireUserId();

  // 权限：检查 supplier 是否存在 + 创建者或 ADMIN
  const existing = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { createdById: true, isActive: true },
  });
  if (!existing || !existing.isActive) {
    return { status: 'error', message: '供应商不存在或已停用' };
  }
  const user = await requireCurrentUser();
  if (!isOwner(existing, user)) {
    return { status: 'error', message: '只能编辑自己创建的供应商' };
  }

  const data = {
    originalIntentProductNameZh: parsed.data.productNameZh || null,
    originalIntentProductNameRu: parsed.data.productNameRu || null,
    originalIntentOverviewZh: parsed.data.overviewZh || null,
    originalIntentOverviewRu: parsed.data.overviewRu || null,
    originalIntentProductNameRuAutoTranslated: parsed.data.productNameRuAutoTranslated,
    originalIntentOverviewRuAutoTranslated: parsed.data.overviewRuAutoTranslated,
  };

  try {
    await prisma.supplier.update({
      where: { id: supplierId },
      data,
    });
  } catch (err) {
    logActionError('saveOriginalIntent', err);
    return {
      status: 'error',
      message: '保存失败：' + (err instanceof Error ? err.message : '未知错误'),
    };
  }

  revalidatePath(`/suppliers/${supplierId}`);
  redirect(`/suppliers/${supplierId}`);
}

// ===== 翻译 =====

export type OriginalIntentTranslateField = 'productName' | 'overview';

export type TranslateOriginalIntentFieldsResult =
  | { ok: true; results: { field: OriginalIntentTranslateField; translated: string }[] }
  | { ok: false; error: string };

export async function translateOriginalIntentFields(
  input: { field: OriginalIntentTranslateField; text: string }[],
  direction: 'zh-to-ru' | 'ru-to-zh' = 'zh-to-ru',
): Promise<TranslateOriginalIntentFieldsResult> {
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

// ===== 清除原始意图（物理清空，非归档） =====

export async function clearOriginalIntent(
  supplierId: number,
): Promise<{ ok?: true; error?: string }> {
  // 权限检查
  const existing = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { createdById: true, isActive: true },
  });
  if (!existing || !existing.isActive) {
    return { error: '供应商不存在或已停用' };
  }
  const user = await requireCurrentUser();
  if (!isOwner(existing, user)) {
    return { error: '只能清除自己创建的供应商的原始意图' };
  }

  try {
    await prisma.$transaction([
      // 清空 Supplier 上的 6 个原始意图字段
      prisma.supplier.update({
        where: { id: supplierId },
        data: {
          originalIntentProductNameZh: null,
          originalIntentProductNameRu: null,
          originalIntentOverviewZh: null,
          originalIntentOverviewRu: null,
          originalIntentProductNameRuAutoTranslated: true,
          originalIntentOverviewRuAutoTranslated: true,
        },
      }),
      // 归档所有关联的原始意图图片
      prisma.file.updateMany({
        where: { supplierId, type: 'ORIGINAL_INTENT_IMAGE', isActive: true },
        data: { isActive: false },
      }),
    ]);
    revalidatePath(`/suppliers/${supplierId}`);
    return { ok: true };
  } catch (err) {
    logActionError('clearOriginalIntent', err);
    return { error: err instanceof Error ? err.message : '清除失败' };
  }
}
