import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
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
    <div className="p-6">
      <Link href={`/suppliers/${supplierId}`} className="text-sm text-blue-600 hover:underline">
        ← 返回供应商详情
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">
        为「{supplier.nameZh}」添加沟通记录
      </h1>
      <NoteForm
        supplierId={supplierId}
        availableContacts={availableContacts}
        availableQuotes={availableQuotes}
      />
    </div>
  );
}