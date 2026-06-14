import { notFound } from 'next/navigation';
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

  return (
    <FormPage
      title={`为「${supplier.nameZh}」新建联系人`}
      backHref={`/suppliers/${supplierId}`}
      backLabel="返回供应商详情"
      maxWidthClass="max-w-5xl"
    >
      <ContactForm supplierId={supplierId} />
    </FormPage>
  );
}