import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { pickLocalized } from '@/i18n/pick-localized';
import { NoteActionsCell } from './NoteActionsCell';

export async function NotesList({ supplierId }: { supplierId: number }) {
  const t = await getTranslations('notes');
  const locale = await getLocale();

  const notes = await prisma.note.findMany({
    where: { supplierId },
    include: { contact: true, quote: true },
    orderBy: { happenedAt: 'desc' },
  });

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3 pb-1 border-b">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <Link href={`/suppliers/${supplierId}/notes/new`}
          className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
          {t('newNote')}
        </Link>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-gray-500 italic">{t('empty')}</p>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <div
              key={n.id}
              className={`p-4 border rounded ${n.isActive ? 'bg-white' : 'bg-gray-50 opacity-60'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="text-sm text-gray-500">
                  📅 {n.happenedAt.toLocaleDateString(locale)}
                </div>
                <NoteActionsCell
                  note={{ id: n.id, supplierId: n.supplierId, contentZh: n.contentZh, isActive: n.isActive }}
                />
              </div>
              <p className="text-sm whitespace-pre-wrap mb-2">
                {pickLocalized(n.contentZh, n.contentRu, locale)}
              </p>
              {(n.contact || n.quote) && (
                <div className="text-xs text-gray-500 flex gap-3 flex-wrap">
                  {n.contact && (
                    <span>
                      👤 {pickLocalized(n.contact.nameZh, n.contact.nameRu, locale)}
                    </span>
                  )}
                  {n.quote && (
                    <span>
                      💰 #{n.quote.id} {pickLocalized(n.quote.productNameZh, n.quote.productNameRu, locale)}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}