import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { FormPage } from '@/components/forms/form-page';
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
        id: true, productNameZh: true, quotedAt: true,
        unitPrice: true, currency: true,
      },
      orderBy: { quotedAt: 'desc' },
    }),
  ]);
  if (!supplier) notFound();

  return (
    <FormPage
      title={`为「${supplier.nameZh}」新建订单`}
      backHref={`/suppliers/${supplierId}`}
      backLabel="返回供应商详情"
      maxWidthClass="max-w-5xl"
    >
      <TransactionForm
        supplierId={supplierId}
        availableContacts={availableContacts}
        availableQuotes={availableQuotes.map((q) => ({
          ...q,
          unitPrice: q.unitPrice.toString(),
        }))}
      />
    </FormPage>
  );
}