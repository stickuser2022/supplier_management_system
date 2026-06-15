import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { FormPage } from '@/components/forms/form-page';
import { NoteForm } from '../_components/NoteForm';

export default async function NewNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const supplierId = parseInt(idStr, 10);
  if (isNaN(supplierId)) notFound();

  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier || !supplier.isActive) notFound();

  const [availableContacts, availableQuotes] = await Promise.all([
    prisma.contact.findMany({
      where: { supplierId, status: 'ACTIVE' },
      select: { id: true, nameZh: true },
      orderBy: { isPrimary: 'desc' },
    }),
    prisma.quote.findMany({
      where: { supplierId, status: 'ACTIVE' },
      select: { id: true, productNameZh: true, quotedAt: true },
      orderBy: { quotedAt: 'desc' },
    }),
  ]);

  const t = await getTranslations('formPage');

  return (
    <FormPage
      title={t('newNote', { name: supplier.nameZh })}
      backHref={`/suppliers/${supplierId}`}
      backLabel={t('backToSupplierDetail')}
      maxWidthClass="max-w-5xl"
    >
      <NoteForm
        supplierId={supplierId}
        availableContacts={availableContacts}
        availableQuotes={availableQuotes}
      />
    </FormPage>
  );
}