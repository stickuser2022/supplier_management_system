'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

/**
 * 清除某供应商的当前 LOGO
 * 只做软删除(isActive=false),不动磁盘文件(物理清理留给将来的批量任务)
 *
 * 阶段 2 接入认证后再加 role 检查,当前与 archiveSupplier 同模式:无 auth gate
 */
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
    return {
      error: err instanceof Error ? err.message : '清除失败',
    };
  }
}