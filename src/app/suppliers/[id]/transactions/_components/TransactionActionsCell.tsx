'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Pencil, Archive, ArchiveRestore } from 'lucide-react';
import { archiveTransaction, restoreTransaction } from '../_actions/transaction-actions';
import { cn } from '@/lib/utils';

const baseClasses =
  'inline-flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50 disabled:pointer-events-none';

export function TransactionActionsCell({
  transaction,
}: {
  transaction: { id: number; supplierId: number; isActive: boolean };
}) {
  const t = useTranslations('transactions.actions');
  const [isPending, startTransition] = useTransition();

  const handleArchive = () => {
    if (!confirm(t('confirmArchive'))) return;
    startTransition(async () => {
      await archiveTransaction(transaction.id);
    });
  };

  const handleRestore = () =>
    startTransition(async () => {
      await restoreTransaction(transaction.id);
    });

  if (transaction.isActive) {
    return (
      <div className="flex items-center justify-end gap-4">
        <Link
          href={`/suppliers/${transaction.supplierId}/transactions/${transaction.id}/edit`}
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