'use client';

import { useTranslations } from 'next-intl';
import { Play, Video } from 'lucide-react';
import { FileItemActions } from './file-item-actions';

type VideoItem = {
  id: number;
  fileName: string;
  thumbnailKey: string | null;
  titleZh: string | null;
  titleRu: string | null;
  sizeBytes: number;
};

export function SupplierVideoGallery({
  supplierId,
  items,
}: {
  supplierId: number;
  items: VideoItem[];
}) {
  const t = useTranslations('files');

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground italic mt-2">{t('videosEmpty')}</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
      {items.map((item) => {
        const title = item.titleZh || item.fileName;
        return (
          <div
            key={item.id}
            className="border border-border rounded-md overflow-hidden bg-card flex flex-col"
          >
            
            <a  href={`/api/files/${item.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block aspect-video bg-muted flex items-center justify-center relative group hover:opacity-90 transition-opacity"
            >
              {item.thumbnailKey ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`/api/files/${item.id}?thumb=1`}
                  alt={item.fileName}
                  className="size-full object-cover"
                />
              ) : (
                <Video className="size-12 text-muted-foreground" />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-foreground/70 group-hover:bg-foreground/90 rounded-full size-12 flex items-center justify-center transition-colors">
                  <Play className="size-5 text-background fill-background" />
                </div>
              </div>
            </a>
            <div className="p-2.5 border-t border-border">
              <div className="text-sm font-medium text-foreground truncate" title={title}>
                {title}
              </div>
              <div className="flex items-center justify-between gap-2 mt-1">
                <span className="text-xs text-foreground-subtle whitespace-nowrap">
                  {formatSize(item.sizeBytes)}
                </span>
                <FileItemActions fileId={item.id} supplierId={supplierId} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}