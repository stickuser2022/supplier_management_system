import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
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

  const t = await getTranslations('formPage');

  return (
    <FormPage
      title={t('newTransaction', { name: supplier.nameZh })}
      backHref={`/suppliers/${supplierId}`}
      backLabel={t('backToSupplierDetail')}
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