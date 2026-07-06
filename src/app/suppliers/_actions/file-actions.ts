'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { logActionError } from '@/lib/utils';
import { requireCurrentUser, isOwner } from '@/lib/auth';
import { translateBatch } from '@/lib/translate';
import { fileTitleSchema } from '../_validations/file-schema';
import { redirect } from 'next/navigation';
import { storage } from '@/lib/storage';

// ─── 文件级权限检查 helper ─────────────────────────────────────
// 凡是改/归档/删除文件的动作,都先校验当前用户是否有权操作此文件。
// 规则:文件的 createdById 是上传者;只有上传者本人或 ADMIN 能改。
async function assertFileOwnership(fileId: number) {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: { createdById: true },
  });
  if (!file) return { ok: false as const, error: '文件不存在' };
  const user = await requireCurrentUser();
  if (!isOwner(file, user)) return { ok: false as const, error: '只能操作自己上传的文件' };
  return { ok: true as const };
}

// ─── 清除 LOGO(原有,保留)────────────────────────────────────
// 这是 supplier 级动作,检查 supplier 的 createdById
export async function clearSupplierLogo(
  supplierId: number,
): Promise<{ ok?: true; error?: string }> {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { createdById: true },
    });
    if (!supplier) return { error: '供应商不存在' };
    const user = await requireCurrentUser();
    if (!isOwner(supplier, user)) return { error: '只能修改自己创建的供应商' };

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
    select: {
      supplierId: true,
      quoteId: true,
      noteId: true,
      transactionId: true,
      paymentId: true,
    },
  });
  if (!file) return null;
  if (file.supplierId) return file.supplierId;
  if (file.quoteId) {
    const quote = await prisma.quote.findUnique({
      where: { id: file.quoteId },
      select: { supplierId: true },
    });
    return quote?.supplierId ?? null;
  }
  if (file.noteId) {
    const note = await prisma.note.findUnique({
      where: { id: file.noteId },
      select: { supplierId: true },
    });
    return note?.supplierId ?? null;
  }
  if (file.transactionId) {
    const tx = await prisma.transaction.findUnique({
      where: { id: file.transactionId },
      select: { supplierId: true },
    });
    return tx?.supplierId ?? null;
  }
  if (file.paymentId) {
    const payment = await prisma.payment.findUnique({
      where: { id: file.paymentId },
      select: { transaction: { select: { supplierId: true } } },
    });
    return payment?.transaction?.supplierId ?? null;
  }
  return null;
}

// ─── 归档文件(软删除)─────────────────────────────────────────
export async function archiveFile(
  fileId: number,
): Promise<{ ok?: true; error?: string }> {
  try {
    const check = await assertFileOwnership(fileId);
    if (!check.ok) return { error: check.error };

    const supplierId = await getFileSupplierId(fileId);
    if (!supplierId) return { error: '文件不存在' };

    await prisma.file.update({
      where: { id: fileId },
      data: { isActive: false, isCover: false },
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
    const check = await assertFileOwnership(fileId);
    if (!check.ok) return { error: check.error };

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

  const supplierId = await getFileSupplierId(fileId);
  if (!supplierId) {
    return { status: 'error', message: '文件不存在' };
  }

  // 权限:只有上传者本人 或 ADMIN 能改文件标题
  const check = await assertFileOwnership(fileId);
  if (!check.ok) {
    return { status: 'error', message: check.error };
  }

  try {
    await prisma.file.update({
      where: { id: fileId },
      data: {
        titleZh: parsed.data.titleZh,
        titleRu: parsed.data.titleRu,
        titleRuAutoTranslated: parsed.data.titleRuAutoTranslated,
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
// ─── 设置报价图封面 ───────────────────────────────────────────
// 事务保证同一 Quote 下只有一个 is_cover=true
export async function setQuoteImageCover(
  fileId: number,
): Promise<{ ok?: true; error?: string }> {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: { quoteId: true, type: true, isActive: true },
  });
  if (!file) return { error: '文件不存在' };
  if (file.type !== 'QUOTE_IMAGE') return { error: '类型不对' };
  if (!file.quoteId) return { error: '文件未关联报价' };
  if (!file.isActive) return { error: '已归档的文件无法设为封面' };

  try {
    await prisma.$transaction(async (tx) => {
      // 清掉同 Quote 下其他 active 的封面
      await tx.file.updateMany({
        where: {
          quoteId: file.quoteId,
          type: 'QUOTE_IMAGE',
          isActive: true,
          isCover: true,
        },
        data: { isCover: false },
      });
      // 把目标置为封面
      await tx.file.update({
        where: { id: fileId },
        data: { isCover: true },
      });
    });

    // 反查 supplierId,revalidate 详情页(QuotesList 在那里显示封面)
    const quote = await prisma.quote.findUnique({
      where: { id: file.quoteId },
      select: { supplierId: true },
    });
    if (quote) revalidatePath(`/suppliers/${quote.supplierId}`);

    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : '设置封面失败' };
  }
}

// ─── 报价图排序(上/下移一位)────────────────────────────────
// 每次移动后,把所有非封面同类图重新编号 0..N-1,简单可预测
export async function moveQuoteImage(
  fileId: number,
  direction: 'up' | 'down',
): Promise<{ ok?: true; error?: string }> {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: { quoteId: true, type: true, isActive: true, isCover: true },
  });
  if (!file) return { error: '文件不存在' };
  if (file.type !== 'QUOTE_IMAGE') return { error: '类型不对' };
  if (!file.quoteId) return { error: '文件未关联报价' };
  if (!file.isActive) return { error: '已归档的文件无法排序' };
  if (file.isCover) return { error: '封面图位置固定,无法排序' };

  // 拉同 Quote 下所有非封面、active 的报价图,按当前显示顺序
  const siblings = await prisma.file.findMany({
    where: {
      quoteId: file.quoteId,
      type: 'QUOTE_IMAGE',
      isActive: true,
      isCover: false,
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    select: { id: true },
  });

  const idx = siblings.findIndex((s) => s.id === fileId);
  if (idx === -1) return { error: '排序异常,刷新页面后重试' };

  const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= siblings.length) {
    return { ok: true }; // 边界,no-op
  }

  // 交换位置
  const reordered = [...siblings];
  [reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]];

  try {
    // 整组重新编号 0..N-1,一致性最稳
    await prisma.$transaction(
      reordered.map((s, i) =>
        prisma.file.update({
          where: { id: s.id },
          data: { sortOrder: i },
        }),
      ),
    );

    const quote = await prisma.quote.findUnique({
      where: { id: file.quoteId },
      select: { supplierId: true },
    });
    if (quote) revalidatePath(`/suppliers/${quote.supplierId}`);

    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : '排序失败' };
  }
}

export async function physicallyDeleteFile(
  fileId: number,
): Promise<{ ok?: true; error?: string }> {
  try {
    const check = await assertFileOwnership(fileId);
    if (!check.ok) return { error: check.error };

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: {
        storageKey: true,
        thumbnailKey: true,
        supplierId: true,
        quoteId: true,
        noteId: true,
        transactionId: true,
        paymentId: true,
      },
    });
    if (!file) return { error: '文件不存在' };

    // 先反查 supplierId(为 revalidate 用),再删
    const supplierId = await getFileSupplierId(fileId);

    // 删 DB 行(file 表)
    await prisma.file.delete({ where: { id: fileId } });

    // 删磁盘原文件 + 缩略图(失败不阻断)
    await storage.delete(file.storageKey).catch(() => {});
    if (file.thumbnailKey) {
      await storage.delete(file.thumbnailKey).catch(() => {});
    }

    if (supplierId) revalidatePath(`/suppliers/${supplierId}`);
    return { ok: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : '物理删除失败',
    };
  }
}