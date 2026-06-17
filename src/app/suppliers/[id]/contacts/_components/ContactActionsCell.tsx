'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Pencil, Archive, ArchiveRestore, Star } from 'lucide-react';
import { archiveContact, restoreContact, setPrimaryContact } from '../_actions/contact-actions';
import { cn } from '@/lib/utils';

const baseClasses =
  'inline-flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50 disabled:pointer-events-none';

export function ContactActionsCell({
  contact,
  canEdit = true,
}: {
  contact: {
    id: number;
    supplierId: number;
    nameZh: string;
    nameRu: string | null;
    status: 'ACTIVE' | 'ARCHIVED';
    isPrimary: boolean;
  };
  canEdit?: boolean;
}) {
  const t = useTranslations('contacts.actions');
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  // 非创建者(且非 ADMIN)不显示任何操作按钮 —— 数据只读
  if (!canEdit) return null;

  const displayName = locale === 'ru' && contact.nameRu ? contact.nameRu : contact.nameZh;

  const handleArchive = () => {
    if (!confirm(t('confirmArchive', { name: displayName }))) return;
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