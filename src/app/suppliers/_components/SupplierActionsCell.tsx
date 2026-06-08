'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { archiveSupplier, restoreSupplier } from '../_actions/supplier-actions';

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
      <div className="flex gap-3">
        <Link href={`/suppliers/${supplier.id}/edit`} className="text-blue-600 hover:underline">
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
      className="text-emerald-600 hover:underline disabled:opacity-50"
    >
      ↩️ {t('restore')}
    </button>
  );
}