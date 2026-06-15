import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { Calendar, User, DollarSign } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireCurrentUser, isOwner } from '@/lib/auth';
import { pickLocalized } from '@/i18n/pick-localized';
import { Button } from '@/components/ui/button';
import { DetailSection } from '../../_components/detail-section';
import { NoteActionsCell } from './NoteActionsCell';

export async function NotesList({ supplierId }: { supplierId: number }) {
  const t = await getTranslations('notes');
  const locale = await getLocale();

  const [notes, currentUser] = await Promise.all([
    prisma.note.findMany({
      where: { supplierId },
      include: { contact: true, quote: true },
      orderBy: { happenedAt: 'desc' },
    }),
    requireCurrentUser(),
  ]);

  return (
    <DetailSection
      title={t('title')}
      action={
        <Button asChild size="sm">
          <Link href={`/suppliers/${supplierId}/notes/new`}>
            {t('newNote')}
          </Link>
        </Button>
      }
    >
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">{t('empty')}</p>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div
              key={n.id}
              className={`p-4 border border-border rounded-md ${
                n.isActive ? 'bg-card' : 'bg-muted/40 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="size-3.5" />
                  {n.happenedAt.toLocaleDateString(locale)}
                </div>
                <NoteActionsCell
                  note={{
                    id: n.id,
                    supplierId: n.supplierId,
                    contentZh: n.contentZh,
                    isActive: n.isActive,
                  }}
                  canEdit={isOwner(n, currentUser)}
                />
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap mb-3 leading-relaxed">
                {pickLocalized(n.contentZh, n.contentRu, locale)}
              </p>
              {(n.contact || n.quote) && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {n.contact && (
                    <span className="inline-flex items-center gap-1">
                      <User className="size-3" />
                      {pickLocalized(n.contact.nameZh, n.contact.nameRu, locale)}
                    </span>
                  )}
                  {n.quote && (
                    <span className="inline-flex items-center gap-1">
                      <DollarSign className="size-3" />
                      #{n.quote.id}{' '}
                      {pickLocalized(n.quote.productNameZh, n.quote.productNameRu, locale)}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DetailSection>
  );
}