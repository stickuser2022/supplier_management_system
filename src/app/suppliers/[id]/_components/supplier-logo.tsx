'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Upload, ImageOff, Loader2 } from 'lucide-react';
import { clearSupplierLogo } from '@/app/suppliers/_actions/file-actions';
import { compressImageForUpload } from '@/lib/compress-image';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DropZone } from '@/components/ui/drop-zone';

type LogoFile = {
  id: number;
  fileName: string;
} | null;

export function SupplierLogo({
  supplierId,
  currentLogo,
}: {
  supplierId: number;
  currentLogo: LogoFile;
}) {
  const router = useRouter();
  const t = useTranslations('files');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleFiles(files: File[]) {
    const file = files[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const compressed = await compressImageForUpload(file);

    const fd = new FormData();
    fd.append('file', compressed);
    fd.append('type', 'SUPPLIER_LOGO');
    fd.append('ownerId', String(supplierId));

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Upload failed: ${res.status}`);
      } else {
        setDialogOpen(false);
        router.refresh();
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    if (!currentLogo) return;
    if (!confirm(t('confirmRemoveLogo'))) return;
    startTransition(async () => {
      const res = await clearSupplierLogo(supplierId);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex items-start gap-2">
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        disabled={uploading || isPending}
        className={cn(
          'relative size-16 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0',
          'border border-dashed border-border bg-muted',
          'hover:bg-muted/70 hover:border-foreground-subtle transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
        aria-label={currentLogo ? t('replaceLogo') : t('uploadLogo')}
      >
        {currentLogo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/api/files/${currentLogo.id}?thumb=1`}
            alt={currentLogo.fileName}
            className="size-full object-contain"
          />
        ) : uploading ? (
          <Loader2 className="size-5 text-muted-foreground animate-spin" />
        ) : (
          <Upload className="size-5 text-muted-foreground" />
        )}
      </button>

      {(error || currentLogo) && (
        <div className="flex flex-col gap-0.5 pt-0.5 text-xs">
          {currentLogo && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading || isPending}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-danger-fg disabled:opacity-50 transition-colors"
            >
              <ImageOff className="size-3" />
              {t('removeLogo')}
            </button>
          )}
          {error && (
            <span className="text-danger-fg">{error}</span>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('uploadLogo')}</DialogTitle>
          </DialogHeader>
          <DropZone
            accept="image/png,image/jpeg,image/webp,image/gif"
            maxBytes={5 * 1024 * 1024}
            maxMB={5}
            working={uploading}
            onFiles={handleFiles}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}