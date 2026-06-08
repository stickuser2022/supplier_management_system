'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { translateBatch } from '@/lib/translate';
import { supplierCreateSchema } from '../_validations/supplier-schema';

// 开发期兜底:better-auth session 拿不到时,用已存在的 admin user id
const DEV_FALLBACK_ADMIN_ID = 'P3wbHXCGnCMPy0k6LO4paUqASBYRgRQK';

// ===== 创建供应商相关 =====

export type SupplierFormState = {
  status: 'idle' | 'success' | 'error';
  errors?: Record<string, string[] | undefined>;
  message?: string;
};


export async function createSupplier(
  _prevState: SupplierFormState,
  formData: FormData,
): Promise<SupplierFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = supplierCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return {
      status: 'error',
      errors: flat.fieldErrors,
      message: '表单校验失败,请检查标红的字段',
    };
  }

  // 取当前登录用户 id;无 session 用 admin 兜底
  let createdById: string;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    createdById = session?.user?.id ?? DEV_FALLBACK_ADMIN_ID;
  } catch {
    createdById = DEV_FALLBACK_ADMIN_ID;
  }

  // 俄文字段空字符串转 null,数据库存 null 比 "" 更干净
  const data = {
    ...parsed.data,
    nameRu: parsed.data.nameRu || null,
    shortNameRu: parsed.data.shortNameRu || null,
    provinceRu: parsed.data.provinceRu || null,
    cityRu: parsed.data.cityRu || null,
    districtRu: parsed.data.districtRu || null,
    addressRu: parsed.data.addressRu || null,
    descriptionRu: parsed.data.descriptionRu || null,
    createdById,
  };

  try {
    await prisma.supplier.create({ data });
  } catch (err) {
    if (
      err !== null &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      return {
        status: 'error',
        errors: { code: ['供应商编号已存在,请换一个'] },
        message: '保存失败:供应商编号冲突',
      };
    }
    return {
      status: 'error',
      message: '保存失败:' + (err instanceof Error ? err.message : '未知错误'),
    };
  }

  revalidatePath('/suppliers');
  redirect('/suppliers');
}

// ===== 翻译相关 =====

// 7 个可翻译的字段名(简称,不含 Zh/Ru 后缀)
export type SupplierTranslateField =
  | 'name'
  | 'shortName'
  | 'province'
  | 'city'
  | 'district'
  | 'address'
  | 'description';

export type TranslateSupplierFieldsResult =
  | {
      ok: true;
      results: { field: SupplierTranslateField; translated: string }[];
    }
  | { ok: false; error: string };

// 客户端按钮点击后调它,把待翻译的字段送来,返回俄文结果
export async function translateSupplierFields(
  input: { field: SupplierTranslateField; text: string }[],
): Promise<TranslateSupplierFieldsResult> {
  if (input.length === 0) {
    return { ok: true, results: [] };
  }

  try {
    const translated = await translateBatch(
      input.map((item) => ({ text: item.text, from: 'zh', to: 'ru' })),
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