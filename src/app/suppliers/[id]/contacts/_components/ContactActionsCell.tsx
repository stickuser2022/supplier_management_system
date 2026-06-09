'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { archiveContact, restoreContact, setPrimaryContact } from '../_actions/contact-actions';

export function ContactActionsCell({
  contact,
}: {
  contact: { id: number; supplierId: number; nameZh: string; status: 'ACTIVE' | 'ARCHIVED'; isPrimary: boolean };
}) {
  const t = useTranslations('contacts.actions');
  const [isPending, startTransition] = useTransition();

  const handleArchive = () => {
    if (!confirm(t('confirmArchive', { name: contact.nameZh }))) return;
    startTransition(async () => { await archiveContact(contact.id); });
  };
  const handleRestore = () => startTransition(async () => { await restoreContact(contact.id); });
  const handleSetPrimary = () => startTransition(async () => { await setPrimaryContact(contact.id); });

  if (contact.status === 'ACTIVE') {
    return (
      <div className="flex gap-3 text-sm">
        {!contact.isPrimary && (
          <button
            type="button"
            onClick={handleSetPrimary}
            disabled={isPending}
            className="text-purple-600 hover:underline disabled:opacity-50"
          >
            ⭐ {t('setPrimary')}
          </button>
        )}
        <Link
          href={`/suppliers/${contact.supplierId}/contacts/${contact.id}/edit`}
          className="text-blue-600 hover:underline"
        >
          ✏️ {t('edit')}
        </Link>
        <button
          type="button"
          onClick={handleArchive}
          disabled={isPending}
          className="text-amber-600 hover:underline disabled:opacity-50"
        >
          🗄️ {t('archive')}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleRestore}
      disabled={isPending}
      className="text-sm text-emerald-600 hover:underline disabled:opacity-50"
    >
      ↩️ {t('restore')}
    </button>
  );
}