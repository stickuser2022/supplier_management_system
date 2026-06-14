'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Upload, ImageOff } from 'lucide-react';
import { clearSupplierLogo } from '@/app/suppliers/_actions/file-actions';
import { cn } from '@/lib/utils';

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openPicker() {
    if (uploading || isPending) return;
    inputRef.current?.click();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(t('errorTooLarge', { max: '5MB' }));
      return;
    }
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
      setError(t('errorWrongType'));
      return;
    }

    setUploading(true);
    setError(null);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', 'SUPPLIER_LOGO');
    fd.append('ownerId', String(supplierId));

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Upload failed: ${res.status}`);
        return;
      }
      router.refresh();
    } catch (err) {
      setError(String(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
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
        onClick={openPicker}
        disabled={uploading || isPending}
        className={cn(
          'relative size-16 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0',
          'border border-dashed border-border-strong bg-muted',
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
          <span className="text-xs text-muted-foreground">{t('uploading')}</span>
        ) : (
          <Upload className="size-5 text-foreground-subtle" />
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
          {error && <div className="text-danger-fg max-w-xs">{error}</div>}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}