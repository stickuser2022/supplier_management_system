'use client';

import { useState } from 'react';
import { pickLocalized } from '@/i18n/pick-localized';

export function TagMultiSelect({
  availableTags,
  initialSelectedIds = [],
  locale,
}: {
  availableTags: { id: number; nameZh: string; nameRu: string }[];
  initialSelectedIds?: number[];
  locale: string;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(initialSelectedIds),
  );

  const toggle = (id: number) => {
    setSelectedIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {availableTags.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            没有可选品类标签。请在 Prisma Studio 的 tags 表添加 PRODUCT 类型 tag。
          </p>
        )}
        {availableTags.map((tag) => {
          const selected = selectedIds.has(tag.id);
          const label = pickLocalized(tag.nameZh, tag.nameRu, locale);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggle(tag.id)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                selected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:bg-muted'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      {Array.from(selectedIds).map((id) => (
        <input key={id} type="hidden" name="tagIds" value={id} />
      ))}
      <p className="text-xs text-muted-foreground">
        已选 {selectedIds.size} 个标签
      </p>
    </div>
  );
}