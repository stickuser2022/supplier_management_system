'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Pencil, Archive, ArchiveRestore } from 'lucide-react';
import { archiveTag, restoreTag } from '../_actions/tag-actions';
import { TagDialog } from './TagDialog';
import { TAG_CATEGORIES } from '../_validations/tag-schema';

export function TagRowActions({
  tag,
}: {
  tag: {
    id: number;
    category: (typeof TAG_CATEGORIES)[number];
    nameZh: string;
    nameRu: string;
    color: string | null;
    icon: string | null;
    isActive: boolean;
  };
}) {
  const t = useTranslations('tags');
  const [isPending, startTransition] = useTransition();

  const handleArchive = () => {
    if (!confirm(t('confirmArchive', { name: tag.nameZh }))) return;
    startTransition(async () => {
      try {
        await archiveTag(tag.id);
      } catch (e) {
        alert(e instanceof Error ? e.message : '操作失败');
      }
    });
  };

  const handleRestore = () => {
    startTransition(async () => {
      try {
        await restoreTag(tag.id);
      } catch (e) {
        alert(e instanceof Error ? e.message : '操作失败');
      }
    });
  };

  if (!tag.isActive) {
    // 归档视图下显示"恢复"
    return (
      <button
        type="button"
        onClick={handleRestore}
        disabled={isPending}
        className="ml-1 p-1 rounded hover:bg-muted text-muted-foreground hover:text-success-fg transition-colors disabled:opacity-50"
        title={t('restore')}
      >
        <ArchiveRestore className="size-3.5" />
      </button>
    );
  }

  return (
    <div className="ml-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <TagDialog
        mode="edit"
        initialData={{
          id: tag.id,
          category: tag.category,
          nameZh: tag.nameZh,
          nameRu: tag.nameRu,
          color: tag.color,
          icon: tag.icon,
        }}
        trigger={
          <button
            type="button"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title={t('edit')}
          >
            <Pencil className="size-3.5" />
          </button>
        }
      />
      <button
        type="button"
        onClick={handleArchive}
        disabled={isPending}
        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-danger-fg transition-colors disabled:opacity-50"
        title={t('archive')}
      >
        <Archive className="size-3.5" />
      </button>
    </div>
  );
}
