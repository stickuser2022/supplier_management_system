'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { translateBatch } from '@/lib/translate';
import { fileTitleSchema } from '../_validations/file-schema';

// ─── 清除 LOGO(原有,保留)────────────────────────────────────
export async function clearSupplierLogo(
  supplierId: number,
): Promise<{ ok?: true; error?: string }> {
  try {
    await prisma.file.updateMany({
      where: {
        supplierId,
        type: 'SUPPLIER_LOGO',
        isActive: true,
      },
      data: { isActive: false },
    });
    revalidatePath(`/suppliers/${supplierId}`);
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : '清除失败' };
  }
}

// ─── 工具:从 fileId 拿到 supplierId 用于 revalidate ──────────
async function getFileSupplierId(fileId: number): Promise<number | null> {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: { supplierId: true },
  });
  return file?.supplierId ?? null;
}

// ─── 归档文件(软删除)─────────────────────────────────────────
export async function archiveFile(
  fileId: number,
): Promise<{ ok?: true; error?: string }> {
  try {
    const supplierId = await getFileSupplierId(fileId);
    if (!supplierId) return { error: '文件不存在' };

    await prisma.file.update({
      where: { id: fileId },
      data: { isActive: false },
    });
    revalidatePath(`/suppliers/${supplierId}`);
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : '归档失败' };
  }
}

// ─── 恢复文件 ─────────────────────────────────────────────────
export async function restoreFile(
  fileId: number,
): Promise<{ ok?: true; error?: string }> {
  try {
    const supplierId = await getFileSupplierId(fileId);
    if (!supplierId) return { error: '文件不存在' };

    await prisma.file.update({
      where: { id: fileId },
      data: { isActive: true },
    });
    revalidatePath(`/suppliers/${supplierId}`);
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : '恢复失败' };
  }
}

// ─── 更新文件标题(走 Server Action,非上传)──────────────────
export type FileTitleFormState = {
  status: 'idle' | 'success' | 'error';
  errors?: Record<string, string[] | undefined>;
  message?: string;
};

export async function updateFileTitle(
  fileId: number,
  _prevState: FileTitleFormState,
  formData: FormData,
): Promise<FileTitleFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = fileTitleSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return {
      status: 'error',
      errors: flat.fieldErrors,
      message: '表单校验失败',
    };
  }

  try {
    const supplierId = await getFileSupplierId(fileId);
    if (!supplierId) {
      return { status: 'error', message: '文件不存在' };
    }

    await prisma.file.update({
      where: { id: fileId },
      data: {
        titleZh: parsed.data.titleZh,
        titleRu: parsed.data.titleRu,
        titleRuAutoTranslated: parsed.data.titleRuAutoTranslated,
      },
    });

    revalidatePath(`/suppliers/${supplierId}`);
    return { status: 'success' };
  } catch (err) {
    return {
      status: 'error',
      message: '保存失败:' + (err instanceof Error ? err.message : '未知错误'),
    };
  }
}

// ─── 触发文件标题的 AI 翻译(供编辑页"翻译"按钮调用)──────────
// 与 Supplier name 翻译同模式:客户端拿到结果填进表单,提交时一并保存
export type TranslateFileTitleResult =
  | { ok: true; translated: string }
  | { ok: false; error: string };

export async function translateFileTitle(
  titleZh: string,
): Promise<TranslateFileTitleResult> {
  if (!titleZh.trim()) {
    return { ok: false, error: '中文标题为空,无法翻译' };
  }
  try {
    const translated = await translateBatch([
      { text: titleZh, from: 'zh', to: 'ru' },
    ]);
    return { ok: true, translated: translated[0] };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : '翻译失败',
    };
  }
}