'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Pencil, Archive, ArchiveRestore, Star } from 'lucide-react';
import { archiveContact, restoreContact, setPrimaryContact } from '../_actions/contact-actions';
import { cn } from '@/lib/utils';

const baseClasses =
  'inline-flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50 disabled:pointer-events-none';

export function ContactActionsCell({
  contact,
}: {
  contact: {
    id: number;
    supplierId: number;
    nameZh: string;
    status: 'ACTIVE' | 'ARCHIVED';
    isPrimary: boolean;
  };
}) {
  const t = useTranslations('contacts.actions');
  const [isPending, startTransition] = useTransition();

  const handleArchive = () => {
    if (!confirm(t('confirmArchive', { name: contact.nameZh }))) return;
    startTransition(async () => {
      await archiveContact(contact.id);
    });
  };

  const handleRestore = () =>
    startTransition(async () => {
      await restoreContact(contact.id);
    });

  const handleSetPrimary = () =>
    startTransition(async () => {
      await setPrimaryContact(contact.id);
    });

  if (contact.status === 'ACTIVE') {
    return (
      <div className="flex items-center justify-end gap-4">
        {!contact.isPrimary && (
          <button
            type="button"
            onClick={handleSetPrimary}
            disabled={isPending}
            className={cn(baseClasses, 'text-muted-foreground hover:text-warning-fg')}
          >
            <Star className="size-3.5" />
            {t('setPrimary')}
          </button>
        )}
        <Link
          href={`/suppliers/${contact.supplierId}/contacts/${contact.id}/edit`}
          className={cn(baseClasses, 'text-muted-foreground hover:text-foreground')}
        >
          <Pencil className="size-3.5" />
          {t('edit')}
        </Link>
        <button
          type="button"
          onClick={handleArchive}
          disabled={isPending}
          className={cn(baseClasses, 'text-muted-foreground hover:text-danger-fg')}
        >
          <Archive className="size-3.5" />
          {t('archive')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end">
      <button
        type="button"
        onClick={handleRestore}
        disabled={isPending}
        className={cn(baseClasses, 'text-muted-foreground hover:text-success-fg')}
      >
        <ArchiveRestore className="size-3.5" />
        {t('restore')}
      </button>
    </div>
  );
}