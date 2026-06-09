'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { clearSupplierLogo } from '@/app/suppliers/_actions/file-actions';

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

    // 客户端预校验(服务端还会再校验,这层只是早失败、好体验)
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
      // route 已 revalidatePath,但客户端要 refresh 才会看到新数据
      router.refresh();
    } catch (err) {
      setError(String(err));
    } finally {
      setUploading(false);
      // 清空 input,下次选同一文件也能触发 change
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
    <div className="flex items-start gap-4">
      {/* LOGO 显示区(点击触发上传) */}
      <button
        type="button"
        onClick={openPicker}
        disabled={uploading || isPending}
        className="relative w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 overflow-hidden flex items-center justify-center bg-gray-50 disabled:opacity-50 cursor-pointer transition-colors"
        aria-label={currentLogo ? t('replaceLogo') : t('uploadLogo')}
      >
        {currentLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/files/${currentLogo.id}?thumb=1`}
            alt={currentLogo.fileName}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-gray-400 text-xs text-center px-2 leading-tight">
            {uploading ? t('uploading') : `+ ${t('uploadLogo')}`}
          </span>
        )}
      </button>

      {/* 操作按钮 */}
      <div className="flex flex-col gap-1 pt-1">
        <button
          type="button"
          onClick={openPicker}
          disabled={uploading || isPending}
          className="text-sm text-blue-600 hover:underline disabled:opacity-50 text-left"
        >
          {currentLogo ? t('replaceLogo') : t('uploadLogo')}
        </button>
        {currentLogo && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading || isPending}
            className="text-sm text-red-600 hover:underline disabled:opacity-50 text-left"
          >
            {t('removeLogo')}
          </button>
        )}
        {error && (
          <div className="text-xs text-red-600 max-w-xs">{error}</div>
        )}
      </div>

      {/* 隐藏的 file input */}
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