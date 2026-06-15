'use client';

import { useActionState, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Sparkles, Loader2 } from 'lucide-react';
import {
  createTag,
  updateTag,
  translateTagName,
  type TagFormState,
} from '../_actions/tag-actions';
import { TAG_CATEGORIES } from '../_validations/tag-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

const INITIAL: TagFormState = { status: 'idle' };

// 7 个预设色 + 灰色兜底
const PRESET_COLORS = [
  '#b91c1c', // 红
  '#ea580c', // 橙
  '#ca8a04', // 黄
  '#16a34a', // 绿
  '#0284c7', // 蓝
  '#7c3aed', // 紫
  '#db2777', // 粉
  '#6b7280', // 灰
];

type TagInitialData = {
  id: number;
  category: (typeof TAG_CATEGORIES)[number];
  nameZh: string;
  nameRu: string;
  color: string | null;
  icon: string | null;
};

export function TagDialog({
  mode,
  initialData,
  trigger,
}: {
  mode: 'create' | 'edit';
  initialData?: TagInitialData;
  trigger?: React.ReactNode;
}) {
  const t = useTranslations('tags');
  const tCat = useTranslations('tagCategory');
  const [open, setOpen] = useState(false);

  const action =
    mode === 'edit' && initialData
      ? updateTag.bind(null, initialData.id)
      : createTag;
  const [state, formAction] = useActionState(action, INITIAL);

  // 表单本地状态(为了 AI 翻译能更新 nameRu)
  const [category, setCategory] = useState<(typeof TAG_CATEGORIES)[number]>(
    initialData?.category ?? 'PRODUCT',
  );
  const [nameZh, setNameZh] = useState(initialData?.nameZh ?? '');
  const [nameRu, setNameRu] = useState(initialData?.nameRu ?? '');
  const [color, setColor] = useState(initialData?.color ?? '#9ca3af');
  const [icon, setIcon] = useState(initialData?.icon ?? '');
  const [isTranslating, startTranslating] = useTransition();
  const [translateError, setTranslateError] = useState<string | null>(null);

  // 成功保存后关闭 dialog
  if (state.status === 'success' && open) {
    setOpen(false);
    // 重置表单(只 create 模式)
    if (mode === 'create') {
      setNameZh('');
      setNameRu('');
    }
  }

  const handleTranslate = () => {
    setTranslateError(null);
    if (!nameZh.trim()) {
      setTranslateError(t('errZhEmpty'));
      return;
    }
    startTranslating(async () => {
      const res = await translateTagName(nameZh);
      if (!res.ok) {
        setTranslateError(res.error);
        return;
      }
      setNameRu(res.translated);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            {mode === 'create' ? (
              <>
                <Plus className="size-4" />
                {t('newTag')}
              </>
            ) : (
              <>
                <Pencil className="size-3.5" />
                {t('edit')}
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('newTag') : t('editTagTitle')}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {state.status === 'error' && state.message && (
            <div className="p-2.5 rounded-md border border-danger-fg/20 bg-danger-bg text-danger-fg text-sm">
              {state.message}
            </div>
          )}

          {/* category */}
          <div className="space-y-1.5">
            <Label htmlFor="category">{t('labelCategory')}</Label>
            <select
              id="category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as (typeof TAG_CATEGORIES)[number])}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {TAG_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {tCat(cat)}
                </option>
              ))}
            </select>
          </div>

          {/* nameZh */}
          <div className="space-y-1.5">
            <Label htmlFor="nameZh">
              {t('labelNameZh')} <span className="text-danger-fg">*</span>
            </Label>
            <Input
              id="nameZh"
              name="nameZh"
              value={nameZh}
              onChange={(e) => setNameZh(e.target.value)}
              required
              autoFocus
            />
            {state.errors?.nameZh && (
              <p className="text-xs text-danger-fg">{state.errors.nameZh[0]}</p>
            )}
          </div>

          {/* nameRu + 翻译按钮 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="nameRu">
                {t('labelNameRu')} <span className="text-danger-fg">*</span>
              </Label>
              <button
                type="button"
                onClick={handleTranslate}
                disabled={isTranslating || !nameZh.trim()}
                className="inline-flex items-center gap-1 text-xs text-warning-fg hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTranslating ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Sparkles className="size-3" />
                )}
                {t('autoTranslate')}
              </button>
            </div>
            <Input
              id="nameRu"
              name="nameRu"
              value={nameRu}
              onChange={(e) => setNameRu(e.target.value)}
              required
            />
            {translateError && (
              <p className="text-xs text-warning-fg">{translateError}</p>
            )}
            {state.errors?.nameRu && (
              <p className="text-xs text-danger-fg">{state.errors.nameRu[0]}</p>
            )}
          </div>

          {/* color */}
          <div className="space-y-1.5">
            <Label htmlFor="color">{t('labelColor')}</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`size-7 rounded-full border-2 transition-all ${
                    color === c ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
              <Input
                id="color"
                name="color"
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#b91c1c"
                className="w-28 ml-2 font-mono text-xs"
              />
            </div>
            {state.errors?.color && (
              <p className="text-xs text-danger-fg">{state.errors.color[0]}</p>
            )}
          </div>

          {/* icon(可选) */}
          <div className="space-y-1.5">
            <Label htmlFor="icon">{t('labelIcon')}</Label>
            <Input
              id="icon"
              name="icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder={t('iconPlaceholder')}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('cancel')}
            </Button>
            <SubmitButton mode={mode} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubmitButton({ mode }: { mode: 'create' | 'edit' }) {
  const { pending } = useFormStatus();
  const t = useTranslations('tags');
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? t('submitting') : mode === 'create' ? t('save') : t('update')}
    </Button>
  );
}
