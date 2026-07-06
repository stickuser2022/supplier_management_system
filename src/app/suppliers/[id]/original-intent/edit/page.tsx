import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { pickLocalized } from '@/i18n/pick-localized';
import { FormPage } from '@/components/forms/form-page';
import { FileUploader } from '../../_components/file-uploader';
import { OriginalIntentImagesGallery } from '../_components/OriginalIntentImagesGallery';
import {
  OriginalIntentForm,
  type OriginalIntentInitialData,
} from '../_components/OriginalIntentForm';
import { DetailSection } from '../../_components/detail-section';

export default async function EditOriginalIntentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const supplierId = parseInt(idStr, 10);
  if (isNaN(supplierId)) notFound();

  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: {
      nameZh: true,
      nameRu: true,
      isActive: true,
      originalIntentProductNameZh: true,
      originalIntentProductNameRu: true,
      originalIntentProductNameRuAutoTranslated: true,
      originalIntentOverviewZh: true,
      originalIntentOverviewRu: true,
      originalIntentOverviewRuAutoTranslated: true,
    },
  });
  if (!supplier || !supplier.isActive) notFound();

  const [t, locale] = await Promise.all([
    getTranslations('formPage'),
    getLocale(),
  ]);

  const supplierName = pickLocalized(supplier.nameZh, supplier.nameRu, locale);

  const initialData: OriginalIntentInitialData = {
    productNameZh: supplier.originalIntentProductNameZh,
    productNameRu: supplier.originalIntentProductNameRu,
    productNameRuAutoTranslated: supplier.originalIntentProductNameRuAutoTranslated,
    overviewZh: supplier.originalIntentOverviewZh,
    overviewRu: supplier.originalIntentOverviewRu,
    overviewRuAutoTranslated: supplier.originalIntentOverviewRuAutoTranslated,
  };

  const tOI = await getTranslations('originalIntent');

  return (
    <FormPage
      title={t('editOriginalIntent', { name: supplierName })}
      backHref={`/suppliers/${supplierId}`}
      backLabel={t('backToSupplierDetail')}
    >
      <OriginalIntentForm supplierId={supplierId} initialData={initialData} />

      {/* 图片上传区 */}
      <div className="mt-8 pt-6 border-t border-border">
        <DetailSection title={tOI('imagesTitle')}>
          <FileUploader
            ownerId={supplierId}
            type="ORIGINAL_INTENT_IMAGE"
            accept="image/png,image/jpeg,image/webp,image/gif"
            maxBytes={10 * 1024 * 1024}
            label={tOI('uploadImage')}
            acceptHint={tOI('imageAcceptHint')}
          />
          <OriginalIntentImagesGallery supplierId={supplierId} />
        </DetailSection>
      </div>
    </FormPage>
  );
}
