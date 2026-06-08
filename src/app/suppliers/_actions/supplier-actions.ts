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

// ===== 编辑 / 停用 / 恢复 =====

// 编辑供应商:用 .bind(null, id) 把 id 预先绑进去,使签名与 createSupplier 一致
// 注意:不接受 code 修改(D3)、不修改 createdById(原创建者保留)
export async function updateSupplier(
  id: number,
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

  try {
    await prisma.supplier.update({
      where: { id },
      data: {
        // 显式列出可改字段,刻意不包括 code 和 createdById
        nameZh: parsed.data.nameZh,
        nameRu: parsed.data.nameRu || null,
        nameRuAutoTranslated: parsed.data.nameRuAutoTranslated,
        shortNameZh: parsed.data.shortNameZh || null,
        shortNameRu: parsed.data.shortNameRu || null,
        shortNameRuAutoTranslated: parsed.data.shortNameRuAutoTranslated,
        provinceZh: parsed.data.provinceZh,
        provinceRu: parsed.data.provinceRu || null,
        provinceRuAutoTranslated: parsed.data.provinceRuAutoTranslated,
        cityZh: parsed.data.cityZh,
        cityRu: parsed.data.cityRu || null,
        cityRuAutoTranslated: parsed.data.cityRuAutoTranslated,
        districtZh: parsed.data.districtZh || null,
        districtRu: parsed.data.districtRu || null,
        districtRuAutoTranslated: parsed.data.districtRuAutoTranslated,
        addressZh: parsed.data.addressZh || null,
        addressRu: parsed.data.addressRu || null,
        addressRuAutoTranslated: parsed.data.addressRuAutoTranslated,
        descriptionZh: parsed.data.descriptionZh || null,
        descriptionRu: parsed.data.descriptionRu || null,
        descriptionRuAutoTranslated: parsed.data.descriptionRuAutoTranslated,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        cooperationLevel: parsed.data.cooperationLevel,
        discoveredVia: parsed.data.discoveredVia,
        website: parsed.data.website || null,
      },
    });
  } catch (err) {
    return {
      status: 'error',
      message: '保存失败:' + (err instanceof Error ? err.message : '未知错误'),
    };
  }

  revalidatePath('/suppliers');
  revalidatePath(`/suppliers/${id}/edit`);
  redirect('/suppliers');
}

// 停用供应商(软删除):isActive = false
export async function archiveSupplier(id: number): Promise<void> {
  await prisma.supplier.update({
    where: { id },
    data: { isActive: false },
  });
  revalidatePath('/suppliers');
}

// 恢复供应商:isActive = true
export async function restoreSupplier(id: number): Promise<void> {
  await prisma.supplier.update({
    where: { id },
    data: { isActive: true },
  });
  revalidatePath('/suppliers');
}