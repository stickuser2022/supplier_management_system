'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { archiveQuote, restoreQuote } from '../new/_actions/quote-actions';

export function QuoteActionsCell({
  quote,
}: {
  quote: { id: number; supplierId: number; productNameZh: string; status: 'ACTIVE' | 'ARCHIVED' };
}) {
  const t = useTranslations('quotes.actions');
  const [isPending, startTransition] = useTransition();

  const handleArchive = () => {
    if (!confirm(t('confirmArchive', { name: quote.productNameZh }))) return;
    startTransition(async () => { await archiveQuote(quote.id); });
  };
  const handleRestore = () => startTransition(async () => { await restoreQuote(quote.id); });

  if (quote.status === 'ACTIVE') {
    return (
      <div className="flex gap-3 text-sm">
        <Link href={`/suppliers/${quote.supplierId}/quotes/${quote.id}/edit`} className="text-blue-600 hover:underline">
          ✏️ {t('edit')}
        </Link>
        <button type="button" onClick={handleArchive} disabled={isPending}
          className="text-amber-600 hover:underline disabled:opacity-50">
          🗄️ {t('archive')}
        </button>
      </div>
    );
  }

  return (
    <button type="button" onClick={handleRestore} disabled={isPending}
      className="text-sm text-emerald-600 hover:underline disabled:opacity-50">
      ↩️ {t('restore')}
    </button>
  );
}