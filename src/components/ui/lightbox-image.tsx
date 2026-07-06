'use client';

import { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 可点击放大的图片组件。
 *
 * 用法: 把 <img> 替换为 <LightboxImage>，props 完全兼容 <img>；
 * 额外支持 fullSrc —— 大图 URL（不传则用 src 去掉 ?thumb=1）。
 *
 * <LightboxImage src="/api/files/42?thumb=1" alt="缩略图" className="size-10" />
 */
export function LightboxImage({
  src,
  fullSrc,
  alt = '',
  className,
  ...imgProps
}: Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onClick'> & {
  fullSrc?: string;
}) {
  const [open, setOpen] = useState(false);

  // 大图：传了 fullSrc 就用它，否则去掉 ?thumb=1 及可能的 &thumb=1
  const srcStr = typeof src === 'string' ? src : '';
  const bigSrc = fullSrc ?? srcStr.replace(/[?&]thumb=1/g, '');

  // Escape 关闭
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    },
    [],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, handleKey]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn('cursor-zoom-in', className)}
        onClick={() => setOpen(true)}
        {...imgProps}
      />

      {open && (
        <div
          className="fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center p-4 md:p-8 animate-in fade-in-0"
          onClick={() => setOpen(false)}
        >
          {/* 关闭按钮 */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
          >
            <X className="size-5" />
          </button>

          {/* 大图 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bigSrc}
            alt={alt}
            className="max-w-full max-h-full object-contain rounded-sm select-none"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
