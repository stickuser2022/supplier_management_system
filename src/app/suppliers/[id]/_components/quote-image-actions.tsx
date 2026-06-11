'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  archiveFile,
  setQuoteImageCover,
  moveQuoteImage,
} from '@/app/suppliers/_actions/file-actions';

export function QuoteImageActions({
  fileId,
  supplierId,
  isCover,
  isFirst,
  isLast,
}: {
  fileId: number;
  supplierId: number;
  isCover: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const t = useTranslations('files');
  const [pending, startTransition] = useTransition();

  // 小工具:统一处理"调 action + 出错弹窗 + 成功 refresh"
  function withRefresh(
    action: () => Promise<{ ok?: true; error?: string }>,
  ) {
    startTransition(async () => {
      const res = await action();
      if (res.error) alert(res.error);
      else router.refresh();
    });
  }

  function handleArchive() {
    if (!confirm(t('confirmArchive'))) return;
    withRefresh(() => archiveFile(fileId));
  }

  return (
    <div className="flex items-center gap-1.5 text-xs whitespace-nowrap flex-wrap">
      {/* 封面 / 移动:只在非封面图上显示 */}
      {!isCover && (
        <>
          <button
            type="button"
            onClick={() => withRefresh(() => setQuoteImageCover(fileId))}
            disabled={pending}
            title={t('setAsCover')}
            className="text-purple-600 hover:underline disabled:opacity-50 px-1"
          >
            ★
          </button>
          <button
            type="button"
            onClick={() => withRefresh(() => moveQuoteImage(fileId, 'up'))}
            disabled={pending || isFirst}
            title={t('moveUp')}
            className="text-gray-600 hover:underline disabled:opacity-30 px-1"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => withRefresh(() => moveQuoteImage(fileId, 'down'))}
            disabled={pending || isLast}
            title={t('moveDown')}
            className="text-gray-600 hover:underline disabled:opacity-30 px-1"
          >
            ↓
          </button>
        </>
      )}
      <Link
        href={`/suppliers/${supplierId}/files/${fileId}/edit`}
        className="text-blue-600 hover:underline"
      >
        {t('editTitle')}
      </Link>
      <button
        type="button"
        onClick={handleArchive}
        disabled={pending}
        className="text-red-600 hover:underline disabled:opacity-50"
      >
        {t('archiveFile')}
      </button>
    </div>
  );
}