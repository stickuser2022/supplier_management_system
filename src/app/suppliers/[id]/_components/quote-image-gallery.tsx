'use client';

import { useTranslations } from 'next-intl';
import { Star } from 'lucide-react';
import { QuoteImageActions } from './quote-image-actions';

type QuoteImageItem = {
  id: number;
  fileName: string;
  thumbnailKey: string | null;
  isCover: boolean;
  titleZh: string | null;
  titleRu: string | null;
  sizeBytes: number;
};

export function QuoteImageGallery({
  supplierId,
  items,
}: {
  supplierId: number;
  items: QuoteImageItem[];
}) {
  const t = useTranslations('files');

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic mt-2">
        {t('quoteImagesEmpty')}
      </p>
    );
  }

  const nonCover = items.filter((i) => !i.isCover);
  const firstNonCoverId = nonCover[0]?.id ?? -1;
  const lastNonCoverId = nonCover[nonCover.length - 1]?.id ?? -1;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
      {items.map((item) => {
        const title = item.titleZh || item.fileName;
        return (
          <div
            key={item.id}
            className="border border-border rounded-md overflow-hidden bg-card flex flex-col relative"
          >
            {item.isCover && (
              <div className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 bg-warning-bg text-warning-fg text-xs px-2 py-0.5 rounded-md border border-warning-fg/20 shadow-sm">
                <Star className="size-3 fill-warning-fg" />
                {t('cover')}
              </div>
            )}

            
            <a  href={`/api/files/${item.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block aspect-square bg-muted/40 hover:bg-muted/60 transition-colors flex items-center justify-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/files/${item.id}?thumb=1`}
                alt={item.fileName}
                className="w-full h-full object-contain"
              />
            </a>

            <div className="p-2 border-t border-border bg-card">
              <div
                className="text-sm font-medium text-foreground truncate"
                title={title}
              >
                {title}
              </div>
              <div className="flex items-center justify-between mt-1 gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatSize(item.sizeBytes)}
                </span>
                <QuoteImageActions
                  fileId={item.id}
                  supplierId={supplierId}
                  isCover={item.isCover}
                  isFirst={item.id === firstNonCoverId}
                  isLast={item.id === lastNonCoverId}
                />
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