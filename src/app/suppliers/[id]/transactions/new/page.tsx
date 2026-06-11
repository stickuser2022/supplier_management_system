import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { TransactionForm } from '../_components/TransactionForm';

export default async function NewTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const supplierId = parseInt(idStr, 10);
  if (isNaN(supplierId)) notFound();

  const [supplier, availableContacts, availableQuotes] = await Promise.all([
    prisma.supplier.findUnique({ where: { id: supplierId } }),
    prisma.contact.findMany({
      where: { supplierId, status: 'ACTIVE' },
      select: { id: true, nameZh: true },
      orderBy: { isPrimary: 'desc' },
    }),
    prisma.quote.findMany({
      where: { supplierId, status: 'ACTIVE' },
      select: {
        id: true,
        productNameZh: true,
        quotedAt: true,
        unitPrice: true,
        currency: true,
      },
      orderBy: { quotedAt: 'desc' },
    }),
  ]);
  if (!supplier) notFound();

  return (
    <div className="p-6">
      <Link
        href={`/suppliers/${supplierId}`}
        className="text-sm text-blue-600 hover:underline"
      >
        ← {supplier.nameZh}
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">新建订单</h1>
      <TransactionForm
        supplierId={supplierId}
        availableContacts={availableContacts}
        availableQuotes={availableQuotes.map((q) => ({
          ...q,
          unitPrice: q.unitPrice.toString(),
        }))}
      />
    </div>
  );
}