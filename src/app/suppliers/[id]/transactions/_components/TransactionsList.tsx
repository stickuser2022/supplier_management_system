import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { TransactionActionsCell } from './TransactionActionsCell';

export async function TransactionsList({
  supplierId,
}: {
  supplierId: number;
}) {
  const t = await getTranslations('transactions');
  const locale = await getLocale();

  const transactions = await prisma.transaction.findMany({
    where: { supplierId },
    include: {
      transactionItems: true,
      payments: true,
    },
    orderBy: { orderedAt: 'desc' },
  });

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3 pb-1 border-b">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <Link
          href={`/suppliers/${supplierId}/transactions/new`}
          className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {t('newTransaction')}
        </Link>
      </div>

      {transactions.length === 0 ? (
        <p className="text-sm text-gray-500 italic">{t('empty')}</p>
      ) : (
        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="border p-2 text-left">{t('columns.orderedAt')}</th>
              <th className="border p-2 text-left">{t('columns.items')}</th>
              <th className="border p-2 text-left">{t('columns.total')}</th>
              <th className="border p-2 text-left">{t('columns.paid')}</th>
              <th className="border p-2 text-left">{t('columns.status')}</th>
              <th className="border p-2 text-left">{t('columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => {
              const totalPaid = tx.payments.reduce(
                (sum, p) => sum + Number(p.amount),
                0,
              );
              return (
                <tr key={tx.id} className={!tx.isActive ? 'opacity-50' : ''}>
                  <td className="border p-2 text-xs">
                    {tx.orderedAt.toLocaleDateString(locale)}
                  </td>
                  <td className="border p-2 text-xs">
                    {tx.transactionItems.length} {t('itemsUnit')}
                  </td>
                  <td className="border p-2 font-mono text-xs">
                    {tx.totalAmount.toString()} {tx.currency}
                  </td>
                  <td className="border p-2 font-mono text-xs">
                    {totalPaid} {tx.currency}
                  </td>
                  <td className="border p-2 text-xs">
                    {t(`statuses.${tx.status}`)}
                  </td>
                  <td className="border p-2">
                    <TransactionActionsCell
                      transaction={{
                        id: tx.id,
                        supplierId: tx.supplierId,
                        isActive: tx.isActive,
                      }}
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