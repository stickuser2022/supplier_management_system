//这是一个 Next.js Server Action，用来处理“新建供应商”的表单提交：
// 接收表单数据 → 用 Zod 校验 → 获取当前用户 → 写入数据库 → 刷新列表缓存 → 跳转到供应商列表页。
'use server';// 这个指令告诉 Next.js 这是一个 Server Action,只能在服务器上运行,不能被浏览器直接访问

import { z } from 'zod';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { supplierCreateSchema } from '../_validations/supplier-schema';

// 开发期兜底:在登录页面还没做好之前,Server Action 拿不到 session,
// 临时用数据库里已存在的 admin user id。等登录页面接入后,这条 fallback 自然失效。
const DEV_FALLBACK_ADMIN_ID = 'P3wbHXCGnCMPy0k6LO4paUqASBYRgRQK';

// 表单提交后的状态形状,前端 useActionState 按这个形状取数据
export type SupplierFormState = {
  status: 'idle' | 'success' | 'error';
  errors?: Record<string, string[] | undefined>;
  message?: string;
};
//这定义了表单提交后返回给前端的状态形状。

// 比如提交失败，可能返回：
/*
{
  status: 'error',
  errors: { code: ['供应商编号已存在,请换一个'] },
  message: '保存失败:供应商编号冲突',
}
*/

export const INITIAL_SUPPLIER_FORM_STATE: SupplierFormState = { status: 'idle' };//表单初始状态，提交前是 idle，没有错误信息和提示消息。

export async function createSupplier(
  _prevState: SupplierFormState,
  formData: FormData,//这是从前端表单提交过来的原始 FormData 对象,比如nameZh = 深圳某某科技有限公司
                        //provinceZh = 广东省
                        //cityZh = 深圳市
                        //latitude = 22.54
                        //longitude = 114.05
): Promise<SupplierFormState> {
  // 1. FormData 转普通对象 + Zod 校验
  const raw = Object.fromEntries(formData);//FormData 是浏览器提供的接口，不能直接用在服务器上。Object.fromEntries(formData) 把它转换成普通对象,比如 { nameZh: '深圳某某科技有限公司', provinceZh: '广东省', cityZh: '深圳市', latitude: '22.54', longitude: '114.05' }
  const parsed = supplierCreateSchema.safeParse(raw);//用我们定义的 Zod schema 来校验这个对象,确保它符合我们预期的格式和规则。safeParse 方法会返回一个对象，包含 success 字段表示校验是否通过，以及 data 或 error 字段分别包含解析后的数据或错误信息。
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return {
      status: 'error',
      errors: flat.fieldErrors,
      message: '表单校验失败,请检查标红的字段',
    };
  }

  // 2. 取当前登录用户 id;没有 session 时用开发期 admin 兜底
  let createdById: string;//先声明一个变量，等下用来保存创建人 ID
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user) {
      createdById = session.user.id;
    } else {
      console.warn('[createSupplier] 无 session,使用开发期 admin 兜底');
      createdById = DEV_FALLBACK_ADMIN_ID;
    }
  } catch (err) {
    console.warn('[createSupplier] 读 session 失败,使用兜底:', err);
    createdById = DEV_FALLBACK_ADMIN_ID;
  }
  // 尝试读取 session
  // → 如果读到了用户，就用当前用户 ID
  // → 如果没读到，就用开发期兜底 admin ID
  // → 如果读取过程报错，也用兜底 admin ID
  // 3. 写数据库
  try {
    await prisma.supplier.create({
      data: {
        ...parsed.data,
        createdById,
      },
    });
  } catch (err) {
    // Prisma 唯一约束冲突(供应商编号 code 已存在)
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

  // 4. 让列表页缓存失效,然后跳转(redirect 必须在 try/catch 外)
  revalidatePath('/suppliers');
  redirect('/suppliers');
}