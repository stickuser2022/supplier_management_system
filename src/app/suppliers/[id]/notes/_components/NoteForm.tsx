'use client';

import { useActionState, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { Sparkles, Loader2 } from 'lucide-react';
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
  const tCommon = useTranslations('forms.common');
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? tCommon('submitting') : isEdit ? tCommon('update') : tCommon('submit')}
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
  const [isTranslating, startTranslating] = useTransition();
  const [translateError, setTranslateError] = useState<string | null>(null);
  const errors = state.errors;

  const t = useTranslations('forms.note');
  const tCommon = useTranslations('forms.common');

  // 已去除"已手改"机制:用户改俄文不再锁定,重翻会覆盖
  const handleContentRuChange = (value: string) => {
    setContentRu(value);
  };

  const handleTranslate = () => {
    setTranslateError(null);
    if (contentZh.trim().length === 0) {
      setTranslateError(t('errContentEmpty'));
      return;
    }
    startTranslating(async () => {
      const res = await translateNoteFields([{ field: 'content', text: contentZh }]);
      if (!res.ok) {
        setTranslateError(res.error);
        return;
      }
      setContentRu(res.results[0].translated);
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
            <><Loader2 className="size-4 animate-spin" />{tCommon('translating')}</>
          ) : (
            <><Sparkles className="size-4" />{t('autoTranslateButton')}</>
          )}
        </Button>
        <p className="text-xs text-muted-foreground leading-relaxed pt-1">
          {t('autoTranslateHint')}
        </p>
      </div>

      <FormSection title={t('sectionContent')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('labelContentZh')} htmlFor="content-zh" required error={errors?.contentZh?.[0]}>
            <Textarea
              id="content-zh"
              name="contentZh"
              value={contentZh}
              onChange={(e) => setContentZh(e.target.value)}
              rows={6}
              placeholder={t('contentZhPlaceholder')}
            />
          </FormField>
          <FormField label={t('labelContentRu')} htmlFor="content-ru">
            <Textarea
              id="content-ru"
              name="contentRu"
              value={contentRu}
              onChange={(e) => handleContentRuChange(e.target.value)}
              rows={6}
            />
            <input type="hidden" name="contentRuAutoTranslated" value="true" />
          </FormField>
        </div>
      </FormSection>

      <FormSection title={t('sectionTimeRelation')}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            label={
              <>
                {t('labelHappenedAt')}
                <span className="ml-1 text-xs text-muted-foreground font-normal">
                  {t('happenedAtSuffix')}
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
          <FormField label={t('labelContactRel')} htmlFor="contactId">
            <select
              id="contactId"
              name="contactId"
              defaultValue={initialData?.contactId?.toString() ?? ''}
              className={SELECT_CLASS}
            >
              <option value="">{t('selectNone')}</option>
              {availableContacts.map((c) => (
                <option key={c.id} value={c.id}>{c.nameZh}</option>
              ))}
            </select>
          </FormField>
          <FormField label={t('labelQuoteRel')} htmlFor="quoteId">
            <select
              id="quoteId"
              name="quoteId"
              defaultValue={initialData?.quoteId?.toString() ?? ''}
              className={SELECT_CLASS}
            >
              <option value="">{t('selectNone')}</option>
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
