import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { pickLocalized } from '@/i18n/pick-localized';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DetailSection } from '../../_components/detail-section';
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
    <DetailSection
      title={t('title')}
      action={
        <Button asChild size="sm">
          <Link href={`/suppliers/${supplierId}/quotes/new`}>
            {t('newQuote')}
          </Link>
        </Button>
      }
    >
      {quotes.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">{t('empty')}</p>
      ) : (
        <div className="border border-border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t('columns.product')}</TableHead>
                <TableHead>{t('columns.price')}</TableHead>
                <TableHead>{t('columns.tags')}</TableHead>
                <TableHead>{t('columns.quotedAt')}</TableHead>
                <TableHead>{t('columns.validUntil')}</TableHead>
                <TableHead className="text-right">{t('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((q) => {
                const expired = q.validUntil && q.validUntil < today;
                const isArchived = q.status === 'ARCHIVED';
                return (
                  <TableRow key={q.id} className={isArchived ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        {coverMap.has(q.id) ? (
                          
                          <a  href={`/api/files/${coverMap.get(q.id)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 size-12 rounded-md overflow-hidden bg-muted hover:opacity-80 transition-opacity"
                            title={t('viewCover')}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`/api/files/${coverMap.get(q.id)}?thumb=1`}
                              alt=""
                              className="size-full object-cover"
                            />
                          </a>
                        ) : (
                          <div className="flex-shrink-0 size-12 rounded-md bg-muted flex items-center justify-center text-foreground-subtle text-xs">
                            —
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground">
                            {pickLocalized(q.productNameZh, q.productNameRu, locale)}
                          </div>
                          {q.productSpecZh && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {pickLocalized(q.productSpecZh, q.productSpecRu, locale)}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {q.unitPrice.toString()} {q.currency}
                        {q.unitZh && (
                          <span className="text-xs text-muted-foreground">
                            {' / '}{pickLocalized(q.unitZh, q.unitRu, locale)}
                          </span>
                        )}
                      </div>
                      {q.moq && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          MOQ: {q.moq}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {q.quoteTags.map((qt) => (
                          <span
                            key={qt.tagId}
                            className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded-sm text-xs"
                          >
                            {pickLocalized(qt.tag.nameZh, qt.tag.nameRu, locale)}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {q.quotedAt.toLocaleDateString(locale)}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {q.validUntil ? (
                        <span className={expired ? 'text-danger-fg' : 'text-muted-foreground'}>
                          {q.validUntil.toLocaleDateString(locale)}
                          {expired && ` ${t('expired')}`}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <QuoteActionsCell
                        quote={{
                          id: q.id,
                          supplierId: q.supplierId,
                          productNameZh: q.productNameZh,
                          status: q.status,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </DetailSection>
  );
}