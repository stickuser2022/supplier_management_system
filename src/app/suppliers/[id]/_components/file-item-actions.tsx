'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { physicallyDeleteFile } from '@/app/suppliers/_actions/file-actions';
import { cn } from '@/lib/utils';

const baseClasses =
  'inline-flex items-center gap-1 text-xs transition-colors disabled:opacity-50 disabled:pointer-events-none';

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

  function handleDelete() {
    if (!confirm(t('confirmDeleteFile'))) return;
    startTransition(async () => {
      const res = await physicallyDeleteFile(fileId);
      if (res.error) alert(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3 whitespace-nowrap">
      <Link
        href={`/suppliers/${supplierId}/files/${fileId}/edit`}
        className={cn(baseClasses, 'text-muted-foreground hover:text-foreground')}
      >
        <Pencil className="size-3" />
        {t('editTitle')}
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className={cn(baseClasses, 'text-muted-foreground hover:text-danger-fg')}
      >
        {pending ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <Trash2 className="size-3" />
        )}
        {t('deleteFile')}
      </button>
    </div>
  );
}