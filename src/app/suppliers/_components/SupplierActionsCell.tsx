'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Pencil, Archive, ArchiveRestore } from 'lucide-react';
import { archiveSupplier, restoreSupplier } from '../_actions/supplier-actions';
import { cn } from '@/lib/utils';

const baseClasses =
  'inline-flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50 disabled:pointer-events-none';

export function SupplierActionsCell({
  supplier,
}: {
  supplier: { id: number; nameZh: string; isActive: boolean };
}) {
  const t = useTranslations('suppliers.actions');
  const [isPending, startTransition] = useTransition();

  const handleArchive = () => {
    if (!confirm(t('confirmArchive', { name: supplier.nameZh }))) return;
    startTransition(async () => {
      await archiveSupplier(supplier.id);
    });
  };

  const handleRestore = () => {
    startTransition(async () => {
      await restoreSupplier(supplier.id);
    });
  };

  if (supplier.isActive) {
    return (
      <div className="flex items-center justify-end gap-4">
        <Link
          href={`/suppliers/${supplier.id}/edit`}
          className={cn(baseClasses, 'text-muted-foreground hover:text-foreground')}
        >
          <Pencil className="size-3.5" />
          {t('edit')}
        </Link>
        <button
          type="button"
          onClick={handleArchive}
          disabled={isPending}
          className={cn(baseClasses, 'text-muted-foreground hover:text-danger-fg')}
        >
          <Archive className="size-3.5" />
          {t('archive')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end">
      <button
        type="button"
        onClick={handleRestore}
        disabled={isPending}
        className={cn(baseClasses, 'text-muted-foreground hover:text-success-fg')}
      >
        <ArchiveRestore className="size-3.5" />
        {t('restore')}
      </button>
    </div>
  );
}