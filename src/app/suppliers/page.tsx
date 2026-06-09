import { getTranslations, getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { pickLocalized } from '@/i18n/pick-localized';
import Link from 'next/link';
import { SupplierActionsCell } from './_components/SupplierActionsCell';

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const params = await searchParams;
  const showArchived = params.archived === '1';

  const t = await getTranslations('suppliers');
  const tLevel = await getTranslations('cooperationLevel');
  const locale = await getLocale();

  const suppliers = await prisma.supplier.findMany({
    where: { isActive: !showArchived },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        {!showArchived && (
          <Link
            href="/suppliers/new"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {t('newSupplier')}
          </Link>
        )}
      </div>

      {/* 视图切换 */}
      <div className="mb-4 flex gap-4 text-sm border-b pb-2">
        <Link
          href="/suppliers"
          className={!showArchived ? 'font-semibold text-blue-600' : 'text-gray-500 hover:text-gray-800'}
        >
          {t('activeView')}
        </Link>
        <Link
          href="/suppliers?archived=1"
          className={showArchived ? 'font-semibold text-blue-600' : 'text-gray-500 hover:text-gray-800'}
        >
          {t('archivedView')}
        </Link>
      </div>

      <p className="mb-4 text-gray-600">{t('total', { count: suppliers.length })}</p>

      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="border p-2 text-left">{t('columns.code')}</th>
            <th className="border p-2 text-left">{t('columns.name')}</th>
            <th className="border p-2 text-left">{t('columns.location')}</th>
            <th className="border p-2 text-left">{t('columns.cooperationLevel')}</th>
            <th className="border p-2 text-left">{t('columns.createdAt')}</th>
            <th className="border p-2 text-left">{t('columns.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <tr key={s.id}>
              <td className="border p-2">{s.code}</td>
              <td className="border p-2">
              <Link
                href={`/suppliers/${s.id}`}
                className="text-blue-600 hover:underline"
              >
                {pickLocalized(s.nameZh, s.nameRu, locale)}
              </Link>
            </td>
              <td className="border p-2">
                {pickLocalized(s.provinceZh, s.provinceRu, locale)} / {pickLocalized(s.cityZh, s.cityRu, locale)}
              </td>
              <td className="border p-2">{tLevel(s.cooperationLevel)}</td>
              <td className="border p-2">{s.createdAt.toLocaleDateString(locale)}</td>
              <td className="border p-2">
                <SupplierActionsCell
                  supplier={{ id: s.id, nameZh: s.nameZh, isActive: s.isActive }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}