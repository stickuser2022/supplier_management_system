'use client';

import { useTranslations } from 'next-intl';
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
    return <p className="text-sm text-gray-500 italic mt-2">{t('videosEmpty')}</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
      {items.map((item) => {
        const title = item.titleZh || item.fileName;
        return (
          <div key={item.id} className="border rounded-lg overflow-hidden bg-white flex flex-col">
            
            <a  href={`/api/files/${item.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block aspect-video bg-black flex items-center justify-center relative group hover:opacity-90 transition-opacity"
            >
              {item.thumbnailKey ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/files/${item.id}?thumb=1`}
                  alt={item.fileName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-white text-4xl">🎬</div>
              )}
              {/* 播放按钮覆盖 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/60 group-hover:bg-black/80 rounded-full w-14 h-14 flex items-center justify-center text-white text-xl transition-colors">
                  ▶
                </div>
              </div>
            </a>
            <div className="p-2 border-t bg-white">
              <div className="text-sm font-medium truncate" title={title}>
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

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}