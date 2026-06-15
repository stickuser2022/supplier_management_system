'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Pencil, Archive, ArchiveRestore } from 'lucide-react';
import { archiveNote, restoreNote } from '../_actions/note-actions';
import { cn } from '@/lib/utils';

const baseClasses =
  'inline-flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50 disabled:pointer-events-none';

export function NoteActionsCell({
  note,
  canEdit = true,
}: {
  note: { id: number; supplierId: number; contentZh: string; isActive: boolean };
  canEdit?: boolean;
}) {
  const t = useTranslations('notes.actions');
  const [isPending, startTransition] = useTransition();

  if (!canEdit) return null;

  const handleArchive = () => {
    const preview = note.contentZh.length > 20 ? note.contentZh.slice(0, 20) + '…' : note.contentZh;
    if (!confirm(t('confirmArchive', { preview }))) return;
    startTransition(async () => {
      await archiveNote(note.id);
    });
  };

  const handleRestore = () =>
    startTransition(async () => {
      await restoreNote(note.id);
    });

  if (note.isActive) {
    return (
      <div className="flex items-center justify-end gap-4">
        <Link
          href={`/suppliers/${note.supplierId}/notes/${note.id}/edit`}
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