'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Upload, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  ownerId: number;
  type:
    | 'SUPPLIER_BROCHURE'
    | 'SUPPLIER_DOC'
    | 'QUOTE_IMAGE'
    | 'NOTE_ATTACHMENT'
    | 'SUPPLIER_VIDEO'
    | 'PAYMENT_SCREENSHOT'
    | 'TRANSACTION_DOC';
  accept: string;
  maxBytes: number;
  label: string;
  acceptHint: string;
};

type UploadStatus = {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
};

export function FileUploader({
  ownerId,
  type,
  accept,
  maxBytes,
  label,
  acceptHint,
}: Props) {
  const router = useRouter();
  const t = useTranslations('files');
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [working, setWorking] = useState(false);

  function openPicker() {
    if (working) return;
    inputRef.current?.click();
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxMB = Math.round(maxBytes / 1024 / 1024);
    const initial: UploadStatus[] = Array.from(files).map((file) => ({
      file,
      status: file.size > maxBytes ? 'error' : 'pending',
      error:
        file.size > maxBytes
          ? t('errorTooLarge', { max: `${maxMB}MB` })
          : undefined,
    }));
    setUploads(initial);
    setWorking(true);

    for (let i = 0; i < initial.length; i++) {
      if (initial[i].status === 'error') continue;

      setUploads((cur) =>
        cur.map((u, idx) => (idx === i ? { ...u, status: 'uploading' } : u)),
      );

      const fd = new FormData();
      fd.append('file', initial[i].file);
      fd.append('type', type);
      fd.append('ownerId', String(ownerId));

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setUploads((cur) =>
            cur.map((u, idx) =>
              idx === i
                ? { ...u, status: 'error', error: data.error ?? `HTTP ${res.status}` }
                : u,
            ),
          );
        } else {
          setUploads((cur) =>
            cur.map((u, idx) => (idx === i ? { ...u, status: 'success' } : u)),
          );
        }
      } catch (err) {
        setUploads((cur) =>
          cur.map((u, idx) =>
            idx === i ? { ...u, status: 'error', error: String(err) } : u,
          ),
        );
      }
    }

    setWorking(false);
    if (inputRef.current) inputRef.current.value = '';
    router.refresh();
  }

  const okCount = uploads.filter((u) => u.status === 'success').length;
  const failCount = uploads.filter((u) => u.status === 'error').length;
  const allDone = uploads.length > 0 && !working;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-3">
        <Button
          type="button"
          onClick={openPicker}
          disabled={working}
          variant="secondary"
          size="sm"
        >
          {working ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t('uploading')}
            </>
          ) : (
            <>
              <Upload className="size-4" />
              {label}
            </>
          )}
        </Button>
        <span className="text-xs text-muted-foreground">{acceptHint}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleFiles}
        className="hidden"
      />

      {uploads.length > 0 && (
        <div className="space-y-1 text-sm border border-border rounded-md p-3 bg-muted/40">
          {uploads.map((u, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="flex-1 truncate text-xs text-foreground">
                {u.file.name}
              </span>
              <span className="text-xs inline-flex items-center gap-1">
                {u.status === 'pending' && (
                  <span className="text-foreground-subtle">…</span>
                )}
                {u.status === 'uploading' && (
                  <span className="inline-flex items-center gap-1 text-primary">
                    <Loader2 className="size-3 animate-spin" />
                    {t('uploading')}
                  </span>
                )}
                {u.status === 'success' && (
                  <Check className="size-3.5 text-success-fg" />
                )}
                {u.status === 'error' && (
                  <span
                    className="inline-flex items-center gap-1 text-danger-fg"
                    title={u.error}
                  >
                    <X className="size-3.5" />
                    {u.error}
                  </span>
                )}
              </span>
            </div>
          ))}
          {allDone && (
            <div className="text-xs text-muted-foreground pt-2 mt-1 border-t border-border flex items-center justify-between">
              <span>
                {t('uploadBatchDone', { ok: okCount, fail: failCount })}
              </span>
              <button
                type="button"
                onClick={() => setUploads([])}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('clear')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}