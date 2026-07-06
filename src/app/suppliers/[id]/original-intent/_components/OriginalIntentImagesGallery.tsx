import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { FileItemActions } from '../../_components/file-item-actions';

export async function OriginalIntentImagesGallery({ supplierId }: { supplierId: number }) {
  const t = await getTranslations('originalIntent');

  const files = await prisma.file.findMany({
    where: {
      supplierId,
      type: 'ORIGINAL_INTENT_IMAGE',
      isActive: true,
    },
    select: {
      id: true,
      fileName: true,
      thumbnailKey: true,
      mimeType: true,
      sizeBytes: true,
      sortOrder: true,
      createdAt: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  if (files.length === 0) {
    return <p className="text-sm text-muted-foreground italic mt-2">{t('imagesEmpty')}</p>;
  }

  return (
    <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {files.map((f) => (
        <div
          key={f.id}
          className="group relative aspect-square rounded-md border border-border overflow-hidden bg-muted"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/files/${f.id}?thumb=1`}
            alt={f.fileName}
            className="size-full object-cover"
          />
          {/* hover 操作按钮 */}
          <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <FileItemActions
              fileId={f.id}
              supplierId={supplierId}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
