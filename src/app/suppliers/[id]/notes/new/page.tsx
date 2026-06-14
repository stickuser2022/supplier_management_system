import { notFound } from 'next/navigation';
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

  return (
    <FormPage
      title={`为「${supplier.nameZh}」添加沟通记录`}
      backHref={`/suppliers/${supplierId}`}
      backLabel="返回供应商详情"
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