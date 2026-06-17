import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { pickLocalized } from '@/i18n/pick-localized';
import { CooperationLevelBadge } from '@/components/suppliers/cooperation-level-badge';
import { SupplierActionsCell } from '../_components/SupplierActionsCell';
import { ContactsList } from './contacts/_components/ContactsList';
import { QuotesList } from './quotes/_components/QuotesList';
import { NotesList } from './notes/_components/NotesList';
import { TransactionsList } from './transactions/_components/TransactionsList';
import { SupplierLogo } from './_components/supplier-logo';
import { FileUploader } from './_components/file-uploader';
import { BrochureGallery } from './_components/brochure-gallery';
import { DocList } from './_components/doc-list';
import { SupplierVideoGallery } from './_components/supplier-video-gallery';
import { DetailSection } from './_components/detail-section';
import { DetailField, DetailFieldList } from './_components/detail-field-list';

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) notFound();

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      supplierTags: {
        include: { tag: true },
      },
    },
  });
  if (!supplier) notFound();

  // 并行查 4 类文件,代替原来的串行 4 次 await,首屏更快
  const [currentLogo, brochures, docs, videos] = await Promise.all([
    prisma.file.findFirst({
      where: { supplierId: id, type: 'SUPPLIER_LOGO', isActive: true },
      select: { id: true, fileName: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.file.findMany({
      where: { supplierId: id, type: 'SUPPLIER_BROCHURE', isActive: true },
      select: {
        id: true, fileName: true, mimeType: true, sizeBytes: true,
        thumbnailKey: true, titleZh: true, titleRu: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.file.findMany({
      where: { supplierId: id, type: 'SUPPLIER_DOC', isActive: true },
      select: {
        id: true, fileName: true, mimeType: true, sizeBytes: true,
        titleZh: true, titleRu: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.file.findMany({
      where: { supplierId: id, type: 'SUPPLIER_VIDEO', isActive: true },
      select: {
        id: true, fileName: true, thumbnailKey: true, mimeType: true,
        titleZh: true, titleRu: true, sizeBytes: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const t = await getTranslations('supplierDetail');
  const tFiles = await getTranslations('files');
  const locale = await getLocale();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* 返回链接 */}
      <Link
        href="/suppliers"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        {t('back')}
      </Link>

      {/* 页面头部:logo + 名称(含徽章)+ 编号 | 操作按钮 */}
      <div className="mt-3 mb-6 flex items-start justify-between gap-6">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <SupplierLogo supplierId={id} currentLogo={currentLogo} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold text-foreground">
                {pickLocalized(supplier.nameZh, supplier.nameRu, locale)}
              </h1>
              <CooperationLevelBadge level={supplier.cooperationLevel} />
            </div>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {supplier.code}
            </p>
            {supplier.supplierTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {supplier.supplierTags.map((st) => (
                  <span
                    key={st.tagId}
                    className="inline-flex items-center gap-1.5 pl-2 pr-2.5 py-0.5 rounded-md border border-border bg-card text-xs"
                  >
                    <span
                      className="size-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: st.tag.color ?? '#9ca3af' }}
                    />
                    <span className="text-foreground">
                      {pickLocalized(st.tag.nameZh, st.tag.nameRu, locale)}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          <SupplierActionsCell
            supplier={{ id: supplier.id, nameZh: supplier.nameZh, nameRu: supplier.nameRu, isActive: supplier.isActive }}
          />
        </div>
      </div>

      {/* 已停用警示 */}
      {!supplier.isActive && (
        <div className="mb-6 p-3 rounded-md border border-warning-fg/20 bg-warning-bg text-warning-fg text-sm">
          {t('archivedWarning')}
        </div>
      )}

      {/* 基本信息 */}
      <DetailSection title={t('sections.basicInfo')}>
        <DetailFieldList>
          <DetailField label={t('fields.code')}>
            <span className="font-mono text-sm">{supplier.code}</span>
          </DetailField>

          <DetailField label={t('fields.name')}>
            {pickLocalized(supplier.nameZh, supplier.nameRu, locale)}
          </DetailField>

          {(supplier.shortNameZh ?? '') !== '' && (
            <DetailField label={t('fields.shortName')}>
              {pickLocalized(supplier.shortNameZh ?? '', supplier.shortNameRu, locale)}
            </DetailField>
          )}

          <DetailField label={t('fields.address')}>
            {pickLocalized(supplier.provinceZh, supplier.provinceRu, locale)}
            {' / '}
            {pickLocalized(supplier.cityZh, supplier.cityRu, locale)}
            {supplier.districtZh && (
              <> / {pickLocalized(supplier.districtZh, supplier.districtRu, locale)}</>
            )}
            {supplier.addressZh && (
              <> / {pickLocalized(supplier.addressZh, supplier.addressRu, locale)}</>
            )}
          </DetailField>

          <DetailField label={t('fields.coordinates')}>
            <span className="font-mono text-xs text-muted-foreground">
              {supplier.latitude}, {supplier.longitude}
            </span>
          </DetailField>

          <DetailField label={t('fields.cooperationLevel')}>
            <CooperationLevelBadge level={supplier.cooperationLevel} />
          </DetailField>

          <DetailField label={t('fields.discoveredVia')}>
            {supplier.discoveredVia}
          </DetailField>

          {supplier.website && (
            <DetailField label={t('fields.website')}>
              <a
                href={supplier.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {supplier.website}
              </a>
            </DetailField>
          )}

          {supplier.descriptionZh && (
            <DetailField label={t('fields.description')}>
              <span className="whitespace-pre-wrap">
                {pickLocalized(supplier.descriptionZh, supplier.descriptionRu, locale)}
              </span>
            </DetailField>
          )}

          {supplier.mainProductsZh && (
            <DetailField label={t('fields.mainProducts')}>
              <span className="whitespace-pre-wrap">
                {pickLocalized(supplier.mainProductsZh, supplier.mainProductsRu, locale)}
              </span>
            </DetailField>
          )}

          <DetailField label={t('fields.createdAt')}>
            <span className="text-muted-foreground">
              {supplier.createdAt.toLocaleDateString(locale)}
            </span>
          </DetailField>
        </DetailFieldList>
      </DetailSection>

      {/* 联系人 / 报价 / 沟通 / 订单 */}
      <ContactsList supplierId={supplier.id} />
      <QuotesList supplierId={supplier.id} />
      <NotesList supplierId={supplier.id} />
      <TransactionsList supplierId={supplier.id} />

      {/* 文件区段:画册 / 视频 / 文档 */}
      <DetailSection title={tFiles('brochuresTitle')}>
        <FileUploader
          ownerId={id}
          type="SUPPLIER_BROCHURE"
          accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
          maxBytes={30 * 1024 * 1024}
          label={tFiles('uploadBrochures')}
          acceptHint={tFiles('brochureAcceptHint')}
        />
        <BrochureGallery supplierId={id} items={brochures} />
      </DetailSection>

      <DetailSection title={tFiles('videosTitle')}>
        <FileUploader
          ownerId={id}
          type="SUPPLIER_VIDEO"
          accept="video/mp4,video/quicktime,video/webm,video/x-matroska,image/png,image/jpeg,image/webp,image/gif"
          maxBytes={200 * 1024 * 1024}
          label={tFiles('uploadVideos')}
          acceptHint={tFiles('videoAcceptHint')}
        />
        <SupplierVideoGallery supplierId={id} items={videos} />
      </DetailSection>

      <DetailSection title={tFiles('docsTitle')}>
        <FileUploader
          ownerId={id}
          type="SUPPLIER_DOC"
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          maxBytes={30 * 1024 * 1024}
          label={tFiles('uploadDocs')}
          acceptHint={tFiles('docAcceptHint')}
        />
        <DocList supplierId={id} items={docs} />
      </DetailSection>
    </div>
  );
}