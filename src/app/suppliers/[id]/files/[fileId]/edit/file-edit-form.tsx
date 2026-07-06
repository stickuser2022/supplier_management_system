'use client';

import { useState, useActionState, useTransition } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  updateFileTitle,
  translateFileTitle,
  type FileTitleFormState,
} from '@/app/suppliers/_actions/file-actions';
import { physicallyDeleteFile } from '@/app/suppliers/_actions/file-actions';
import { useRouter } from 'next/navigation';

const initialState: FileTitleFormState = { status: 'idle' };

export function FileEditForm({
  fileId,
  supplierId,
  initialTitleZh,
  initialTitleRu,
  initialAutoTranslated,
}: {
  fileId: number;
  supplierId: number;
  initialTitleZh: string;
  initialTitleRu: string;
  initialAutoTranslated: boolean;
}) {
  const t = useTranslations('files');

  const [titleZh, setTitleZh] = useState(initialTitleZh);
  const [titleRu, setTitleRu] = useState(initialTitleRu);
  const [autoTranslated, setAutoTranslated] = useState(initialAutoTranslated);
  const [translating, startTranslating] = useTransition();
  const [translateError, setTranslateError] = useState<string | null>(null);

  // 把 fileId 预绑进 action,与 supplier-actions 的 updateSupplier.bind(null, id) 同模式
  const boundAction = updateFileTitle.bind(null, fileId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  function handleTranslate() {
    if (!titleZh.trim()) {
      setTranslateError(t('errorTitleZhEmpty'));
      return;
    }
    setTranslateError(null);
    startTranslating(async () => {
      const res = await translateFileTitle(titleZh);
      if (res.ok) {
        setTitleRu(res.translated);
        setAutoTranslated(true); // AI 填的,解锁
      } else {
        setTranslateError(res.error);
      }
    });
  }

  function handleTitleRuChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitleRu(e.target.value);
    setAutoTranslated(false); // 用户手改 → 锁定
  }

  return (
    <form action={formAction} className="space-y-4">
      {/* 中文标题 */}
      <div>
        <label className="block text-sm font-medium mb-1">
          {t('fileTitleZh')}
        </label>
        <input
          type="text"
          name="titleZh"
          value={titleZh}
          onChange={(e) => setTitleZh(e.target.value)}
          placeholder={t('fileTitlePlaceholder')}
          maxLength={200}
          className="w-full px-3 py-2 border rounded text-sm"
        />
        {state.errors?.titleZh && (
          <p className="text-xs text-red-600 mt-1">{state.errors.titleZh[0]}</p>
        )}
      </div>

      {/* 俄文标题 + 翻译按钮 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium">{t('fileTitleRu')}</label>
          <button
            type="button"
            onClick={handleTranslate}
            disabled={translating || !titleZh.trim()}
            className="text-xs text-blue-600 hover:underline disabled:opacity-50"
          >
            {translating ? '…' : t('translateTitle')}
          </button>
        </div>
        <input
          type="text"
          name="titleRu"
          value={titleRu}
          onChange={handleTitleRuChange}
          maxLength={200}
          className="w-full px-3 py-2 border rounded text-sm"
        />
        {state.errors?.titleRu && (
          <p className="text-xs text-red-600 mt-1">{state.errors.titleRu[0]}</p>
        )}
        {!autoTranslated && titleRu && (
          <p className="text-xs text-gray-500 mt-1">🔒 {t('titleRuLocked')}</p>
        )}
        {translateError && (
          <p className="text-xs text-red-600 mt-1">{translateError}</p>
        )}
      </div>

      {/* 隐藏字段:把锁定状态送到 server */}
      <input
        type="hidden"
        name="titleRuAutoTranslated"
        value={String(autoTranslated)}
      />

      {/* 整体错误提示 */}
      {state.status === 'error' && state.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      {/* 按钮组 */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm hover:opacity-90 disabled:opacity-50"
          >
            {pending ? t('saving') : t('save')}
          </button>
          <Link
            href={`/suppliers/${supplierId}`}
            className="px-4 py-2 border rounded text-sm text-muted-foreground hover:bg-muted"
          >
            {t('cancel')}
          </Link>
        </div>
        <PhysicalDeleteButton fileId={fileId} supplierId={supplierId} />
      </div>
    </form>
  );
}

function PhysicalDeleteButton({
  fileId,
  supplierId,
}: {
  fileId: number;
  supplierId: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm('⚠️ 永久删除此文件?数据库记录和磁盘文件都会被清除,无法恢复。')) {
      return;
    }
    if (!confirm('再次确认:真的删除?')) {
      return;
    }
    startTransition(async () => {
      const res = await physicallyDeleteFile(fileId);
      if (res.error) {
        alert(res.error);
      } else {
        router.push(`/suppliers/${supplierId}`);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="text-xs text-red-700 hover:underline disabled:opacity-50"
    >
      {pending ? '删除中…' : '⚠️ 永久删除'}
    </button>
  );
}