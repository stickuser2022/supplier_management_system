import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
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
    <div className="p-6">
      <Link href="/suppliers" className="text-sm text-blue-600 hover:underline">
        ← 返回列表
      </Link>
      <h1 className="text-2xl font-bold mb-6 mt-2">编辑 {supplier.nameZh}</h1>
      <SupplierForm initialData={initialData} />
    </div>
  );
}