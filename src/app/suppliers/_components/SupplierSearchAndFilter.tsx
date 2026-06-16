'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search, X, Loader2, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { pickLocalized } from '@/i18n/pick-localized';
import { COOPERATION_LEVELS } from '../_validations/supplier-schema';

type TagOption = {
  id: number;
  category: 'PRODUCT' | 'EXPORT' | 'CERT' | 'CAPACITY' | 'CUSTOM';
  nameZh: string;
  nameRu: string;
  color: string | null;
};

/**
 * 供应商搜索 + 筛选条
 *
 * 状态全部映射到 URL query params(?q=&tags=&level=),好处:
 * - 浏览器后退能回到上一次筛选状态
 * - 可以收藏 / 分享 URL
 * - 服务端组件直接读 searchParams 决定查什么,无需 state hydrate
 *
 * 搜索框 300ms debounce 后 router.replace 更新 URL,
 * Tag / Level 立即更新(不 debounce)。
 */
export function SupplierSearchAndFilter({
  initialQ,
  initialTagIds,
  initialLevel,
  allTags,
  locale,
}: {
  initialQ: string;
  initialTagIds: number[];
  initialLevel: (typeof COOPERATION_LEVELS)[number] | null;
  allTags: TagOption[];
  locale: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const t = useTranslations('suppliers.search');
  const tLevel = useTranslations('cooperationLevel');
  const tCat = useTranslations('tagCategory');

  const [q, setQ] = useState(initialQ);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 同步初始值(用户后退 / URL 直接打开时)
  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

  function buildAndPush(next: { q?: string; tagIds?: number[]; level?: string | null }) {
    const sp = new URLSearchParams(searchParams.toString());
    const nq = next.q !== undefined ? next.q : q;
    const ntags = next.tagIds !== undefined ? next.tagIds : initialTagIds;
    const nlevel = next.level !== undefined ? next.level : initialLevel;
    if (nq) sp.set('q', nq); else sp.delete('q');
    if (ntags.length > 0) sp.set('tags', ntags.join(',')); else sp.delete('tags');
    if (nlevel) sp.set('level', nlevel); else sp.delete('level');
    startTransition(() => router.replace(`${pathname}?${sp.toString()}`));
  }

  function handleQChange(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // debounce 500ms:停手 0.5 秒才真的去搜,避免每按一下键都发请求
    debounceRef.current = setTimeout(() => buildAndPush({ q: value }), 500);
  }

  function handleQClear() {
    setQ('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    buildAndPush({ q: '' });
  }

  function handleAddTag(tagId: number) {
    if (initialTagIds.includes(tagId)) return;
    buildAndPush({ tagIds: [...initialTagIds, tagId] });
  }

  function handleRemoveTag(tagId: number) {
    buildAndPush({ tagIds: initialTagIds.filter((id) => id !== tagId) });
  }

  function handleLevelChange(value: string) {
    buildAndPush({ level: value || null });
  }

  function handleReset() {
    setQ('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    buildAndPush({ q: '', tagIds: [], level: null });
  }

  const hasAnyFilter = q || initialTagIds.length > 0 || initialLevel;
  const availableTags = allTags.filter((tag) => !initialTagIds.includes(tag.id));

  // 已选 tag 的完整对象(为了显示 name / color)
  const selectedTags = initialTagIds
    .map((id) => allTags.find((t) => t.id === id))
    .filter((t): t is TagOption => Boolean(t));

  // 按 category 分组(给下拉用)
  const groupedAvailable = availableTags.reduce<Record<string, TagOption[]>>(
    (acc, tag) => {
      (acc[tag.category] ??= []).push(tag);
      return acc;
    },
    {},
  );

  return (
    <div className="mb-6 space-y-3">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          value={q}
          onChange={(e) => handleQChange(e.target.value)}
          placeholder={t('placeholder')}
          className="pl-9 pr-9"
        />
        {q && (
          <button
            type="button"
            onClick={handleQClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            title={t('clearSearch')}
          >
            <X className="size-4" />
          </button>
        )}
        {isPending && (
          <Loader2 className="absolute right-9 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* 筛选条 */}
      <div className="flex items-center gap-2 flex-wrap text-sm">
        {/* 已选标签 chip */}
        {selectedTags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => handleRemoveTag(tag.id)}
            className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-md border border-border bg-card hover:bg-muted/40 transition-colors text-sm group"
            title={t('removeTag', { name: tag.nameZh })}
          >
            <span
              className="size-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: tag.color ?? '#9ca3af' }}
            />
            <span className="font-medium text-foreground">
              {pickLocalized(tag.nameZh, tag.nameRu, locale)}
            </span>
            <X className="size-3 text-muted-foreground group-hover:text-danger-fg" />
          </button>
        ))}

        {/* 加标签下拉 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <span className="text-xs">+ {t('addTag')}</span>
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-96 overflow-y-auto">
            {Object.entries(groupedAvailable).length === 0 && (
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {t('noTagsLeft')}
              </DropdownMenuLabel>
            )}
            {Object.entries(groupedAvailable).map(([cat, tags], idx) => (
              <div key={cat}>
                {idx > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  {tCat(cat)}
                </DropdownMenuLabel>
                {tags.map((tag) => (
                  <DropdownMenuItem
                    key={tag.id}
                    onClick={() => handleAddTag(tag.id)}
                    className="gap-2"
                  >
                    <span
                      className="size-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color ?? '#9ca3af' }}
                    />
                    <span>{pickLocalized(tag.nameZh, tag.nameRu, locale)}</span>
                  </DropdownMenuItem>
                ))}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="text-muted-foreground mx-1">·</span>

        {/* 合作深度 */}
        <span className="text-xs text-muted-foreground">{t('levelFilter')}:</span>
        <select
          value={initialLevel ?? ''}
          onChange={(e) => handleLevelChange(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">{t('allLevels')}</option>
          {COOPERATION_LEVELS.map((lv) => (
            <option key={lv} value={lv}>
              {tLevel(lv)}
            </option>
          ))}
        </select>

        {/* 清空 */}
        {hasAnyFilter && (
          <button
            type="button"
            onClick={handleReset}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground underline"
          >
            {t('reset')}
          </button>
        )}
      </div>
    </div>
  );
}
