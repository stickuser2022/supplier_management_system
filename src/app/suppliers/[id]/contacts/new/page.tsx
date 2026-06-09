import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
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
    <div className="p-6">
      <Link href={`/suppliers/${supplierId}`} className="text-sm text-blue-600 hover:underline">
        ← 返回供应商详情
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">
        为「{supplier.nameZh}」新建联系人
      </h1>
      <ContactForm supplierId={supplierId} />
    </div>
  );
}