import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { QuoteForm, type QuoteFormInitialData } from '../../_components/QuoteForm';

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string; quoteId: string }>;
}) {
  const { id: idStr, quoteId: quoteIdStr } = await params;
  const supplierId = parseInt(idStr, 10);
  const quoteId = parseInt(quoteIdStr, 10);
  if (isNaN(supplierId) || isNaN(quoteId)) notFound();

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { quoteTags: true },
  });
  if (!quote || quote.supplierId !== supplierId) notFound();

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

  const initialData: QuoteFormInitialData = {
    id: quote.id,
    contactId: quote.contactId,
    productNameZh: quote.productNameZh,
    productNameRu: quote.productNameRu,
    productNameRuAutoTranslated: quote.productNameRuAutoTranslated,
    productSpecZh: quote.productSpecZh,
    productSpecRu: quote.productSpecRu,
    productSpecRuAutoTranslated: quote.productSpecRuAutoTranslated,
    unitPrice: quote.unitPrice.toString(),
    currency: quote.currency,
    unitZh: quote.unitZh,
    unitRu: quote.unitRu,
    moq: quote.moq,
    quotedAt: quote.quotedAt.toISOString().slice(0, 10),
    validUntil: quote.validUntil ? quote.validUntil.toISOString().slice(0, 10) : null,
    leadTimeDays: quote.leadTimeDays,
    paymentTerms: quote.paymentTerms,
    source: quote.source,
    tagIds: quote.quoteTags.map((qt) => qt.tagId),
  };

  return (
    <div className="p-6">
      <Link href={`/suppliers/${supplierId}`} className="text-sm text-blue-600 hover:underline">
        ← 返回供应商详情
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">编辑报价 #{quote.id}</h1>
      <QuoteForm
        supplierId={supplierId}
        initialData={initialData}
        availableContacts={availableContacts}
        availableTags={availableTags}
        locale={locale}
      />
    </div>
  );
}