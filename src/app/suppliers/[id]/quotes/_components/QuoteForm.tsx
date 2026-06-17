'use client';

import { useActionState, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { Sparkles, Loader2 } from 'lucide-react';
import {
  createQuote,
  updateQuote,
  translateQuoteFields,
  type QuoteFormState,
  type QuoteTranslateField,
} from '../_actions/quote-actions';
import { CURRENCIES } from '../_validations/quote-schema';
import { TagMultiSelect } from './TagMultiSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActions } from '@/components/forms/form-actions';

export type QuoteFormInitialData = {
  id: number;
  contactId: number | null;
  productNameZh: string;
  productNameRu: string | null;
  productNameRuAutoTranslated: boolean;
  productSpecZh: string | null;
  productSpecRu: string | null;
  productSpecRuAutoTranslated: boolean;
  unitPrice: string;
  currency: typeof CURRENCIES[number];
  unitZh: string | null;
  unitRu: string | null;
  moq: number | null;
  quotedAt: string;
  validUntil: string | null;
  leadTimeDays: number | null;
  paymentTerms: string | null;
  source: string | null;
  tagIds: number[];
};

type BilingualState = {
  productNameZh: string; productNameRu: string; productNameRuAutoTranslated: boolean;
  productSpecZh: string; productSpecRu: string; productSpecRuAutoTranslated: boolean;
};

const EMPTY_BI: BilingualState = {
  productNameZh: '', productNameRu: '', productNameRuAutoTranslated: true,
  productSpecZh: '', productSpecRu: '', productSpecRuAutoTranslated: true,
};

function buildBiFromInitial(d?: QuoteFormInitialData): BilingualState {
  if (!d) return EMPTY_BI;
  return {
    productNameZh: d.productNameZh,
    productNameRu: d.productNameRu ?? '',
    productNameRuAutoTranslated: d.productNameRuAutoTranslated,
    productSpecZh: d.productSpecZh ?? '',
    productSpecRu: d.productSpecRu ?? '',
    productSpecRuAutoTranslated: d.productSpecRuAutoTranslated,
  };
}

const INITIAL_FORM_STATE: QuoteFormState = { status: 'idle' };

type FieldPair = {
  key: QuoteTranslateField;
  zhFieldName: keyof BilingualState;
  ruFieldName: keyof BilingualState;
  flagFieldName: keyof BilingualState;
  zhLabel: string;
  ruLabel: string;
  required?: boolean;
};

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

export function QuoteForm({
  supplierId,
  initialData,
  availableContacts,
  availableTags,
  locale,
}: {
  supplierId: number;
  initialData?: QuoteFormInitialData;
  availableContacts: { id: number; nameZh: string }[];
  availableTags: { id: number; nameZh: string; nameRu: string }[];
  locale: string;
}) {
  const isEdit = Boolean(initialData);
  const action = isEdit
    ? updateQuote.bind(null, initialData!.id)
    : createQuote.bind(null, supplierId);
  const [state, formAction] = useActionState(action, INITIAL_FORM_STATE);
  const [bi, setBi] = useState<BilingualState>(() => buildBiFromInitial(initialData));
  const [isTranslating, startTranslating] = useTransition();
  const [translateError, setTranslateError] = useState<string | null>(null);
  const errors = state.errors;

  const t = useTranslations('forms.quote');
  const tCommon = useTranslations('forms.common');

  // FIELD_PAIRS 移到组件内,label 走 t()
  const FIELD_PAIRS: FieldPair[] = [
    { key: 'productName', zhFieldName: 'productNameZh', ruFieldName: 'productNameRu', flagFieldName: 'productNameRuAutoTranslated', zhLabel: t('labelProductNameZh'), ruLabel: t('labelProductNameRu'), required: true },
    { key: 'productSpec', zhFieldName: 'productSpecZh', ruFieldName: 'productSpecRu', flagFieldName: 'productSpecRuAutoTranslated', zhLabel: t('labelProductSpecZh'), ruLabel: t('labelProductSpecRu') },
  ];

  const handleZhChange = (key: keyof BilingualState, value: string) =>
    setBi((s) => ({ ...s, [key]: value }));
  // 已去除"已手改"机制:用户改俄文不再翻 flag,重翻会覆盖
  const handleRuChange = (ruKey: keyof BilingualState, _flagKey: keyof BilingualState, value: string) =>
    setBi((s) => ({ ...s, [ruKey]: value }));

  const runTranslate = (direction: 'zh-to-ru' | 'ru-to-zh') => {
    setTranslateError(null);
    const srcField = direction === 'zh-to-ru' ? 'zhFieldName' : 'ruFieldName';
    const dstField = direction === 'zh-to-ru' ? 'ruFieldName' : 'zhFieldName';
    const requests = FIELD_PAIRS
      .filter((p) => (bi[p[srcField]] as string).trim().length > 0)
      .map((p) => ({ field: p.key, text: bi[p[srcField]] as string }));

    if (requests.length === 0) {
      setTranslateError(direction === 'zh-to-ru' ? tCommon('noZhContent') : tCommon('noRuContent'));
      return;
    }
    startTranslating(async () => {
      const res = await translateQuoteFields(requests, direction);
      if (!res.ok) {
        setTranslateError(res.error);
        return;
      }
      setBi((s) => {
        const next = { ...s };
        for (const r of res.results) {
          const pair = FIELD_PAIRS.find((p) => p.key === r.field);
          if (!pair) continue;
          (next as Record<string, string | boolean>)[pair[dstField]] = r.translated;
          (next as Record<string, string | boolean>)[pair.flagFieldName] = true;
        }
        return next;
      });
    });
  };
  const hasZhContent = FIELD_PAIRS.some((p) => (bi[p.zhFieldName] as string).trim().length > 0);
  const hasRuContent = FIELD_PAIRS.some((p) => (bi[p.ruFieldName] as string).trim().length > 0);

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

      <div className="flex items-start gap-3 p-4 rounded-md border border-border bg-muted/40">
        <div className="flex flex-col gap-2 flex-shrink-0">
          <Button
            type="button"
            onClick={() => runTranslate('zh-to-ru')}
            disabled={isTranslating || !hasZhContent}
            variant="secondary"
            size="sm"
          >
            {isTranslating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {tCommon('translateZhToRu')}
          </Button>
          <Button
            type="button"
            onClick={() => runTranslate('ru-to-zh')}
            disabled={isTranslating || !hasRuContent}
            variant="secondary"
            size="sm"
          >
            {isTranslating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {tCommon('translateRuToZh')}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed pt-1">
          {t('autoTranslateHint')}
        </p>
      </div>

      <FormSection title={t('sectionProduct')}>
        {FIELD_PAIRS.map((pair) => {
          const zhValue = bi[pair.zhFieldName] as string;
          const ruValue = bi[pair.ruFieldName] as string;
          const flagValue = bi[pair.flagFieldName] as boolean;
          const zhFieldId = `${pair.key}-zh`;
          const ruFieldId = `${pair.key}-ru`;

          return (
            <div key={pair.key} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label={pair.zhLabel}
                htmlFor={zhFieldId}
                required={pair.required}
                error={errors?.[pair.zhFieldName]?.[0]}
              >
                <Input
                  id={zhFieldId}
                  type="text"
                  name={pair.zhFieldName}
                  value={zhValue}
                  onChange={(e) => handleZhChange(pair.zhFieldName, e.target.value)}
                />
              </FormField>
              <FormField label={pair.ruLabel} htmlFor={ruFieldId}>
                <Input
                  id={ruFieldId}
                  type="text"
                  name={pair.ruFieldName}
                  value={ruValue}
                  onChange={(e) => handleRuChange(pair.ruFieldName, pair.flagFieldName, e.target.value)}
                />
                <input type="hidden" name={pair.flagFieldName} value={flagValue ? 'true' : 'false'} />
              </FormField>
            </div>
          );
        })}
      </FormSection>

      <FormSection title={t('sectionPriceQty')}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <FormField label={t('labelUnitPrice')} htmlFor="unitPrice" required error={errors?.unitPrice?.[0]}>
            <Input
              id="unitPrice"
              type="number"
              step="0.01"
              name="unitPrice"
              defaultValue={initialData?.unitPrice ?? ''}
            />
          </FormField>
          <FormField label={t('labelCurrency')} htmlFor="currency">
            <select
              id="currency"
              name="currency"
              defaultValue={initialData?.currency ?? 'CNY'}
              className={SELECT_CLASS}
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label={t('labelUnitZh')} htmlFor="unitZh">
            <Input
              id="unitZh"
              type="text"
              name="unitZh"
              defaultValue={initialData?.unitZh ?? ''}
              placeholder={t('unitZhPlaceholder')}
              list="unit-zh-suggestions"
            />
            <datalist id="unit-zh-suggestions">
              <option value="件" /><option value="个" /><option value="箱" /><option value="打" /><option value="米" /><option value="千克" />
            </datalist>
          </FormField>
          <FormField label={t('labelUnitRu')} htmlFor="unitRu">
            <Input
              id="unitRu"
              type="text"
              name="unitRu"
              defaultValue={initialData?.unitRu ?? ''}
              placeholder={t('unitRuPlaceholder')}
              list="unit-ru-suggestions"
            />
            <datalist id="unit-ru-suggestions">
              <option value="шт" /><option value="коробка" /><option value="дюжина" /><option value="м" /><option value="кг" />
            </datalist>
          </FormField>
        </div>
        <FormField label={t('labelMoq')} htmlFor="moq" error={errors?.moq?.[0]}>
          <Input id="moq" type="number" name="moq" defaultValue={initialData?.moq ?? ''} placeholder={t('moqPlaceholder')} />
        </FormField>
      </FormSection>

      <FormSection title={t('sectionTime')}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label={t('labelQuotedAt')} htmlFor="quotedAt" required error={errors?.quotedAt?.[0]}>
            <Input
              id="quotedAt"
              type="date"
              name="quotedAt"
              defaultValue={initialData?.quotedAt ?? new Date().toISOString().slice(0, 10)}
            />
          </FormField>
          <FormField label={t('labelValidUntil')} htmlFor="validUntil">
            <Input
              id="validUntil"
              type="date"
              name="validUntil"
              defaultValue={initialData?.validUntil ?? ''}
            />
          </FormField>
          <FormField label={t('labelLeadTimeDays')} htmlFor="leadTimeDays" error={errors?.leadTimeDays?.[0]}>
            <Input
              id="leadTimeDays"
              type="number"
              name="leadTimeDays"
              defaultValue={initialData?.leadTimeDays ?? ''}
              placeholder={t('leadTimePlaceholder')}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title={t('sectionOther')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <FormField label={t('labelSource')} htmlFor="source">
            <Input
              id="source"
              type="text"
              name="source"
              defaultValue={initialData?.source ?? ''}
              placeholder={t('sourcePlaceholder')}
            />
          </FormField>
        </div>
        <FormField
          label={
            <>
              {t('labelPaymentTerms')}
              <span className="ml-1 text-xs text-muted-foreground font-normal">
                {t('paymentTermsSuffix')}
              </span>
            </>
          }
          htmlFor="paymentTerms"
        >
          <Input
            id="paymentTerms"
            type="text"
            name="paymentTerms"
            defaultValue={initialData?.paymentTerms ?? ''}
            placeholder={t('paymentTermsPlaceholder')}
          />
        </FormField>
      </FormSection>

      <FormSection title={t('sectionTags')}>
        <TagMultiSelect
          availableTags={availableTags}
          initialSelectedIds={initialData?.tagIds ?? []}
          locale={locale}
        />
      </FormSection>

      <FormActions>
        <SubmitButton isEdit={isEdit} />
      </FormActions>
    </form>
  );
}