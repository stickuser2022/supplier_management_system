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
    // 一次查出所有 quote 的封面图,在内存里拼成 Map,N+1 安全
  const coverFiles = await prisma.file.findMany({
    where: {
      quoteId: { in: quotes.map((q) => q.id) },
      type: 'QUOTE_IMAGE',
      isActive: true,
      isCover: true,
    },
    select: { id: true, quoteId: true },
  });
  const coverMap = new Map<number, number>(
    coverFiles.map((f) => [f.quoteId!, f.id]),
  );

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
                    <div className="flex items-start gap-2">
                      {coverMap.has(q.id) ? (
                        
                        <a  href={`/api/files/${coverMap.get(q.id)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-gray-50 hover:opacity-80 transition-opacity"
                          title={t('viewCover')}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/files/${coverMap.get(q.id)}?thumb=1`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ) : (
                        <div className="flex-shrink-0 w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs">
                          —
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {pickLocalized(q.productNameZh, q.productNameRu, locale)}
                        {q.productSpecZh && (
                          <div className="text-xs text-gray-500">
                            {pickLocalized(q.productSpecZh, q.productSpecRu, locale)}
                          </div>
                        )}
                      </div>
                    </div>
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