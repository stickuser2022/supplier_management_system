'use client';

import { useTranslations } from 'next-intl';
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
      <p className="text-sm text-gray-500 italic mt-2">
        {t('quoteImagesEmpty')}
      </p>
    );
  }

  // 父组件计算非封面项的首尾,传给 actions 用于禁用边界按钮
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
            className="border rounded-lg overflow-hidden bg-white flex flex-col relative"
          >
            {/* 封面徽章 */}
            {item.isCover && (
              <div className="absolute top-2 left-2 z-10 bg-purple-600 text-white text-xs px-2 py-0.5 rounded shadow">
                ★ {t('cover')}
              </div>
            )}

            <a
              href={`/api/files/${item.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block aspect-square bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/files/${item.id}?thumb=1`}
                alt={item.fileName}
                className="w-full h-full object-contain"
              />
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