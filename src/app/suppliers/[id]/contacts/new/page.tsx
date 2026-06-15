import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
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

  const t = await getTranslations('formPage');

  return (
    <FormPage
      title={t('newContact', { name: supplier.nameZh })}
      backHref={`/suppliers/${supplierId}`}
      backLabel={t('backToSupplierDetail')}
      maxWidthClass="max-w-5xl"
    >
      <ContactForm supplierId={supplierId} />
    </FormPage>
  );
}
