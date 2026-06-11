'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

type Props = {
  ownerId: number;
  type: 'SUPPLIER_BROCHURE' | 'SUPPLIER_DOC' | 'QUOTE_IMAGE';
  accept: string;     // HTML accept 属性
  maxBytes: number;   // 客户端预校验上限
  label: string;      // 按钮文字
  acceptHint: string; // 按钮旁的格式提示
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

    // 客户端预校验:超大的直接标错,不发请求
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

    // 顺序上传(并行会让翻译 API + sharp 同时跑,容易扛不住)
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
    router.refresh(); // 刷新服务端组件,新文件出现在列表里
  }

  const okCount = uploads.filter((u) => u.status === 'success').length;
  const failCount = uploads.filter((u) => u.status === 'error').length;
  const allDone = uploads.length > 0 && !working;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-3">
        <button
          type="button"
          onClick={openPicker}
          disabled={working}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {working ? t('uploading') : `+ ${label}`}
        </button>
        <span className="text-xs text-gray-500">{acceptHint}</span>
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
        <div className="space-y-1 text-sm border rounded p-2 bg-gray-50">
          {uploads.map((u, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="flex-1 truncate text-xs">{u.file.name}</span>
              <span className="text-xs">
                {u.status === 'pending' && <span className="text-gray-400">…</span>}
                {u.status === 'uploading' && (
                  <span className="text-blue-600">{t('uploading')}</span>
                )}
                {u.status === 'success' && <span className="text-green-600">✓</span>}
                {u.status === 'error' && (
                  <span className="text-red-600" title={u.error}>
                    ✗ {u.error}
                  </span>
                )}
              </span>
            </div>
          ))}
          {allDone && (
            <div className="text-xs text-gray-600 pt-2 mt-1 border-t flex items-center justify-between">
              <span>
                {t('uploadBatchDone', { ok: okCount, fail: failCount })}
              </span>
              <button
                type="button"
                onClick={() => setUploads([])}
                className="text-blue-600 hover:underline"
              >
                清空
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}