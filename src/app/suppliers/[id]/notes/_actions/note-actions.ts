'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { logActionError } from '@/lib/utils';
import { requireUserId, requireCurrentUser, isOwner } from '@/lib/auth';
import { translateBatch } from '@/lib/translate';
import { noteCreateSchema } from '../_validations/note-schema';

export type NoteFormState = {
  status: 'idle' | 'success' | 'error';
  errors?: Record<string, string[] | undefined>;
  message?: string;
};

// ===== 创建沟通记录 =====
export async function createNote(
  supplierId: number,
  _prevState: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = noteCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return {
      status: 'error',
      errors: flat.fieldErrors,
      message: '表单校验失败,请检查标红的字段',
    };
  }

  const createdById = await requireUserId();

  try {
    await prisma.note.create({
      data: {
        supplierId,
        contactId: parsed.data.contactId ?? null,
        quoteId: parsed.data.quoteId ?? null,
        contentZh: parsed.data.contentZh,
        contentRu: parsed.data.contentRu || null,
        contentRuAutoTranslated: parsed.data.contentRuAutoTranslated,
        happenedAt: parsed.data.happenedAt,
        createdById,
      },
    });
  } catch (err) {    logActionError('createNote', err);    return {
      status: 'error',
      message: '保存失败:' + (err instanceof Error ? err.message : '未知错误'),
    };
  }

  revalidatePath(`/suppliers/${supplierId}`);
  redirect(`/suppliers/${supplierId}`);
}

// ===== 更新沟通记录 =====
export async function updateNote(
  noteId: number,
  _prevState: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = noteCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return {
      status: 'error',
      errors: flat.fieldErrors,
      message: '表单校验失败,请检查标红的字段',
    };
  }

  const existing = await prisma.note.findUnique({ where: { id: noteId } });
  if (!existing) return { status: 'error', message: '记录不存在' };

  // 权限:只有创建者本人 或 ADMIN 能改
  const user = await requireCurrentUser();
  if (!isOwner(existing, user)) {
    return { status: 'error', message: '只能修改自己创建的沟通记录' };
  }

  try {
    await prisma.note.update({
      where: { id: noteId },
      data: {
        contactId: parsed.data.contactId ?? null,
        quoteId: parsed.data.quoteId ?? null,
        contentZh: parsed.data.contentZh,
        contentRu: parsed.data.contentRu || null,
        contentRuAutoTranslated: parsed.data.contentRuAutoTranslated,
        happenedAt: parsed.data.happenedAt,
      },
    });
  } catch (err) {
    logActionError('updateNote', err);
    return {
      status: 'error',
      message: '保存失败:' + (err instanceof Error ? err.message : '未知错误'),
    };
  }

  revalidatePath(`/suppliers/${existing.supplierId}`);
  redirect(`/suppliers/${existing.supplierId}`);
}

// ===== 归档 / 恢复(走 isActive)=====
// 只有创建者本人 或 ADMIN 能操作

async function assertNoteOwnership(noteId: number) {
  const existing = await prisma.note.findUnique({
    where: { id: noteId },
    select: { createdById: true, supplierId: true },
  });
  if (!existing) throw new Error('沟通记录不存在');
  const user = await requireCurrentUser();
  if (!isOwner(existing, user)) throw new Error('只能操作自己创建的沟通记录');
  return existing;
}

export async function archiveNote(noteId: number): Promise<void> {
  await assertNoteOwnership(noteId);
  const n = await prisma.note.update({
    where: { id: noteId },
    data: { isActive: false },
  });
  revalidatePath(`/suppliers/${n.supplierId}`);
}

export async function restoreNote(noteId: number): Promise<void> {
  await assertNoteOwnership(noteId);
  const n = await prisma.note.update({
    where: { id: noteId },
    data: { isActive: true },
  });
  revalidatePath(`/suppliers/${n.supplierId}`);
}

// ===== 翻译 =====
export type NoteTranslateField = 'content';

export type TranslateNoteFieldsResult =
  | { ok: true; results: { field: NoteTranslateField; translated: string }[] }
  | { ok: false; error: string };

export async function translateNoteFields(
  input: { field: NoteTranslateField; text: string }[],
  direction: 'zh-to-ru' | 'ru-to-zh' = 'zh-to-ru',
): Promise<TranslateNoteFieldsResult> {
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