'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Upload, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DropZone } from '@/components/ui/drop-zone';
import { compressImageForUpload } from '@/lib/compress-image';

type Props = {
  ownerId: number;
  type:
    | 'SUPPLIER_BROCHURE'
    | 'SUPPLIER_DOC'
    | 'QUOTE_IMAGE'
    | 'NOTE_ATTACHMENT'
    | 'SUPPLIER_VIDEO'
    | 'PAYMENT_SCREENSHOT'
    | 'TRANSACTION_DOC'
    | 'ORIGINAL_INTENT_IMAGE';
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
  acceptHint: _acceptHint,
}: Props) {
  const router = useRouter();
  const t = useTranslations('files');
  const [open, setOpen] = useState(false);
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [working, setWorking] = useState(false);
  const cancelledRef = useRef(false);

  const maxMB = Math.round(maxBytes / 1024 / 1024);

  // 图片压缩(委托给共享函数)
  const compressImage = compressImageForUpload;

  // 上传引擎
  const processFiles = useCallback(
    async (files: File[]) => {
      // 先压缩图片(Ctrl+V 的截图通常很大)
      const compressed = await Promise.all(files.map(compressImage));
      const initial: UploadStatus[] = compressed.map((file) => ({
        file,
        status: (file.size > maxBytes ? 'error' : 'pending') as UploadStatus['status'],
        error: file.size > maxBytes ? t('errorTooLarge', { max: `${maxMB}MB` }) : undefined,
      }));

      setUploads(initial);
      setWorking(true);
      cancelledRef.current = false;

      for (let i = 0; i < initial.length; i++) {
        if (cancelledRef.current) break;
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
          if (cancelledRef.current) break;
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
          if (cancelledRef.current) break;
          setUploads((cur) =>
            cur.map((u, idx) =>
              idx === i ? { ...u, status: 'error', error: String(err) } : u,
            ),
          );
        }
      }

      setWorking(false);
      if (!cancelledRef.current) router.refresh();
    },
    [ownerId, type, maxBytes, t, router, maxMB],
  );

  const okCount = uploads.filter((u) => u.status === 'success').length;
  const failCount = uploads.filter((u) => u.status === 'error').length;
  const allDone = uploads.length > 0 && !working;

  function handleCancel() {
    cancelledRef.current = true;
    setUploads([]);
    setWorking(false);
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      setOpen(true);
    } else if (!working) {
      setUploads([]);
      setOpen(false);
    }
    // 上传中不响应外部关闭请求，由取消按钮处理
  }

  return (
    <div className="mb-4">
      <Button
        type="button"
        onClick={() => setOpen(true)}
        variant="secondary"
        size="sm"
      >
        <Upload className="size-4" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>

          {/* DropZone: 点击/粘贴/拖拽 */}
          <DropZone
            accept={accept}
            maxBytes={maxBytes}
            maxMB={maxMB}
            working={working}
            onFiles={processFiles}
          />

          {/* 取消按钮（上传中显示） */}
          {working && (
            <div className="flex justify-center">
              <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                <X className="size-3.5" />
                取消上传
              </Button>
            </div>
          )}

          {/* 进度列表 */}
          {uploads.length > 0 && (
            <div className="space-y-1 text-sm border border-border rounded-md p-3 bg-muted/40">
              {uploads.map((u, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="flex-1 truncate text-xs text-foreground">
                    {u.file.name}
                  </span>
                  <span className="text-xs inline-flex items-center gap-1">
                    {u.status === 'pending' && <span className="text-foreground-subtle">…</span>}
                    {u.status === 'uploading' && (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Loader2 className="size-3 animate-spin" />
                        {t('uploading')}
                      </span>
                    )}
                    {u.status === 'success' && <Check className="size-3.5 text-success-fg" />}
                    {u.status === 'error' && (
                      <span className="inline-flex items-center gap-1 text-danger-fg" title={u.error}>
                        <X className="size-3.5" />
                        {u.error}
                      </span>
                    )}
                  </span>
                </div>
              ))}
              {allDone && (
                <div className="text-xs text-muted-foreground pt-2 mt-1 border-t border-border flex items-center justify-between">
                  <span>{t('uploadBatchDone', { ok: okCount, fail: failCount })}</span>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}