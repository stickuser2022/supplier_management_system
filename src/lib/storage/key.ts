import path from 'node:path';
import crypto from 'node:crypto';
import type { FileType } from '@/generated/prisma/client';

/**
 * 把原始文件名做安全化处理:
 * - 非字母数字下划线短横线的字符替换成 _
 * - 保留扩展名
 * - 截断到 60 字符,避免路径过长
 */
function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext)
    .replace(/[^\w-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 60);
  const safeBase = base || 'file';
  return `${safeBase}${ext}`;
}

/**
 * 根据 FileType 和 owner ID 计算文件存储 key
 *
 * 业务层调用:
 *   const key = keyFor('SUPPLIER_LOGO', supplierId, file.name);
 *   await storage.put(key, buffer, mimeType);
 *
 * 输出举例:
 *   suppliers/123/logo/1736400000000-a3f2b1-company_logo.png
 *   suppliers/123/brochures/1736400000000-a3f2b1-spring_catalog.pdf
 */
export function keyFor(
  type: FileType,
  ownerId: number,
  filename: string,
): string {
  const safe = sanitizeFilename(filename);
  const stamp = Date.now();
  const rand = crypto.randomBytes(3).toString('hex');
  const leaf = `${stamp}-${rand}-${safe}`;

  switch (type) {
    case 'SUPPLIER_LOGO':
      return `suppliers/${ownerId}/logo/${leaf}`;
    case 'SUPPLIER_BROCHURE':
      return `suppliers/${ownerId}/brochures/${leaf}`;
    case 'SUPPLIER_VIDEO':
      return `suppliers/${ownerId}/videos/${leaf}`;
    case 'SUPPLIER_DOC':
      return `suppliers/${ownerId}/docs/${leaf}`;
    case 'QUOTE_IMAGE':
      return `quotes/${ownerId}/images/${leaf}`;
    case 'PAYMENT_SCREENSHOT':
      return `payments/${ownerId}/${leaf}`;
    case 'NOTE_ATTACHMENT':
      return `notes/${ownerId}/${leaf}`;
    case 'TRANSACTION_DOC':
      return `transactions/${ownerId}/${leaf}`;
    case 'OTHER':
      return `misc/${ownerId}/${leaf}`;
    default: {
      const _exhaustive: never = type;
      throw new Error(`Unknown FileType: ${_exhaustive}`);
    }
  }
}

/**
 * 缩略图 key:在原 key 末尾追加 .thumb.webp
 * 例:suppliers/123/logo/xxx.png → suppliers/123/logo/xxx.png.thumb.webp
 *
 * 选 webp:体积小、现代浏览器全支持
 * 选"追加"而非"替换扩展名":排错时一眼能对上原文件,原图删了缩略图也好找
 */
export function thumbKeyFor(originalKey: string): string {
  return `${originalKey}.thumb.webp`;
}