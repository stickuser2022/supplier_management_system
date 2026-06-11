import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { pickLocalized } from '@/i18n/pick-localized';
import { SupplierActionsCell } from '../_components/SupplierActionsCell';
import { ContactsList } from './contacts/_components/ContactsList';
import { QuotesList } from './quotes/_components/QuotesList';
import { NotesList } from './notes/_components/NotesList';
import { SupplierLogo } from './_components/supplier-logo';
import { FileUploader } from './_components/file-uploader';
import { BrochureGallery } from './_components/brochure-gallery';
import { DocList } from './_components/doc-list';
import { SupplierVideoGallery } from './_components/supplier-video-gallery';
import { TransactionsList } from './transactions/_components/TransactionsList';

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
  const currentLogo = await prisma.file.findFirst({
  where: {
    supplierId: id,
    type: 'SUPPLIER_LOGO',
    isActive: true,
  },
  select: {
    id: true,
    fileName: true,
  },
  
  orderBy: { createdAt: 'desc' },  // 防御性,理论上只有 1 个
  });
  const brochures = await prisma.file.findMany({
  where: {
    supplierId: id,
    type: 'SUPPLIER_BROCHURE',
    isActive: true,
  },
  select: {
    id: true,
    fileName: true,
    mimeType: true,
    sizeBytes: true,
    thumbnailKey: true,
    titleZh: true,
    titleRu: true,
    createdAt: true,
  },
  orderBy: { createdAt: 'desc' },
});

const docs = await prisma.file.findMany({
  where: {
    supplierId: id,
    type: 'SUPPLIER_DOC',
    isActive: true,
  },
  select: {
    id: true,
    fileName: true,
    mimeType: true,
    sizeBytes: true,
    titleZh: true,
    titleRu: true,
    createdAt: true,
  },
  orderBy: { createdAt: 'desc' },
});
  const t = await getTranslations('supplierDetail');
  const tLevel = await getTranslations('cooperationLevel');
  const tFiles = await getTranslations('files');
  const locale = await getLocale();
  const videos = await prisma.file.findMany({
  where: {
    supplierId: id,
    type: 'SUPPLIER_VIDEO',
    isActive: true,
  },
  select: {
    id: true,
    fileName: true,
    thumbnailKey: true,
    titleZh: true,
    titleRu: true,
    sizeBytes: true,
  },
  orderBy: { createdAt: 'desc' },
});

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
        <SupplierLogo supplierId={id} currentLogo={currentLogo} />
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
      <ContactsList supplierId={supplier.id} />
      <QuotesList supplierId={supplier.id} />
      <NotesList supplierId={supplier.id} />
      {/* 画册 / 产品目录 */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3 pb-1 border-b">
          {tFiles('brochuresTitle')}
        </h2>
        <FileUploader
          ownerId={id}
          type="SUPPLIER_BROCHURE"
          accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
          maxBytes={30 * 1024 * 1024}
          label={tFiles('uploadBrochures')}
          acceptHint={tFiles('brochureAcceptHint')}
        />
        <BrochureGallery supplierId={id} items={brochures} />
      </section>

      {/* 工厂 / 产线视频 */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3 pb-1 border-b">
          {tFiles('videosTitle')}
        </h2>
        <FileUploader
          ownerId={id}
          type="SUPPLIER_VIDEO"
          accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
          maxBytes={200 * 1024 * 1024}
          label={tFiles('uploadVideos')}
          acceptHint={tFiles('videoAcceptHint')}
        />
        <SupplierVideoGallery supplierId={id} items={videos} />
      </section>

      {/* 资质 / 文档 */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3 pb-1 border-b">
          {tFiles('docsTitle')}
        </h2>
        <FileUploader
          ownerId={id}
          type="SUPPLIER_DOC"
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          maxBytes={30 * 1024 * 1024}
          label={tFiles('uploadDocs')}
          acceptHint={tFiles('docAcceptHint')}
        />
        <DocList supplierId={id} items={docs} />
      </section>
      <TransactionsList supplierId={supplier.id} />
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