import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { pickLocalized } from '@/i18n/pick-localized';
import { SupplierActionsCell } from '../_components/SupplierActionsCell';

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) notFound();

  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) notFound();

  const t = await getTranslations('supplierDetail');
  const tLevel = await getTranslations('cooperationLevel');
  const locale = await getLocale();

  return (
    <div className="p-6 max-w-5xl">
      {/* 返回链接 */}
      <Link href="/suppliers" className="text-sm text-blue-600 hover:underline">
        {t('back')}
      </Link>

      {/* 标题 + 操作按钮(复用 SupplierActionsCell)*/}
      <div className="flex items-start justify-between mt-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {pickLocalized(supplier.nameZh, supplier.nameRu, locale)}
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-mono">{supplier.code}</p>
        </div>
        <SupplierActionsCell
          supplier={{ id: supplier.id, nameZh: supplier.nameZh, isActive: supplier.isActive }}
        />
      </div>

      {/* 已停用警示 */}
      {!supplier.isActive && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded text-amber-700">
          {t('archivedWarning')}
        </div>
      )}

      {/* 基本信息区段 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 pb-1 border-b">
          {t('sections.basicInfo')}
        </h2>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-gray-500">{t('fields.code')}</dt>
          <dd className="font-mono">{supplier.code}</dd>

          <dt className="text-gray-500">{t('fields.name')}</dt>
          <dd>{pickLocalized(supplier.nameZh, supplier.nameRu, locale)}</dd>

          {(supplier.shortNameZh ?? '') !== '' && (
            <>
              <dt className="text-gray-500">{t('fields.shortName')}</dt>
              <dd>{pickLocalized(supplier.shortNameZh ?? '', supplier.shortNameRu, locale)}</dd>
            </>
          )}

          <dt className="text-gray-500">{t('fields.address')}</dt>
          <dd>
            {pickLocalized(supplier.provinceZh, supplier.provinceRu, locale)}
            {' / '}
            {pickLocalized(supplier.cityZh, supplier.cityRu, locale)}
            {supplier.districtZh && (
              <> / {pickLocalized(supplier.districtZh, supplier.districtRu, locale)}</>
            )}
            {supplier.addressZh && (
              <> / {pickLocalized(supplier.addressZh, supplier.addressRu, locale)}</>
            )}
          </dd>

          <dt className="text-gray-500">{t('fields.coordinates')}</dt>
          <dd className="font-mono text-xs">{supplier.latitude}, {supplier.longitude}</dd>

          <dt className="text-gray-500">{t('fields.cooperationLevel')}</dt>
          <dd>{tLevel(supplier.cooperationLevel)}</dd>

          <dt className="text-gray-500">{t('fields.discoveredVia')}</dt>
          <dd>{supplier.discoveredVia}</dd>

          {supplier.website && (
            <>
              <dt className="text-gray-500">{t('fields.website')}</dt>
              <dd>
                <a
                  href={supplier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {supplier.website}
                </a>
              </dd>
            </>
          )}

          {supplier.descriptionZh && (
            <>
              <dt className="text-gray-500">{t('fields.description')}</dt>
              <dd className="whitespace-pre-wrap">
                {pickLocalized(supplier.descriptionZh, supplier.descriptionRu, locale)}
              </dd>
            </>
          )}

          <dt className="text-gray-500">{t('fields.createdAt')}</dt>
          <dd>{supplier.createdAt.toLocaleDateString(locale)}</dd>
        </dl>
      </section>

      {/* 4 个占位区段(后续里程碑填充)*/}
      <PlaceholderSection title={t('sections.contacts')} t={t} />
      <PlaceholderSection title={t('sections.quotes')} t={t} />
      <PlaceholderSection title={t('sections.notes')} t={t} />
      <PlaceholderSection title={t('sections.transactions')} t={t} />
    </div>
  );
}

// 占位区段:1d.1 / 1d.2 / 1d.3 时各自替换为真实组件
function PlaceholderSection({
  title,
  t,
}: {
  title: string;
  t: (key: string) => string;
}) {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3 pb-1 border-b">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          type="button"
          disabled
          className="text-sm px-3 py-1 border rounded bg-gray-100 text-gray-400 cursor-not-allowed"
        >
          {t('placeholder.addButton')}
        </button>
      </div>
      <p className="text-sm text-gray-500 italic">{t('placeholder.notImplemented')}</p>
    </section>
  );
}