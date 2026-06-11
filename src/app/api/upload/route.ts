import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { translateBatch } from '@/lib/translate';
import { storage, keyFor, thumbKeyFor } from '@/lib/storage';
import type { FileType } from '@/generated/prisma/client';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'node:fs/promises';
import os from 'node:os';

// ffmpeg 绑定 static 二进制路径,免去系统装 ffmpeg
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

/**
 * 视频缩略图生成:抽取第 1 秒一帧 → PNG → sharp 转 webp
 * 用临时文件中转(ffmpeg 要求真实文件路径,不能直接 stream Buffer)
 */
async function generateVideoThumbnail(videoBuffer: Buffer): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const tmpVideoPath = `${tmpDir}/video-${stamp}-${rand}.tmp`;
  const tmpThumbName = `thumb-${stamp}-${rand}.png`;
  const tmpThumbPath = `${tmpDir}/${tmpThumbName}`;

  await fs.writeFile(tmpVideoPath, videoBuffer);
  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(tmpVideoPath)
        .screenshots({
          timestamps: ['1'],
          filename: tmpThumbName,
          folder: tmpDir,
          size: '400x?',
        })
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });
    const pngBuffer = await fs.readFile(tmpThumbPath);
    return await sharp(pngBuffer).webp({ quality: 80 }).toBuffer();
  } finally {
    await fs.unlink(tmpVideoPath).catch(() => {});
    await fs.unlink(tmpThumbPath).catch(() => {});
  }
}


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
// 1. 取当前用户 id:与 supplier-actions.ts 同模式
  //    开发期 session 拿不到时,兜底为 admin user id
  //    阶段 2 完整接入认证后,改为强制要求 session
  const DEV_FALLBACK_ADMIN_ID = 'P3wbHXCGnCMPy0k6LO4paUqASBYRgRQK';
  let userId: string;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    userId = session?.user?.id ?? DEV_FALLBACK_ADMIN_ID;
  } catch {
    userId = DEV_FALLBACK_ADMIN_ID;
  }

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

// 6. 缩略图(图片直接 resize;视频抽帧;其他类型不做)
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
      console.warn('[upload] image thumbnail failed (skip):', err);
      thumbnailKey = null;
    }
  } else if (file.type.startsWith('video/')) {
    try {
      const thumb = await generateVideoThumbnail(buffer);
      thumbnailKey = thumbKeyFor(key);
      await storage.put(thumbnailKey, thumb, 'image/webp');
    } catch (err) {
      console.warn('[upload] video thumbnail failed (skip):', err);
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

// 8. 标题翻译(仅 titleZh 非空时调一次)
  const titleZh =
    typeof titleZhRaw === 'string' && titleZhRaw.trim() ? titleZhRaw.trim() : null;
  let titleRu: string | null = null;
  if (titleZh) {
    try {
      const translated = await translateBatch([
        { text: titleZh, from: 'zh', to: 'ru' },
      ]);
      titleRu = translated[0] ?? null;
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