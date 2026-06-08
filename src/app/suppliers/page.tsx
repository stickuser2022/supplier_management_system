import { getTranslations, getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { pickLocalized } from '@/i18n/pick-localized';
import Link from 'next/link';

export default async function SuppliersPage() {
  // 服务端组件用 getTranslations(异步),客户端组件才用 useTranslations
  const t = await getTranslations('suppliers');
  const tLevel = await getTranslations('cooperationLevel');
  // 拿到当前用户的语言,用来格式化日期
  const locale = await getLocale();

  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
  });

  return (
        <main className="p-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <Link
              href="/suppliers/new"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {t('newSupplier')}
            </Link>
          </div>
      {/* 带参数的翻译:messages 里写 "共 {count} 条" / "Всего: {count}",
          这里 count 占位符被 12 替换,中俄两版的句式哪怕完全不一样也无所谓 */}
      <p className="mb-4 text-gray-600">{t('total', { count: suppliers.length })}</p>

      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="border p-2 text-left">{t('columns.code')}</th>
            <th className="border p-2 text-left">{t('columns.name')}</th>
            <th className="border p-2 text-left">{t('columns.location')}</th>
            <th className="border p-2 text-left">{t('columns.cooperationLevel')}</th>
            <th className="border p-2 text-left">{t('columns.createdAt')}</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <tr key={s.id}>
              <td className="border p-2">{s.code}</td>
              <td className="border p-2">{pickLocalized(s.nameZh, s.nameRu, locale)}</td>
              <td className="border p-2">
                {pickLocalized(s.provinceZh, s.provinceRu, locale)} / {pickLocalized(s.cityZh, s.cityRu, locale)}
              </td>
              {/* cooperationLevel 字段存的是英文枚举值(如 "STRATEGIC"),直接当翻译 key 用 */}
              <td className="border p-2">{tLevel(s.cooperationLevel)}</td>
              {/* 把 locale 传给日期格式化:zh → 2026/6/2,ru → 02.06.2026 */}
              <td className="border p-2">{s.createdAt.toLocaleDateString(locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}