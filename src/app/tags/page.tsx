import { getLocale, getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { requireCurrentUser, isOwner } from '@/lib/auth';
import { pickLocalized } from '@/i18n/pick-localized';
import { TAG_CATEGORIES } from './_validations/tag-schema';
import { TagDialog } from './_components/TagDialog';
import { TagRowActions } from './_components/TagRowActions';

export default async function TagsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const params = await searchParams;
  const showArchived = params.archived === '1';

  const [tags, currentUser, t, tCat, locale] = await Promise.all([
    prisma.tag.findMany({
      where: { isActive: !showArchived },
      orderBy: [{ category: 'asc' }, { nameZh: 'asc' }],
      include: {
        _count: {
          select: { supplierTags: true, quoteTags: true },
        },
      },
    }),
    requireCurrentUser(),
    getTranslations('tags'),
    getTranslations('tagCategory'),
    getLocale(),
  ]);

  // 按 category 分组
  const byCategory: Record<string, typeof tags> = {};
  for (const cat of TAG_CATEGORIES) byCategory[cat] = [];
  for (const tag of tags) byCategory[tag.category]?.push(tag);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 顶部 */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        {!showArchived && <TagDialog mode="create" />}
      </div>

      {/* tab 切换 active / archived */}
      <div className="border-b border-border my-6">
        <nav className="flex gap-1 -mb-px text-sm">
          <a
            href="/tags"
            className={`px-3 py-2 border-b-2 transition-colors ${
              !showArchived
                ? 'border-foreground text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('activeView')}
          </a>
          <a
            href="/tags?archived=1"
            className={`px-3 py-2 border-b-2 transition-colors ${
              showArchived
                ? 'border-foreground text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('archivedView')}
          </a>
        </nav>
      </div>

      {/* 5 个 category section */}
      <div className="space-y-8">
        {TAG_CATEGORIES.map((cat) => {
          const items = byCategory[cat] ?? [];
          return (
            <section key={cat}>
              <div className="flex items-baseline gap-2 mb-3">
                <h2 className="text-base font-medium text-foreground">
                  {tCat(cat)}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {items.length} {t('countSuffix')}
                </span>
              </div>

              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground italic px-3 py-2 bg-muted/40 rounded-md">
                  {t('emptyInCategory')}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {items.map((tag) => {
                    const usageCount = tag._count.supplierTags + tag._count.quoteTags;
                    const canEdit = isOwner(tag, currentUser);
                    return (
                      <div
                        key={tag.id}
                        className="group inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-md border border-border bg-card hover:bg-muted/40 transition-colors"
                      >
                        {/* 颜色圆点 */}
                        <span
                          className="size-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color ?? '#9ca3af' }}
                        />
                        {/* 中文名 / 俄文名 */}
                        <span className="text-sm font-medium text-foreground">
                          {pickLocalized(tag.nameZh, tag.nameRu, locale)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {locale === 'ru' ? tag.nameZh : tag.nameRu}
                        </span>
                        {/* 使用次数 */}
                        {usageCount > 0 && (
                          <span
                            className="text-xs text-muted-foreground bg-muted px-1.5 rounded-full"
                            title={t('usageTooltip', { count: usageCount })}
                          >
                            {usageCount}
                          </span>
                        )}
                        {/* 行内操作(hover 才显示) */}
                        {canEdit && (
                          <TagRowActions
                            tag={{
                              id: tag.id,
                              category: tag.category,
                              nameZh: tag.nameZh,
                              nameRu: tag.nameRu,
                              color: tag.color,
                              icon: tag.icon,
                              isActive: tag.isActive,
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
