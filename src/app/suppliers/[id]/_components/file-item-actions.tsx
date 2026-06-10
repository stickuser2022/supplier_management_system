'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { archiveFile } from '@/app/suppliers/_actions/file-actions';

export function FileItemActions({
  fileId,
  supplierId,
}: {
  fileId: number;
  supplierId: number;
}) {
  const router = useRouter();
  const t = useTranslations('files');
  const [pending, startTransition] = useTransition();

  function handleArchive() {
    if (!confirm(t('confirmArchive'))) return;
    startTransition(async () => {
      const res = await archiveFile(fileId);
      if (res.error) alert(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2 text-xs whitespace-nowrap">
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
        {pending ? '…' : t('archiveFile')}
      </button>
    </div>
  );
}