'use client';

import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import { FileItemActions } from './file-item-actions';

type ScreenshotItem = {
  id: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  thumbnailKey: string | null;
  titleZh: string | null;
  titleRu: string | null;
  createdAt: Date;
};

export function PaymentScreenshotsList({
  supplierId,
  items,
}: {
  supplierId: number;
  items: ScreenshotItem[];
}) {
  const t = useTranslations('files');

  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        {t('paymentScreenshotsEmpty')}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-md border border-border bg-card">
      {items.map((item) => {
        const title = item.titleZh || item.fileName;
        const isImage = item.mimeType.startsWith('image/');
        return (
          <li
            key={item.id}
            className="flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors"
          >
            {isImage && item.thumbnailKey ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/files/${item.id}?thumb=1`}
                alt=""
                className="size-10 rounded-md object-cover flex-shrink-0"
              />
            ) : (
              <div className="size-10 rounded-md flex items-center justify-center flex-shrink-0 bg-danger-bg text-danger-fg">
                <FileText className="size-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              
            <a    href={`/api/files/${item.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-foreground hover:text-primary hover:underline truncate block transition-colors"
                title={title}
              >
                {title}
              </a>
              <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                <span>{formatSize(item.sizeBytes)}</span>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <FileItemActions fileId={item.id} supplierId={supplierId} />
          </li>
        );
      })}
    </ul>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}