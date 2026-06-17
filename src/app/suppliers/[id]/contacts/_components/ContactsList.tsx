import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { Star, Phone, Mail } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireCurrentUser, isOwner } from '@/lib/auth';
import { pickLocalized } from '@/i18n/pick-localized';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DetailSection } from '../../_components/detail-section';
import { ContactActionsCell } from './ContactActionsCell';

export async function ContactsList({ supplierId }: { supplierId: number }) {
  const t = await getTranslations('contacts');
  const locale = await getLocale();

  const [contacts, currentUser] = await Promise.all([
    prisma.contact.findMany({
      where: { supplierId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    }),
    requireCurrentUser(),
  ]);

  return (
    <DetailSection
      title={t('title')}
      action={
        <Button asChild size="sm">
          <Link href={`/suppliers/${supplierId}/contacts/new`}>
            {t('newContact')}
          </Link>
        </Button>
      }
    >
      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">{t('empty')}</p>
      ) : (
        <div className="border border-border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t('columns.name')}</TableHead>
                <TableHead>{t('columns.role')}</TableHead>
                <TableHead>{t('columns.contact')}</TableHead>
                <TableHead className="text-right">{t('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <TableRow key={c.id} className={c.status === 'ARCHIVED' ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">
                    <div className="inline-flex items-center gap-1.5">
                      {c.isPrimary && (
                        <Star className="size-3.5 fill-warning-fg text-warning-fg" />
                      )}
                      {pickLocalized(c.nameZh, c.nameRu, locale)}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.roleZh ? pickLocalized(c.roleZh, c.roleRu, locale) : '—'}
                  </TableCell>
                  <TableCell>
                    <ContactMethodList contact={c} />
                  </TableCell>
                  <TableCell className="text-right">
                    <ContactActionsCell
                      contact={{
                        id: c.id,
                        supplierId: c.supplierId,
                        nameZh: c.nameZh,
                        nameRu: c.nameRu,
                        status: c.status,
                        isPrimary: c.isPrimary,
                      }}
                      canEdit={isOwner(c, currentUser)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </DetailSection>
  );
}

function ContactMethodList({
  contact,
}: {
  contact: {
    phone: string | null;
    wechat: string | null;
    email: string | null;
    whatsapp: string | null;
    telegram: string | null;
    qq: string | null;
  };
}) {
  const items = [
    contact.phone && (
      <span className="inline-flex items-center gap-1">
        <Phone className="size-3" />
        {contact.phone}
      </span>
    ),
    contact.email && (
      <span className="inline-flex items-center gap-1">
        <Mail className="size-3" />
        {contact.email}
      </span>
    ),
    contact.wechat && <span>WeChat: {contact.wechat}</span>,
    contact.whatsapp && <span>WhatsApp: {contact.whatsapp}</span>,
    contact.telegram && <span>Telegram: {contact.telegram}</span>,
    contact.qq && <span>QQ: {contact.qq}</span>,
  ].filter(Boolean);

  if (items.length === 0) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {items.map((item, i) => <span key={i}>{item}</span>)}
    </div>
  );
}