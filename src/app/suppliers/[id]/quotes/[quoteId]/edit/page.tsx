import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { FormPage } from '@/components/forms/form-page';
import { QuoteForm, type QuoteFormInitialData } from '../../_components/QuoteForm';
import { FileUploader } from '../../../_components/file-uploader';
import { QuoteImageGallery } from '../../../_components/quote-image-gallery';
import { DetailSection } from '../../../_components/detail-section';

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

  const [availableContacts, availableTags, quoteImages, locale, tFiles] = await Promise.all([
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
    prisma.file.findMany({
      where: { quoteId, type: 'QUOTE_IMAGE', isActive: true },
      select: {
        id: true, fileName: true, thumbnailKey: true, isCover: true,
        titleZh: true, titleRu: true, sizeBytes: true,
      },
      orderBy: [
        { isCover: 'desc' },
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    }),
    getLocale(),
    getTranslations('files'),
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
    <FormPage
      title={`编辑报价 #${quote.id}`}
      backHref={`/suppliers/${supplierId}`}
      backLabel="返回供应商详情"
      maxWidthClass="max-w-5xl"
    >
      <QuoteForm
        supplierId={supplierId}
        initialData={initialData}
        availableContacts={availableContacts}
        availableTags={availableTags}
        locale={locale}
      />

      <div className="mt-8">
        <DetailSection title={tFiles('quoteImagesTitle')}>
          <FileUploader
            ownerId={quoteId}
            type="QUOTE_IMAGE"
            accept="image/png,image/jpeg,image/webp,image/gif"
            maxBytes={10 * 1024 * 1024}
            label={tFiles('uploadQuoteImages')}
            acceptHint={tFiles('quoteImageAcceptHint')}
          />
          <QuoteImageGallery supplierId={supplierId} items={quoteImages} />
        </DetailSection>
      </div>
    </FormPage>
  );
}