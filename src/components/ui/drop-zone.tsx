'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { Upload, Clipboard } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  accept: string;
  maxBytes: number;
  maxMB: number;
  working: boolean;
  onFiles: (files: File[]) => void;
};

/**
 * 上传放置区：点击选择文件 / Ctrl+V 粘贴 / 拖拽。
 * 灰色虚线框 + 提示文字，视觉上直观。
 */
export function DropZone({ accept, maxMB, working, onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const openPicker = useCallback(() => {
    if (working) return;
    inputRef.current?.click();
  }, [working]);

  // 文件选择
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const list = e.target.files;
      if (!list || list.length === 0) return;
      onFiles(Array.from(list));
      if (inputRef.current) inputRef.current.value = '';
    },
    [onFiles],
  );

  // 粘贴监听
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (working) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const blob = items[i].getAsFile();
          if (blob) {
            const name = `paste-${Date.now()}.png`;
            files.push(new File([blob], name, { type: blob.type }));
          }
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        onFiles(files);
      }
    }
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [working, onFiles]);

  // 拖拽
  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    [],
  );

  return (
    <div
      onClick={openPicker}
      onDragEnter={(e) => { handleDrag(e); setDragOver(true); }}
      onDragOver={handleDrag}
      onDragLeave={(e) => { handleDrag(e); setDragOver(false); }}
      onDrop={(e) => {
        handleDrag(e);
        setDragOver(false);
        if (working) return;
        const list = e.dataTransfer.files;
        if (list && list.length > 0) onFiles(Array.from(list));
      }}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer select-none',
        dragOver
          ? 'border-primary bg-primary/5'
          : 'border-border bg-muted/40 hover:border-muted-foreground/40',
        working && 'pointer-events-none opacity-60',
      )}
    >
      <Upload className={cn('size-8', dragOver ? 'text-primary' : 'text-muted-foreground')} />
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground">
          点击选择文件 或 Ctrl+V 粘贴
        </p>
        <p className="text-xs text-muted-foreground">
          {accept.startsWith('image') ? '支持图片' : '支持图片、PDF、文档'}，单文件最大 {maxMB}MB
        </p>
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1 justify-center">
          <Clipboard className="size-3" />
          截图后可直接粘贴
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleInput}
        className="hidden"
      />
    </div>
  );
}
