import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { FormPage } from '@/components/forms/form-page';
import { QuoteForm } from '../_components/QuoteForm';

export default async function NewQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const supplierId = parseInt(idStr, 10);
  if (isNaN(supplierId)) notFound();

  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier || !supplier.isActive) notFound();

  const [availableContacts, availableTags, locale] = await Promise.all([
    prisma.contact.findMany({
      where: { supplierId, status: 'ACTIVE' },
      select: { id: true, nameZh: true },
      orderBy: { isPrimary: 'desc' },
    }),
    prisma.tag.findMany({
      where: { category: 'PRODUCT', isActive: true },
      select: { id: true, nameZh: true, nameRu: true },
      orderBy: { nameZh: 'asc' },
    }),
    getLocale(),
  ]);

  return (
    <FormPage
      title={`为「${supplier.nameZh}」新建报价`}
      backHref={`/suppliers/${supplierId}`}
      backLabel="返回供应商详情"
      maxWidthClass="max-w-5xl"
    >
      <QuoteForm
        supplierId={supplierId}
        availableContacts={availableContacts}
        availableTags={availableTags}
        locale={locale}
      />
    </FormPage>
  );
}