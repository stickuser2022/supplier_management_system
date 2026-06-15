'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUserId, requireCurrentUser, isOwner } from '@/lib/auth';
import { translateBatch } from '@/lib/translate';
import { tagCreateSchema } from '../_validations/tag-schema';

// ===== 表单状态 =====

export type TagFormState = {
  status: 'idle' | 'success' | 'error';
  errors?: Record<string, string[] | undefined>;
  message?: string;
};

const INITIAL_STATE: TagFormState = { status: 'idle' };

// ===== 创建 =====
// EDITOR 和 ADMIN 都能创建标签(标签是项目级共享资源)
export async function createTag(
  _prev: TagFormState,
  formData: FormData,
): Promise<TagFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = tagCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return { status: 'error', errors: flat.fieldErrors, message: '表单校验失败' };
  }

  const createdById = await requireUserId();

  try {
    await prisma.tag.create({
      data: {
        ...parsed.data,
        createdById,
        needsReview: false, // 直接在标签管理页创建,不需要审核标记
      },
    });
  } catch (err) {
    // 复合唯一约束 (category, nameZh) 冲突
    if (
      err !== null &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      return {
        status: 'error',
        errors: { nameZh: ['同 category 下已存在同名标签'] },
        message: '标签名重复',
      };
    }
    return {
      status: 'error',
      message: '保存失败:' + (err instanceof Error ? err.message : '未知错误'),
    };
  }

  revalidatePath('/tags');
  return { status: 'success' };
}

// ===== 编辑 =====
// 权限:Admin 兜底,EDITOR 只能改自己创建的(系统预置标签不可改)
export async function updateTag(
  tagId: number,
  _prev: TagFormState,
  formData: FormData,
): Promise<TagFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = tagCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return { status: 'error', errors: flat.fieldErrors, message: '表单校验失败' };
  }

  const existing = await prisma.tag.findUnique({
    where: { id: tagId },
    select: { createdById: true },
  });
  if (!existing) return { status: 'error', message: '标签不存在' };

  const user = await requireCurrentUser();
  if (!isOwner(existing, user)) {
    return { status: 'error', message: '只能修改自己创建的标签' };
  }

  try {
    await prisma.tag.update({ where: { id: tagId }, data: parsed.data });
  } catch (err) {
    if (
      err !== null &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      return {
        status: 'error',
        errors: { nameZh: ['同 category 下已存在同名标签'] },
        message: '标签名重复',
      };
    }
    return {
      status: 'error',
      message: '保存失败:' + (err instanceof Error ? err.message : '未知错误'),
    };
  }

  revalidatePath('/tags');
  return { status: 'success' };
}

// ===== 软删除 / 恢复 =====
// 注意:走 isActive,不物理删 —— 因为标签是共享资源,可能还挂在历史供应商/报价上
// 系统预置标签也不能停用(可改可不停)
async function assertTagOwnership(tagId: number) {
  const existing = await prisma.tag.findUnique({
    where: { id: tagId },
    select: { createdById: true },
  });
  if (!existing) throw new Error('标签不存在');
  const user = await requireCurrentUser();
  if (!isOwner(existing, user)) throw new Error('只能操作自己创建的标签');
}

export async function archiveTag(tagId: number): Promise<void> {
  await assertTagOwnership(tagId);
  await prisma.tag.update({ where: { id: tagId }, data: { isActive: false } });
  revalidatePath('/tags');
}

export async function restoreTag(tagId: number): Promise<void> {
  await assertTagOwnership(tagId);
  await prisma.tag.update({ where: { id: tagId }, data: { isActive: true } });
  revalidatePath('/tags');
}

// ===== AI 翻译辅助 =====
// 客户端"翻译"按钮调,只返回结果不入库;提交表单时一起带走
export type TranslateTagNameResult =
  | { ok: true; translated: string }
  | { ok: false; error: string };

export async function translateTagName(
  nameZh: string,
): Promise<TranslateTagNameResult> {
  if (!nameZh.trim()) {
    return { ok: false, error: '中文名为空,无法翻译' };
  }
  try {
    const translated = await translateBatch([
      { text: nameZh, from: 'zh', to: 'ru' },
    ]);
    return { ok: true, translated: translated[0] ?? '' };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : '翻译失败',
    };
  }
}

export { INITIAL_STATE as INITIAL_TAG_FORM_STATE };
