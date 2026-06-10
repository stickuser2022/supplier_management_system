'use client';

import { useTranslations } from 'next-intl';
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
    return <p className="text-sm text-gray-500 italic mt-2">{t('brochuresEmpty')}</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
      {items.map((item) => {
        const isImage = item.mimeType.startsWith('image/');
        const title = item.titleZh || item.fileName;

        return (
          <div
            key={item.id}
            className="border rounded-lg overflow-hidden bg-white flex flex-col"
          >
            
            <a  href={`/api/files/${item.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block aspect-square bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              {isImage && item.thumbnailKey ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/files/${item.id}?thumb=1`}
                  alt={item.fileName}
                  className="w-full h-full object-contain"
                />
              ) : (
                <PdfIcon />
              )}
            </a>
            <div className="p-2 border-t bg-white">
              <div
                className="text-sm font-medium truncate"
                title={title}
              >
                {title}
              </div>
              <div className="flex items-center justify-between mt-1 gap-2">
                <span className="text-xs text-gray-400 whitespace-nowrap">
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

function PdfIcon() {
  return (
    <div className="flex flex-col items-center gap-2 text-red-500">
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
      </svg>
      <span className="text-xs font-semibold">PDF</span>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}