import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { pickLocalized } from '@/i18n/pick-localized';
import { FormPage } from '@/components/forms/form-page';
import { ContactForm } from '../_components/ContactForm';

export default async function NewContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const supplierId = parseInt(idStr, 10);
  if (isNaN(supplierId)) notFound();

  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier || !supplier.isActive) notFound();

  const [t, locale] = await Promise.all([
    getTranslations('formPage'),
    getLocale(),
  ]);
  const supplierName = pickLocalized(supplier.nameZh, supplier.nameRu, locale);

  return (
    <FormPage
      title={t('newContact', { name: supplierName })}
      backHref={`/suppliers/${supplierId}`}
      backLabel={t('backToSupplierDetail')}
      maxWidthClass="max-w-5xl"
    >
      <ContactForm supplierId={supplierId} />
    </FormPage>
  );
}
