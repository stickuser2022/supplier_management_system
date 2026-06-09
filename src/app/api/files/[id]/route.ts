import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { storage } from '@/lib/storage';

// GET /api/files/[id]           → 原文件
// GET /api/files/[id]?thumb=1   → 缩略图(图片才有)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1. Auth:Admin 和 Viewer 都可读
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. 解析 id 和 thumb 参数
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  const wantThumb = new URL(request.url).searchParams.get('thumb') === '1';

  // 3. 查 File 行
  const fileRow = await prisma.file.findUnique({
    where: { id },
    select: {
      storageKey: true,
      thumbnailKey: true,
      mimeType: true,
      fileName: true,
      isActive: true,
    },
  });
  if (!fileRow || !fileRow.isActive) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  // 4. 决定读哪个 key:有缩略图请求且存在则读缩略图,否则读原图
  const useThumb = wantThumb && !!fileRow.thumbnailKey;
  const key = useThumb ? fileRow.thumbnailKey! : fileRow.storageKey;
  const mime = useThumb ? 'image/webp' : fileRow.mimeType;

  // 5. 读字节并返回
  if (!(await storage.exists(key))) {
    return NextResponse.json({ error: 'File missing from storage' }, { status: 404 });
  }
  const data = await storage.get(key);

  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      'Content-Type': mime,
      // inline:浏览器直接展示(图片/PDF/视频),不强制下载
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(fileRow.fileName)}`,
      // private:CDN 不缓存(因为权限保护),浏览器自己缓存 1 小时
      'Cache-Control': 'private, max-age=3600',
    },
  });
}