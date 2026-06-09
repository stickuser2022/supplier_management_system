import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { translateBatch } from '@/lib/translate';
import { storage, keyFor, thumbKeyFor } from '@/lib/storage';
import type { FileType } from '@/generated/prisma/client';

// ─── 每个 FileType 的上传约束 ────────────────────────────────
const TYPE_RULES: Record<FileType, { maxBytes: number; allowedMime: RegExp }> = {
  SUPPLIER_LOGO:      { maxBytes:   5 * 1024 * 1024, allowedMime: /^image\/(png|jpeg|webp|gif)$/ },
  SUPPLIER_BROCHURE:  { maxBytes:  30 * 1024 * 1024, allowedMime: /^(image\/(png|jpeg|webp|gif)|application\/pdf)$/ },
  SUPPLIER_DOC:       { maxBytes:  30 * 1024 * 1024, allowedMime: /^(image\/(png|jpeg|webp|gif)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet))$/ },
  SUPPLIER_VIDEO:     { maxBytes: 200 * 1024 * 1024, allowedMime: /^video\// },
  QUOTE_IMAGE:        { maxBytes:  10 * 1024 * 1024, allowedMime: /^image\// },
  PAYMENT_SCREENSHOT: { maxBytes:   5 * 1024 * 1024, allowedMime: /^image\// },
  NOTE_ATTACHMENT:    { maxBytes:  30 * 1024 * 1024, allowedMime: /./ },
  TRANSACTION_DOC:    { maxBytes:  30 * 1024 * 1024, allowedMime: /./ },
  OTHER:              { maxBytes:  30 * 1024 * 1024, allowedMime: /./ },
};

// ─── type → 外键字段映射(决定 ownerId 验证哪张表 + 写哪个 FK)────
function makeOwnerFk(type: FileType, ownerId: number) {
  switch (type) {
    case 'SUPPLIER_LOGO':
    case 'SUPPLIER_BROCHURE':
    case 'SUPPLIER_DOC':
    case 'SUPPLIER_VIDEO':
    case 'OTHER':
      return { supplierId: ownerId };
    case 'QUOTE_IMAGE':
      return { quoteId: ownerId };
    case 'PAYMENT_SCREENSHOT':
      return { paymentId: ownerId };
    case 'NOTE_ATTACHMENT':
      return { noteId: ownerId };
    case 'TRANSACTION_DOC':
      return { transactionId: ownerId };
  }
}

async function ownerExists(type: FileType, ownerId: number): Promise<boolean> {
  switch (type) {
    case 'SUPPLIER_LOGO':
    case 'SUPPLIER_BROCHURE':
    case 'SUPPLIER_DOC':
    case 'SUPPLIER_VIDEO':
    case 'OTHER':
      return !!(await prisma.supplier.findUnique({ where: { id: ownerId }, select: { id: true } }));
    case 'QUOTE_IMAGE':
      return !!(await prisma.quote.findUnique({ where: { id: ownerId }, select: { id: true } }));
    case 'PAYMENT_SCREENSHOT':
      return !!(await prisma.payment.findUnique({ where: { id: ownerId }, select: { id: true } }));
    case 'NOTE_ATTACHMENT':
      return !!(await prisma.note.findUnique({ where: { id: ownerId }, select: { id: true } }));
    case 'TRANSACTION_DOC':
      return !!(await prisma.transaction.findUnique({ where: { id: ownerId }, select: { id: true } }));
  }
}

function revalidateFor(type: FileType, ownerId: number) {
  // 第一片只为 supplier 相关 type 做 revalidate
  // 后续 slice 添加 quote / note / transaction 时再扩
  if (
    type === 'SUPPLIER_LOGO' ||
    type === 'SUPPLIER_BROCHURE' ||
    type === 'SUPPLIER_DOC' ||
    type === 'SUPPLIER_VIDEO' ||
    type === 'OTHER'
  ) {
    revalidatePath(`/suppliers/${ownerId}`);
  }
}

// ─── POST /api/upload ──────────────────────────────────────────
export async function POST(request: NextRequest) {
  // 1. 权限:仅 Admin 可上传
  // ⚠️ 如果你的 supplier-actions.ts 用了"开发期兜底"模式拿 user_id,
  //    这里照搬同样的逻辑,避免没 session 时无法测试
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 });
  }
  const userId = session.user.id;

  // 2. 解析 multipart formData
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 });
  }

  const file = formData.get('file');
  const typeRaw = formData.get('type');
  const ownerIdRaw = formData.get('ownerId');
  const titleZhRaw = formData.get('titleZh');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing or invalid "file" field' }, { status: 400 });
  }
  if (typeof typeRaw !== 'string' || !(typeRaw in TYPE_RULES)) {
    return NextResponse.json({ error: `Invalid "type": ${typeRaw}` }, { status: 400 });
  }
  const type = typeRaw as FileType;
  const ownerId = Number(ownerIdRaw);
  if (!Number.isInteger(ownerId) || ownerId <= 0) {
    return NextResponse.json({ error: `Invalid "ownerId": ${ownerIdRaw}` }, { status: 400 });
  }

  // 3. 文件约束校验
  const rules = TYPE_RULES[type];
  if (file.size > rules.maxBytes) {
    return NextResponse.json(
      { error: `File too large: ${file.size} > ${rules.maxBytes} bytes` },
      { status: 400 },
    );
  }
  if (!rules.allowedMime.test(file.type)) {
    return NextResponse.json(
      { error: `MIME type "${file.type}" not allowed for ${type}` },
      { status: 400 },
    );
  }

  // 4. 验证 owner 实体存在
  if (!(await ownerExists(type, ownerId))) {
    return NextResponse.json(
      { error: `Owner entity not found for ${type} #${ownerId}` },
      { status: 404 },
    );
  }

  // 5. 计算 key + 读字节
  const key = keyFor(type, ownerId, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  // 6. 缩略图(仅图片;失败不阻断主流程)
  let thumbnailKey: string | null = null;
  if (file.type.startsWith('image/')) {
    try {
      const thumb = await sharp(buffer)
        .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      thumbnailKey = thumbKeyFor(key);
      await storage.put(thumbnailKey, thumb, 'image/webp');
    } catch (err) {
      console.warn('[upload] thumbnail failed (skip):', err);
      thumbnailKey = null;
    }
  }

  // 7. 写主文件到存储(失败则清理缩略图)
  try {
    await storage.put(key, buffer, file.type);
  } catch (err) {
    if (thumbnailKey) await storage.delete(thumbnailKey).catch(() => {});
    console.error('[upload] storage.put failed:', err);
    return NextResponse.json({ error: 'Storage write failed' }, { status: 500 });
  }

  // 8. 标题翻译(仅 titleZh 非空时调一次 DeepSeek)
  const titleZh =
    typeof titleZhRaw === 'string' && titleZhRaw.trim() ? titleZhRaw.trim() : null;
  let titleRu: string | null = null;
  if (titleZh) {
    try {
      const [translated] = await translateBatch([titleZh], 'ru');
      titleRu = translated ?? null;
    } catch (err) {
      console.warn('[upload] title translation failed (skip):', err);
    }
  }

  // 9. 写 DB(LOGO 走事务保证唯一)
  try {
    const created = await prisma.$transaction(async (tx) => {
      if (type === 'SUPPLIER_LOGO') {
        // 同一 supplier 下其他 active LOGO 全部归档(软删除)
        await tx.file.updateMany({
          where: { supplierId: ownerId, type: 'SUPPLIER_LOGO', isActive: true },
          data: { isActive: false },
        });
      }
      return tx.file.create({
        data: {
          type,
          ...makeOwnerFk(type, ownerId),
          fileName: file.name,
          storageKey: key,
          mimeType: file.type,
          sizeBytes: file.size,
          thumbnailKey,
          titleZh,
          titleRu,
          titleRuAutoTranslated: true,
          createdById: userId,
        },
      });
    });

    revalidateFor(type, ownerId);

    return NextResponse.json({
      id: created.id,
      type: created.type,
      fileName: created.fileName,
      url: `/api/files/${created.id}`,
      thumbnailUrl: thumbnailKey ? `/api/files/${created.id}?thumb=1` : null,
    });
  } catch (err) {
    // DB 失败,清理已写的存储,避免孤儿文件
    await storage.delete(key).catch(() => {});
    if (thumbnailKey) await storage.delete(thumbnailKey).catch(() => {});
    console.error('[upload] db create failed:', err);
    return NextResponse.json({ error: 'Database write failed' }, { status: 500 });
  }
}