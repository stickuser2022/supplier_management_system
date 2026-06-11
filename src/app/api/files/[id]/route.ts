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

// 5. 读字节
  if (!(await storage.exists(key))) {
    return NextResponse.json({ error: 'File missing from storage' }, { status: 404 });
  }
  const data = await storage.get(key);
  const fileSize = data.length;

  // 6. Range 请求处理(视频/音频拖进度条、断点续传等场景需要)
  const rangeHeader = request.headers.get('range');
  if (rangeHeader) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        // 客户端请求范围越界
        return new NextResponse('Range Not Satisfiable', {
          status: 416,
          headers: { 'Content-Range': `bytes */${fileSize}` },
        });
      }

      const chunk = data.subarray(start, end + 1);
      return new NextResponse(new Uint8Array(chunk), {
        status: 206, // Partial Content
        headers: {
          'Content-Type': mime,
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunk.length),
          'Cache-Control': 'private, max-age=3600',
        },
      });
    }
  }

  // 7. 整包返回(图片、PDF 等场景)
  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      'Content-Type': mime,
      'Content-Length': String(fileSize),
      'Accept-Ranges': 'bytes', // 关键:告诉浏览器"我支持 range",视频元素才会显示可拖动进度条
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(fileRow.fileName)}`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}