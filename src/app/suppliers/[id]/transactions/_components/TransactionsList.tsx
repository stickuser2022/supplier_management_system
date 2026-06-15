import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { requireCurrentUser, isOwner } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TransactionStatusBadge } from '@/components/transactions/transaction-status-badge';
import { DetailSection } from '../../_components/detail-section';
import { TransactionActionsCell } from './TransactionActionsCell';

export async function TransactionsList({
  supplierId,
}: {
  supplierId: number;
}) {
  const t = await getTranslations('transactions');
  const locale = await getLocale();

  const [transactions, currentUser] = await Promise.all([
    prisma.transaction.findMany({
      where: { supplierId },
      include: {
        transactionItems: true,
        payments: true,
      },
      orderBy: { orderedAt: 'desc' },
    }),
    requireCurrentUser(),
  ]);

  return (
    <DetailSection
      title={t('title')}
      action={
        <Button asChild size="sm">
          <Link href={`/suppliers/${supplierId}/transactions/new`}>
            {t('newTransaction')}
          </Link>
        </Button>
      }
    >
      {transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">{t('empty')}</p>
      ) : (
        <div className="border border-border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t('columns.orderedAt')}</TableHead>
                <TableHead>{t('columns.items')}</TableHead>
                <TableHead>{t('columns.total')}</TableHead>
                <TableHead>{t('columns.paid')}</TableHead>
                <TableHead>{t('columns.status')}</TableHead>
                <TableHead className="text-right">{t('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => {
                const totalPaid = tx.payments.reduce(
                  (sum, p) => sum + Number(p.amount),
                  0,
                );
                return (
                  <TableRow key={tx.id} className={!tx.isActive ? 'opacity-50' : ''}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {tx.orderedAt.toLocaleDateString(locale)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tx.transactionItems.length} {t('itemsUnit')}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {tx.totalAmount.toString()} {tx.currency}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {totalPaid} {tx.currency}
                    </TableCell>
                    <TableCell>
                      <TransactionStatusBadge status={tx.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <TransactionActionsCell
                        transaction={{
                          id: tx.id,
                          supplierId: tx.supplierId,
                          isActive: tx.isActive,
                        }}
                        canEdit={isOwner(tx, currentUser)}
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