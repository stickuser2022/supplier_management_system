'use client';

import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import { FileItemActions } from './file-item-actions';

type BrochureItem = {
  id: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  thumbnailKey: string | null;
  titleZh: string | null;
  titleRu: string | null;
  createdAt: Date;
};

export function BrochureGallery({
  supplierId,
  items,
}: {
  supplierId: number;
  items: BrochureItem[];
}) {
  const t = useTranslations('files');

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic mt-2">
        {t('brochuresEmpty')}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
      {items.map((item) => {
        const isImage = item.mimeType.startsWith('image/');
        const title = item.titleZh || item.fileName;

        return (
          <div
            key={item.id}
            className="border border-border rounded-md overflow-hidden bg-card flex flex-col"
          >
            
            <a  href={`/api/files/${item.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block aspect-square bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
            >
              {isImage && item.thumbnailKey ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`/api/files/${item.id}?thumb=1`}
                  alt={item.fileName}
                  className="size-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-danger-fg">
                  <FileText className="size-10" />
                  <span className="text-xs font-medium">PDF</span>
                </div>
              )}
            </a>
            <div className="p-2.5 border-t border-border">
              <div
                className="text-sm font-medium text-foreground truncate"
                title={title}
              >
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