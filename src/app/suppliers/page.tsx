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
import { CooperationLevelBadge } from '@/components/suppliers/cooperation-level-badge';
import { cn } from '@/lib/utils';

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const params = await searchParams;
  const showArchived = params.archived === '1';

  const t = await getTranslations('suppliers');
  const locale = await getLocale();

  const [suppliers, currentUser] = await Promise.all([
    prisma.supplier.findMany({
      where: { isActive: !showArchived },
      orderBy: { createdAt: 'desc' },
    }),
    requireCurrentUser(),
  ]);

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
            {suppliers.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {s.code}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/suppliers/${s.id}`}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                  >
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