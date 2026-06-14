'use client';

import { useActionState, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { Lock, Sparkles, Loader2 } from 'lucide-react';
import {
  createNote,
  updateNote,
  translateNoteFields,
  type NoteFormState,
} from '../_actions/note-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActions } from '@/components/forms/form-actions';

export type NoteFormInitialData = {
  id: number;
  contactId: number | null;
  quoteId: number | null;
  contentZh: string;
  contentRu: string | null;
  contentRuAutoTranslated: boolean;
  happenedAt: string;
};

const INITIAL_FORM_STATE: NoteFormState = { status: 'idle' };

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? '保存中…' : isEdit ? '更新' : '保存'}
    </Button>
  );
}

export function NoteForm({
  supplierId,
  initialData,
  availableContacts,
  availableQuotes,
}: {
  supplierId: number;
  initialData?: NoteFormInitialData;
  availableContacts: { id: number; nameZh: string }[];
  availableQuotes: { id: number; productNameZh: string; quotedAt: Date }[];
}) {
  const isEdit = Boolean(initialData);
  const action = isEdit
    ? updateNote.bind(null, initialData!.id)
    : createNote.bind(null, supplierId);
  const [state, formAction] = useActionState(action, INITIAL_FORM_STATE);

  const [contentZh, setContentZh] = useState(initialData?.contentZh ?? '');
  const [contentRu, setContentRu] = useState(initialData?.contentRu ?? '');
  const [autoTranslated, setAutoTranslated] = useState(
    initialData?.contentRuAutoTranslated ?? true,
  );
  const [isTranslating, startTranslating] = useTransition();
  const [translateError, setTranslateError] = useState<string | null>(null);
  const errors = state.errors;

  const handleContentRuChange = (value: string) => {
    setContentRu(value);
    setAutoTranslated(false);
  };

  const handleTranslate = () => {
    setTranslateError(null);
    if (contentZh.trim().length === 0) {
      setTranslateError('中文内容为空');
      return;
    }
    if (!autoTranslated) {
      setTranslateError('俄文已手改(锁定),不会覆盖');
      return;
    }
    startTranslating(async () => {
      const res = await translateNoteFields([{ field: 'content', text: contentZh }]);
      if (!res.ok) {
        setTranslateError(res.error);
        return;
      }
      setContentRu(res.results[0].translated);
      setAutoTranslated(true);
    });
  };

  return (
    <form action={formAction} className="space-y-6">
      {state.status === 'error' && state.message && (
        <div className="p-3 rounded-md border border-danger-fg/20 bg-danger-bg text-danger-fg text-sm">
          {state.message}
        </div>
      )}
      {translateError && (
        <div className="p-3 rounded-md border border-warning-fg/20 bg-warning-bg text-warning-fg text-sm">
          {translateError}
        </div>
      )}

      <div className="flex items-start gap-4 p-4 rounded-md border border-border bg-muted/40">
        <Button
          type="button"
          onClick={handleTranslate}
          disabled={isTranslating}
          variant="secondary"
          size="sm"
          className="flex-shrink-0"
        >
          {isTranslating ? (
            <><Loader2 className="size-4 animate-spin" />翻译中…</>
          ) : (
            <><Sparkles className="size-4" />自动翻译俄文</>
          )}
        </Button>
        <p className="text-xs text-muted-foreground leading-relaxed pt-1">
          填好中文后点这个按钮自动翻译。手改俄文后该字段会上锁(再次翻译不覆盖)。
        </p>
      </div>

      <FormSection title="记录内容">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="中文内容" htmlFor="content-zh" required error={errors?.contentZh?.[0]}>
            <Textarea
              id="content-zh"
              name="contentZh"
              value={contentZh}
              onChange={(e) => setContentZh(e.target.value)}
              rows={6}
              placeholder="如:5/10 微信沟通,客户问起 30cm 玩具熊报价,对方表示要先样品..."
            />
          </FormField>
          <FormField
            label={
              <>
                <span>俄文内容</span>
                {!autoTranslated && (
                  <span className="inline-flex items-center gap-1 text-xs text-warning-fg ml-1">
                    <Lock className="size-3" />
                    已手改
                  </span>
                )}
              </>
            }
            htmlFor="content-ru"
          >
            <Textarea
              id="content-ru"
              name="contentRu"
              value={contentRu}
              onChange={(e) => handleContentRuChange(e.target.value)}
              rows={6}
            />
            <input type="hidden" name="contentRuAutoTranslated" value={autoTranslated ? 'true' : 'false'} />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="时间与关联">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            label={
              <>
                事件日期
                <span className="ml-1 text-xs text-muted-foreground font-normal">
                  (可填过去补录)
                </span>
              </>
            }
            htmlFor="happenedAt"
            required
            error={errors?.happenedAt?.[0]}
          >
            <Input
              id="happenedAt"
              type="date"
              name="happenedAt"
              defaultValue={initialData?.happenedAt ?? new Date().toISOString().slice(0, 10)}
            />
          </FormField>
          <FormField label="关联联系人" htmlFor="contactId">
            <select
              id="contactId"
              name="contactId"
              defaultValue={initialData?.contactId?.toString() ?? ''}
              className={SELECT_CLASS}
            >
              <option value="">— 不指定 —</option>
              {availableContacts.map((c) => (
                <option key={c.id} value={c.id}>{c.nameZh}</option>
              ))}
            </select>
          </FormField>
          <FormField label="关联报价" htmlFor="quoteId">
            <select
              id="quoteId"
              name="quoteId"
              defaultValue={initialData?.quoteId?.toString() ?? ''}
              className={SELECT_CLASS}
            >
              <option value="">— 不指定 —</option>
              {availableQuotes.map((q) => (
                <option key={q.id} value={q.id}>
                  #{q.id} {q.productNameZh} ({q.quotedAt.toISOString().slice(0, 10)})
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </FormSection>

      <FormActions>
        <SubmitButton isEdit={isEdit} />
      </FormActions>
    </form>
  );
}