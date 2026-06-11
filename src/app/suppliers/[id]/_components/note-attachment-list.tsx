'use client';

import { useTranslations } from 'next-intl';
import { FileItemActions } from './file-item-actions';

type NoteAttachmentItem = {
  id: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  thumbnailKey: string | null;
  titleZh: string | null;
  titleRu: string | null;
  createdAt: Date;
};

export function NoteAttachmentList({
  supplierId,
  items,
}: {
  supplierId: number;
  items: NoteAttachmentItem[];
}) {
  const t = useTranslations('files');

  if (items.length === 0) {
    return <p className="text-sm text-gray-500 italic mt-2">{t('noteAttachmentsEmpty')}</p>;
  }

  return (
    <ul className="divide-y rounded border bg-white mt-2">
      {items.map((item) => {
        const title = item.titleZh || item.fileName;
        const isImage = item.mimeType.startsWith('image/');
        return (
          <li key={item.id} className="flex items-center gap-3 p-3 hover:bg-gray-50">
            {isImage && item.thumbnailKey ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/files/${item.id}?thumb=1`}
                alt=""
                className="w-10 h-10 rounded object-cover flex-shrink-0"
              />
            ) : (
              <FileTypeIcon mime={item.mimeType} />
            )}
            <div className="flex-1 min-w-0">
              
             <a   href={`/api/files/${item.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:underline truncate block"
                title={title}
              >
                {title}
              </a>
              <div className="text-xs text-gray-500 flex gap-3 mt-1">
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

function FileTypeIcon({ mime }: { mime: string }) {
  let label = 'FILE';
  let color = 'bg-gray-500';
  if (mime === 'application/pdf') {
    label = 'PDF';
    color = 'bg-red-500';
  } else if (mime.includes('word') || mime.includes('msword')) {
    label = 'DOC';
    color = 'bg-blue-500';
  } else if (mime.includes('excel') || mime.includes('spreadsheet')) {
    label = 'XLS';
    color = 'bg-green-500';
  } else if (mime.startsWith('audio/')) {
    label = 'AUD';
    color = 'bg-amber-500';
  }
  return (
    <div
      className={`w-10 h-10 rounded ${color} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}
    >
      {label}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}