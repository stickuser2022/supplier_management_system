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
          <p className="text-sm text-gray-500 italic">
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
              className={`px-3 py-1 rounded-full text-sm border transition ${
                selected
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      {/* 每个被选 id 一个 hidden input,提交时 formData.getAll('tagIds') 拿全部 */}
      {Array.from(selectedIds).map((id) => (
        <input key={id} type="hidden" name="tagIds" value={id} />
      ))}
      <p className="text-xs text-gray-500">
        已选 {selectedIds.size} 个标签
      </p>
    </div>
  );
}