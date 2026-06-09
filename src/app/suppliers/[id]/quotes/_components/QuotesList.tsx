import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { pickLocalized } from '@/i18n/pick-localized';
import { QuoteActionsCell } from './QuoteActionsCell';

export async function QuotesList({ supplierId }: { supplierId: number }) {
  const t = await getTranslations('quotes');
  const locale = await getLocale();
  const today = new Date();

  const quotes = await prisma.quote.findMany({
    where: { supplierId },
    include: { quoteTags: { include: { tag: true } } },
    orderBy: { quotedAt: 'desc' },
  });

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3 pb-1 border-b">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <Link href={`/suppliers/${supplierId}/quotes/new`}
          className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
          {t('newQuote')}
        </Link>
      </div>

      {quotes.length === 0 ? (
        <p className="text-sm text-gray-500 italic">{t('empty')}</p>
      ) : (
        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="border p-2 text-left">{t('columns.product')}</th>
              <th className="border p-2 text-left">{t('columns.price')}</th>
              <th className="border p-2 text-left">{t('columns.tags')}</th>
              <th className="border p-2 text-left">{t('columns.quotedAt')}</th>
              <th className="border p-2 text-left">{t('columns.validUntil')}</th>
              <th className="border p-2 text-left">{t('columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => {
              const expired = q.validUntil && q.validUntil < today;
              const rowClass = q.status === 'ARCHIVED' ? 'opacity-50' : '';
              return (
                <tr key={q.id} className={rowClass}>
                  <td className="border p-2">
                    {pickLocalized(q.productNameZh, q.productNameRu, locale)}
                    {q.productSpecZh && (
                      <div className="text-xs text-gray-500">
                        {pickLocalized(q.productSpecZh, q.productSpecRu, locale)}
                      </div>
                    )}
                  </td>
                  <td className="border p-2 font-mono">
                    {q.unitPrice.toString()} {q.currency}
                    {q.unitZh && <span className="text-xs text-gray-500"> / {pickLocalized(q.unitZh, q.unitRu, locale)}</span>}
                    {q.moq && <div className="text-xs text-gray-500">MOQ: {q.moq}</div>}
                  </td>
                  <td className="border p-2">
                    <div className="flex flex-wrap gap-1">
                      {q.quoteTags.map((qt) => (
                        <span key={qt.tagId} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                          {pickLocalized(qt.tag.nameZh, qt.tag.nameRu, locale)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="border p-2 text-xs">{q.quotedAt.toLocaleDateString(locale)}</td>
                  <td className="border p-2 text-xs">
                    {q.validUntil ? (
                      <span className={expired ? 'text-red-600' : ''}>
                        {q.validUntil.toLocaleDateString(locale)}{expired && ' (已过期)'}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="border p-2">
                    <QuoteActionsCell
                      quote={{ id: q.id, supplierId: q.supplierId, productNameZh: q.productNameZh, status: q.status }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}