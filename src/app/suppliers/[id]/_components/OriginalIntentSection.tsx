import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { Pencil, Trash2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireCurrentUser, isOwner } from '@/lib/auth';
import { pickLocalized } from '@/i18n/pick-localized';
import { Button } from '@/components/ui/button';
import { DetailSection } from './detail-section';
import { ClearOriginalIntentButton } from './ClearOriginalIntentButton';

export async function OriginalIntentSection({ supplierId }: { supplierId: number }) {
  const t = await getTranslations('originalIntent');
  const locale = await getLocale();

  const [supplier, currentUser] = await Promise.all([
    prisma.supplier.findUnique({
      where: { id: supplierId },
      select: {
        createdById: true,
        isActive: true,
        originalIntentProductNameZh: true,
        originalIntentProductNameRu: true,
        originalIntentOverviewZh: true,
        originalIntentOverviewRu: true,
      },
    }),
    requireCurrentUser(),
  ]);

  if (!supplier) return null;

  // 判断是否已填写
  const hasContent = Boolean(
    supplier.originalIntentProductNameZh ||
    supplier.originalIntentOverviewZh,
  );

  // 查询原始意图图片
  const images = hasContent
    ? await prisma.file.findMany({
        where: {
          supplierId,
          type: 'ORIGINAL_INTENT_IMAGE',
          isActive: true,
        },
        select: {
          id: true,
          thumbnailKey: true,
          sortOrder: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      })
    : [];

  const canEdit = isOwner(supplier, currentUser);

  return (
    <DetailSection
      title={t('title')}
      action={
        canEdit ? (
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href={`/suppliers/${supplierId}/original-intent/edit`}>
                <Pencil className="size-3.5" />
                {hasContent ? t('edit') : t('create')}
              </Link>
            </Button>
            {hasContent && (
              <ClearOriginalIntentButton supplierId={supplierId} />
            )}
          </div>
        ) : undefined
      }
    >
      {!hasContent ? (
        <p className="text-sm text-muted-foreground italic">{t('empty')}</p>
      ) : (
        <div className="space-y-4">
          {/* 产品名称 */}
          {supplier.originalIntentProductNameZh && (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {locale === 'ru' ? 'Продукт' : '产品'}
              </span>
              <p className="mt-1 text-sm font-medium text-foreground">
                {pickLocalized(
                  supplier.originalIntentProductNameZh,
                  supplier.originalIntentProductNameRu,
                  locale,
                )}
              </p>
            </div>
          )}

          {/* 概述 */}
          {supplier.originalIntentOverviewZh && (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {locale === 'ru' ? 'Описание' : '概述'}
              </span>
              <p className="mt-1 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {pickLocalized(
                  supplier.originalIntentOverviewZh,
                  supplier.originalIntentOverviewRu,
                  locale,
                )}
              </p>
            </div>
          )}

          {/* 图片 */}
          {images.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {locale === 'ru' ? 'Изображения' : '图片'}
              </span>
              <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {images.map((img) => (
                  <a
                    key={img.id}
                    href={`/api/files/${img.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square rounded-md border border-border overflow-hidden bg-muted hover:ring-2 hover:ring-primary/50 transition-all"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/files/${img.id}?thumb=1`}
                      alt=""
                      className="size-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DetailSection>
  );
}
