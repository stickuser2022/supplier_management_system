import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { pickLocalized } from '@/i18n/pick-localized';
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

  const [t, locale] = await Promise.all([
    getTranslations('formPage'),
    getLocale(),
  ]);
  const supplierName = pickLocalized(supplier.nameZh, supplier.nameRu, locale);

  return (
    <FormPage
      title={t('newNote', { name: supplierName })}
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