'use client';

import { useTranslations } from 'next-intl';
import { File, FileText, FileSpreadsheet, Music } from 'lucide-react';
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
    return (
      <p className="text-sm text-muted-foreground italic mt-2">
        {t('noteAttachmentsEmpty')}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-md border border-border bg-card mt-2">
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
              <FileTypeIcon mime={item.mimeType} />
            )}
            <div className="flex-1 min-w-0">
              
              <a  href={`/api/files/${item.id}`}
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

function FileTypeIcon({ mime }: { mime: string }) {
  let Icon = File;
  let className = 'bg-muted text-muted-foreground';

  if (mime === 'application/pdf') {
    Icon = FileText;
    className = 'bg-danger-bg text-danger-fg';
  } else if (mime.includes('word') || mime.includes('msword')) {
    Icon = FileText;
    className = 'bg-info-bg text-info-fg';
  } else if (mime.includes('excel') || mime.includes('spreadsheet')) {
    Icon = FileSpreadsheet;
    className = 'bg-success-bg text-success-fg';
  } else if (mime.startsWith('audio/')) {
    Icon = Music;
    className = 'bg-warning-bg text-warning-fg';
  }

  return (
    <div
      className={`size-10 rounded-md flex items-center justify-center flex-shrink-0 ${className}`}
    >
      <Icon className="size-5" />
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}