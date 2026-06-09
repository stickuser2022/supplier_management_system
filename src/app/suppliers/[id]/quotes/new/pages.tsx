import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
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
    <div className="p-6">
      <Link href={`/suppliers/${supplierId}`} className="text-sm text-blue-600 hover:underline">
        ← 返回供应商详情
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">
        为「{supplier.nameZh}」新建报价
      </h1>
      <QuoteForm
        supplierId={supplierId}
        availableContacts={availableContacts}
        availableTags={availableTags}
        locale={locale}
      />
    </div>
  );
}