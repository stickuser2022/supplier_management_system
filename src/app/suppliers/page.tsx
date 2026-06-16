import { getTranslations, getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { requireCurrentUser, isOwner } from '@/lib/auth';
import { pickLocalized } from '@/i18n/pick-localized';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SupplierActionsCell } from './_components/SupplierActionsCell';
import { SupplierSearchAndFilter } from './_components/SupplierSearchAndFilter';
import { CooperationLevelBadge } from '@/components/suppliers/cooperation-level-badge';
import { COOPERATION_LEVELS } from './_validations/supplier-schema';
import { cn } from '@/lib/utils';
import type { Prisma } from '@/generated/prisma/client';

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{
    archived?: string;
    q?: string;
    tags?: string;
    level?: string;
  }>;
}) {
  const params = await searchParams;
  const showArchived = params.archived === '1';
  const q = (params.q ?? '').trim();
  const tagIds = (params.tags ?? '')
    .split(',')
    .map((s) => parseInt(s, 10))
    .filter((n) => !isNaN(n) && n > 0);
  const levelParam =
    params.level && (COOPERATION_LEVELS as readonly string[]).includes(params.level)
      ? (params.level as (typeof COOPERATION_LEVELS)[number])
      : null;

  const t = await getTranslations('suppliers');
  const locale = await getLocale();

  // 组合 where 条件
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
        // 通过 Quote 关联查产品名
        { quotes: { some: { productNameZh: { contains: q } } } },
        { quotes: { some: { productNameRu: { contains: q } } } },
      ],
    });
  }
  // 标签 AND 语义:每个 tag 都必须命中。命中定义 = 供应商自己挂了 OR 旗下有 Quote 挂了
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
    isActive: !showArchived,
    ...(whereAnd.length > 0 ? { AND: whereAnd } : {}),
  };

  const [suppliers, currentUser, allTags] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    }),
    requireCurrentUser(),
    prisma.tag.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { nameZh: 'asc' }],
      select: { id: true, category: true, nameZh: true, nameRu: true, color: true },
    }),
  ]);

  // 一次性查 logo,按 supplierId 索引(避免 N+1)
  const logoFiles = await prisma.file.findMany({
    where: {
      supplierId: { in: suppliers.map((s) => s.id) },
      type: 'SUPPLIER_LOGO',
      isActive: true,
    },
    select: { id: true, supplierId: true },
  });
  const logoMap = new Map<number, number>();
  for (const f of logoFiles) {
    if (f.supplierId) logoMap.set(f.supplierId, f.id);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 页面头部 */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('total', { count: suppliers.length })}
          </p>
        </div>
        {!showArchived && (
          <Button asChild>
            <Link href="/suppliers/new">{t('newSupplier')}</Link>
          </Button>
        )}
      </div>

      {/* 搜索 + 筛选 */}
      <SupplierSearchAndFilter
        initialQ={q}
        initialTagIds={tagIds}
        initialLevel={levelParam}
        allTags={allTags}
        locale={locale}
      />

      {/* Tab 切换 */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-1 -mb-px">
          <TabLink href="/suppliers" isActive={!showArchived}>
            {t('activeView')}
          </TabLink>
          <TabLink href="/suppliers?archived=1" isActive={showArchived}>
            {t('archivedView')}
          </TabLink>
        </nav>
      </div>

      {/* 供应商表格 */}
      <div className="border border-border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t('columns.code')}</TableHead>
              <TableHead>{t('columns.name')}</TableHead>
              <TableHead>{t('columns.location')}</TableHead>
              <TableHead>{t('columns.cooperationLevel')}</TableHead>
              <TableHead>{t('columns.createdAt')}</TableHead>
              <TableHead className="text-right">{t('columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  {q || tagIds.length > 0 || levelParam
                    ? t('search.noResults')
                    : t('emptyList')}
                </TableCell>
              </TableRow>
            )}
            {suppliers.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {s.code}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/suppliers/${s.id}`}
                    className="inline-flex items-center gap-2 font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {logoMap.has(s.id) ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={`/api/files/${logoMap.get(s.id)}?thumb=1`}
                        alt=""
                        className="size-7 rounded object-cover border border-border flex-shrink-0"
                      />
                    ) : (
                      <span className="size-7 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                        {(s.nameZh ?? '?').slice(0, 1)}
                      </span>
                    )}
                    {pickLocalized(s.nameZh, s.nameRu, locale)}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {pickLocalized(s.provinceZh, s.provinceRu, locale)}
                  {' / '}
                  {pickLocalized(s.cityZh, s.cityRu, locale)}
                </TableCell>
                <TableCell>
                  <CooperationLevelBadge level={s.cooperationLevel} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {s.createdAt.toLocaleDateString(locale)}
                </TableCell>
                <TableCell className="text-right">
                  <SupplierActionsCell
                    supplier={{ id: s.id, nameZh: s.nameZh, isActive: s.isActive }}
                    canEdit={isOwner(s, currentUser)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TabLink({
  href,
  isActive,
  children,
}: {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'px-3 py-2 text-sm font-medium border-b-2 transition-colors rounded-t-sm',
        'focus:outline-none focus-visible:bg-muted/50',   // ← 新增这一行
        isActive
          ? 'border-foreground text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </Link>
  );
}