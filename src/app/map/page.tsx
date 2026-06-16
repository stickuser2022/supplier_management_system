import { getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import MapPageClient from './MapPageClient';
import { COOPERATION_LEVELS } from '../suppliers/_validations/supplier-schema';
import type { Prisma } from '@/generated/prisma/client';

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tags?: string; level?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? '').trim();
  const tagIds = (params.tags ?? '')
    .split(',')
    .map((s) => parseInt(s, 10))
    .filter((n) => !isNaN(n) && n > 0);
  const levelParam =
    params.level && (COOPERATION_LEVELS as readonly string[]).includes(params.level)
      ? (params.level as (typeof COOPERATION_LEVELS)[number])
      : null;

  // 组合 where 条件(跟 /suppliers 同套)
  const whereAnd: Prisma.SupplierWhereInput[] = [];
  if (q) {
    whereAnd.push({
      OR: [
        { code: { contains: q } },
        { nameZh: { contains: q } },
        { nameRu: { contains: q } },
        { shortNameZh: { contains: q } },
        { shortNameRu: { contains: q } },
        { provinceZh: { contains: q } },
        { provinceRu: { contains: q } },
        { cityZh: { contains: q } },
        { cityRu: { contains: q } },
        { districtZh: { contains: q } },
        { districtRu: { contains: q } },
        { addressZh: { contains: q } },
        { addressRu: { contains: q } },
        { mainProductsZh: { contains: q } },
        { mainProductsRu: { contains: q } },
        { descriptionZh: { contains: q } },
        { descriptionRu: { contains: q } },
        { discoveredVia: { contains: q } },
        { quotes: { some: { productNameZh: { contains: q } } } },
        { quotes: { some: { productNameRu: { contains: q } } } },
      ],
    });
  }
  for (const tagId of tagIds) {
    whereAnd.push({
      OR: [
        { supplierTags: { some: { tagId } } },
        { quotes: { some: { quoteTags: { some: { tagId } } } } },
      ],
    });
  }
  if (levelParam) {
    whereAnd.push({ cooperationLevel: levelParam });
  }

  const where: Prisma.SupplierWhereInput = {
    isActive: true,
    ...(whereAnd.length > 0 ? { AND: whereAnd } : {}),
  };

  const [suppliers, allTags, locale] = await Promise.all([
    prisma.supplier.findMany({
      where,
      select: {
        id: true,
        nameZh: true,
        nameRu: true,
        cityZh: true,
        cityRu: true,
        provinceZh: true,
        provinceRu: true,
        addressZh: true,
        addressRu: true,
        mainProductsZh: true,
        mainProductsRu: true,
        latitude: true,
        longitude: true,
        cooperationLevel: true,
        supplierTags: {
          select: {
            tagId: true,
            tag: { select: { id: true, nameZh: true, nameRu: true, color: true } },
          },
        },
        _count: {
          select: {
            quotes: { where: { status: 'ACTIVE' } },
            transactions: { where: { isActive: true } },
            contacts: { where: { status: 'ACTIVE' } },
          },
        },
      },
    }),
    prisma.tag.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { nameZh: 'asc' }],
      select: { id: true, category: true, nameZh: true, nameRu: true, color: true },
    }),
    getLocale(),
  ]);

  // 一次性查所有 logo,按 supplierId 索引
  const supplierIds = suppliers.map((s) => s.id);
  const logoFiles = await prisma.file.findMany({
    where: { supplierId: { in: supplierIds }, type: 'SUPPLIER_LOGO', isActive: true },
    select: { id: true, supplierId: true },
  });
  const logoMap = new Map<number, number>();
  for (const f of logoFiles) {
    if (f.supplierId) logoMap.set(f.supplierId, f.id);
  }

  // 一次性查所有主联系人(isPrimary=true 且 ACTIVE)
  const primaryContacts = await prisma.contact.findMany({
    where: { supplierId: { in: supplierIds }, isPrimary: true, status: 'ACTIVE' },
    select: {
      supplierId: true,
      nameZh: true, nameRu: true,
      phone: true, wechat: true, email: true,
      whatsapp: true, telegram: true, qq: true,
    },
  });
  const primaryContactMap = new Map<number, (typeof primaryContacts)[number]>();
  for (const c of primaryContacts) primaryContactMap.set(c.supplierId, c);

  const enriched = suppliers.map((s) => ({
    ...s,
    logoFileId: logoMap.get(s.id) ?? null,
    primaryContact: primaryContactMap.get(s.id) ?? null,
  }));

  return (
    <MapPageClient
      suppliers={enriched}
      allTags={allTags}
      locale={locale}
      initialQ={q}
      initialTagIds={tagIds}
      initialLevel={levelParam}
    />
  );
}
