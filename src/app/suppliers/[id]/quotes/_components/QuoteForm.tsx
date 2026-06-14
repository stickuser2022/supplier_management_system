'use client';

import { useActionState, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { Lock, Sparkles, Loader2 } from 'lucide-react';
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

const FIELD_PAIRS: FieldPair[] = [
  { key: 'productName', zhFieldName: 'productNameZh', ruFieldName: 'productNameRu', flagFieldName: 'productNameRuAutoTranslated', zhLabel: '产品名(中文)', ruLabel: '产品名(俄文)', required: true },
  { key: 'productSpec', zhFieldName: 'productSpecZh', ruFieldName: 'productSpecRu', flagFieldName: 'productSpecRuAutoTranslated', zhLabel: '规格(中文)', ruLabel: '规格(俄文)' },
];

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

  const handleZhChange = (key: keyof BilingualState, value: string) =>
    setBi((s) => ({ ...s, [key]: value }));
  const handleRuChange = (ruKey: keyof BilingualState, flagKey: keyof BilingualState, value: string) =>
    setBi((s) => ({ ...s, [ruKey]: value, [flagKey]: false }));

  const handleTranslate = () => {
    setTranslateError(null);
    const requests = FIELD_PAIRS
      .filter((p) => {
        const zh = (bi[p.zhFieldName] as string).trim();
        const locked = !(bi[p.flagFieldName] as boolean);
        return zh.length > 0 && !locked;
      })
      .map((p) => ({ field: p.key, text: bi[p.zhFieldName] as string }));

    if (requests.length === 0) {
      setTranslateError('没有可翻译的字段(中文为空 / 已锁定)');
      return;
    }
    startTranslating(async () => {
      const res = await translateQuoteFields(requests);
      if (!res.ok) {
        setTranslateError(res.error);
        return;
      }
      setBi((s) => {
        const next = { ...s };
        for (const r of res.results) {
          const pair = FIELD_PAIRS.find((p) => p.key === r.field);
          if (!pair) continue;
          (next as Record<string, string | boolean>)[pair.ruFieldName] = r.translated;
          (next as Record<string, string | boolean>)[pair.flagFieldName] = true;
        }
        return next;
      });
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
          翻译产品名和规格 2 个字段。手改后该字段会上锁(再次翻译不覆盖)。
        </p>
      </div>

      <FormSection title="产品信息">
        {FIELD_PAIRS.map((pair) => {
          const zhValue = bi[pair.zhFieldName] as string;
          const ruValue = bi[pair.ruFieldName] as string;
          const flagValue = bi[pair.flagFieldName] as boolean;
          const isLocked = !flagValue;
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
              <FormField
                label={
                  <>
                    <span>{pair.ruLabel}</span>
                    {isLocked && (
                      <span className="inline-flex items-center gap-1 text-xs text-warning-fg ml-1">
                        <Lock className="size-3" />
                        已手改
                      </span>
                    )}
                  </>
                }
                htmlFor={ruFieldId}
              >
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

      <FormSection title="价格与数量">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <FormField label="单价" htmlFor="unitPrice" required error={errors?.unitPrice?.[0]}>
            <Input
              id="unitPrice"
              type="number"
              step="0.01"
              name="unitPrice"
              defaultValue={initialData?.unitPrice ?? ''}
            />
          </FormField>
          <FormField label="货币" htmlFor="currency">
            <select
              id="currency"
              name="currency"
              defaultValue={initialData?.currency ?? 'CNY'}
              className={SELECT_CLASS}
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="单位(中)" htmlFor="unitZh">
            <Input
              id="unitZh"
              type="text"
              name="unitZh"
              defaultValue={initialData?.unitZh ?? ''}
              placeholder="如 件 / 个 / 箱"
              list="unit-zh-suggestions"
            />
            <datalist id="unit-zh-suggestions">
              <option value="件" /><option value="个" /><option value="箱" /><option value="打" /><option value="米" /><option value="千克" />
            </datalist>
          </FormField>
          <FormField label="单位(俄)" htmlFor="unitRu">
            <Input
              id="unitRu"
              type="text"
              name="unitRu"
              defaultValue={initialData?.unitRu ?? ''}
              placeholder="шт / коробка"
              list="unit-ru-suggestions"
            />
            <datalist id="unit-ru-suggestions">
              <option value="шт" /><option value="коробка" /><option value="дюжина" /><option value="м" /><option value="кг" />
            </datalist>
          </FormField>
        </div>
        <FormField label="起订量(MOQ)" htmlFor="moq" error={errors?.moq?.[0]}>
          <Input id="moq" type="number" name="moq" defaultValue={initialData?.moq ?? ''} placeholder="选填,如 100" />
        </FormField>
      </FormSection>

      <FormSection title="时间">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="报价日期" htmlFor="quotedAt" required error={errors?.quotedAt?.[0]}>
            <Input
              id="quotedAt"
              type="date"
              name="quotedAt"
              defaultValue={initialData?.quotedAt ?? new Date().toISOString().slice(0, 10)}
            />
          </FormField>
          <FormField label="有效期至" htmlFor="validUntil">
            <Input
              id="validUntil"
              type="date"
              name="validUntil"
              defaultValue={initialData?.validUntil ?? ''}
            />
          </FormField>
          <FormField label="交货天数" htmlFor="leadTimeDays" error={errors?.leadTimeDays?.[0]}>
            <Input
              id="leadTimeDays"
              type="number"
              name="leadTimeDays"
              defaultValue={initialData?.leadTimeDays ?? ''}
              placeholder="选填,如 30"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="其他信息">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <FormField label="报价来源" htmlFor="source">
            <Input
              id="source"
              type="text"
              name="source"
              defaultValue={initialData?.source ?? ''}
              placeholder="如 微信语音 / 展会现场 / 邮件"
            />
          </FormField>
        </div>
        <FormField
          label={
            <>
              付款条件
              <span className="ml-1 text-xs text-muted-foreground font-normal">
                (英文国际贸易术语,如 FOB / 30% downpayment / Net 30)
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
            placeholder="EXW / FOB / 30% downpayment, balance against B/L"
          />
        </FormField>
      </FormSection>

      <FormSection title="品类标签">
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