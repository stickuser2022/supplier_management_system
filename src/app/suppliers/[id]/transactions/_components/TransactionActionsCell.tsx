'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  archiveTransaction,
  restoreTransaction,
} from '../_actions/transaction-actions';

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
      <div className="flex gap-3 text-sm">
        <Link
          href={`/suppliers/${transaction.supplierId}/transactions/${transaction.id}/edit`}
          className="text-blue-600 hover:underline"
        >
          ✏️ {t('edit')}
        </Link>
        <button
          type="button"
          onClick={handleArchive}
          disabled={isPending}
          className="text-amber-600 hover:underline disabled:opacity-50"
        >
          🗄️ {t('archive')}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleRestore}
      disabled={isPending}
      className="text-sm text-emerald-600 hover:underline disabled:opacity-50"
    >
      ↩️ {t('restore')}
    </button>
  );
}