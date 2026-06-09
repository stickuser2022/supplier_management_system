import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { pickLocalized } from '@/i18n/pick-localized';
import { ContactActionsCell } from './ContactActionsCell';

export async function ContactsList({ supplierId }: { supplierId: number }) {
  const t = await getTranslations('contacts');
  const locale = await getLocale();

  const contacts = await prisma.contact.findMany({
    where: { supplierId },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3 pb-1 border-b">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <Link
          href={`/suppliers/${supplierId}/contacts/new`}
          className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {t('newContact')}
        </Link>
      </div>

      {contacts.length === 0 ? (
        <p className="text-sm text-gray-500 italic">{t('empty')}</p>
      ) : (
        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="border p-2 text-left">{t('columns.name')}</th>
              <th className="border p-2 text-left">{t('columns.role')}</th>
              <th className="border p-2 text-left">{t('columns.contact')}</th>
              <th className="border p-2 text-left">{t('columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} className={c.status === 'ARCHIVED' ? 'opacity-50' : ''}>
                <td className="border p-2">
                  {c.isPrimary && <span className="mr-1">⭐</span>}
                  {pickLocalized(c.nameZh, c.nameRu, locale)}
                </td>
                <td className="border p-2">
                  {c.roleZh ? pickLocalized(c.roleZh, c.roleRu, locale) : '—'}
                </td>
                <td className="border p-2 text-xs">
                  {[
                    c.phone && `📱 ${c.phone}`,
                    c.wechat && `💬 ${c.wechat}`,
                    c.email && `✉️ ${c.email}`,
                    c.whatsapp && `📲 ${c.whatsapp}`,
                    c.telegram && `✈️ ${c.telegram}`,
                    c.qq && `🐧 ${c.qq}`,
                  ].filter(Boolean).join(' · ') || '—'}
                </td>
                <td className="border p-2">
                  <ContactActionsCell
                    contact={{
                      id: c.id,
                      supplierId: c.supplierId,
                      nameZh: c.nameZh,
                      status: c.status,
                      isPrimary: c.isPrimary,
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}