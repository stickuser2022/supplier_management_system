import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { FormPage } from '@/components/forms/form-page';
import { SupplierForm, type SupplierFormInitialData } from '../../_components/SupplierForm';

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) notFound();

  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier || !supplier.isActive) notFound();

  const t = await getTranslations('formPage');

  const initialData: SupplierFormInitialData = {
    id: supplier.id,
    code: supplier.code,
    nameZh: supplier.nameZh,
    nameRu: supplier.nameRu,
    nameRuAutoTranslated: supplier.nameRuAutoTranslated,
    shortNameZh: supplier.shortNameZh,
    shortNameRu: supplier.shortNameRu,
    shortNameRuAutoTranslated: supplier.shortNameRuAutoTranslated,
    provinceZh: supplier.provinceZh,
    provinceRu: supplier.provinceRu,
    provinceRuAutoTranslated: supplier.provinceRuAutoTranslated,
    cityZh: supplier.cityZh,
    cityRu: supplier.cityRu,
    cityRuAutoTranslated: supplier.cityRuAutoTranslated,
    districtZh: supplier.districtZh,
    districtRu: supplier.districtRu,
    districtRuAutoTranslated: supplier.districtRuAutoTranslated,
    addressZh: supplier.addressZh,
    addressRu: supplier.addressRu,
    addressRuAutoTranslated: supplier.addressRuAutoTranslated,
    descriptionZh: supplier.descriptionZh,
    descriptionRu: supplier.descriptionRu,
    descriptionRuAutoTranslated: supplier.descriptionRuAutoTranslated,
    latitude: supplier.latitude,
    longitude: supplier.longitude,
    cooperationLevel: supplier.cooperationLevel,
    discoveredVia: supplier.discoveredVia,
    website: supplier.website,
  };

  return (
    <FormPage
      title={t('editSupplier', { name: supplier.nameZh })}
      backHref={`/suppliers/${id}`}
      backLabel={t('backToDetail')}
      maxWidthClass="max-w-5xl"
    >
      <SupplierForm initialData={initialData} />
    </FormPage>
  );
}