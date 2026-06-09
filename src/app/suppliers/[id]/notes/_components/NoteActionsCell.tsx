'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { archiveNote, restoreNote } from '../_actions/note-actions';

export function NoteActionsCell({
  note,
}: {
  note: { id: number; supplierId: number; contentZh: string; isActive: boolean };
}) {
  const t = useTranslations('notes.actions');
  const [isPending, startTransition] = useTransition();

  const handleArchive = () => {
    const preview = note.contentZh.length > 20 ? note.contentZh.slice(0, 20) + '…' : note.contentZh;
    if (!confirm(t('confirmArchive', { preview }))) return;
    startTransition(async () => { await archiveNote(note.id); });
  };
  const handleRestore = () => startTransition(async () => { await restoreNote(note.id); });

  if (note.isActive) {
    return (
      <div className="flex gap-3 text-sm">
        <Link href={`/suppliers/${note.supplierId}/notes/${note.id}/edit`} className="text-blue-600 hover:underline">
          ✏️ {t('edit')}
        </Link>
        <button type="button" onClick={handleArchive} disabled={isPending}
          className="text-amber-600 hover:underline disabled:opacity-50">
          🗄️ {t('archive')}
        </button>
      </div>
    );
  }

  return (
    <button type="button" onClick={handleRestore} disabled={isPending}
      className="text-sm text-emerald-600 hover:underline disabled:opacity-50">
      ↩️ {t('restore')}
    </button>
  );
}