'use client';

import { useActionState, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { Sparkles, Loader2 } from 'lucide-react';
import {
  saveOriginalIntent,
  translateOriginalIntentFields,
  type OriginalIntentFormState,
  type OriginalIntentTranslateField,
} from '../_actions/original-intent-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActions } from '@/components/forms/form-actions';

// ===== 类型 =====

export type OriginalIntentInitialData = {
  productNameZh: string | null;
  productNameRu: string | null;
  productNameRuAutoTranslated: boolean;
  overviewZh: string | null;
  overviewRu: string | null;
  overviewRuAutoTranslated: boolean;
};

type BilingualState = {
  productNameZh: string;
  productNameRu: string;
  productNameRuAutoTranslated: boolean;
  overviewZh: string;
  overviewRu: string;
  overviewRuAutoTranslated: boolean;
};

const EMPTY_BILINGUAL: BilingualState = {
  productNameZh: '',
  productNameRu: '',
  productNameRuAutoTranslated: true,
  overviewZh: '',
  overviewRu: '',
  overviewRuAutoTranslated: true,
};

function buildBilingualFromInitial(d?: OriginalIntentInitialData | null): BilingualState {
  if (!d) return EMPTY_BILINGUAL;
  return {
    productNameZh: d.productNameZh ?? '',
    productNameRu: d.productNameRu ?? '',
    productNameRuAutoTranslated: d.productNameRuAutoTranslated,
    overviewZh: d.overviewZh ?? '',
    overviewRu: d.overviewRu ?? '',
    overviewRuAutoTranslated: d.overviewRuAutoTranslated,
  };
}

const INITIAL_FORM_STATE: OriginalIntentFormState = { status: 'idle' };

type FieldPair = {
  key: OriginalIntentTranslateField;
  zhFieldName: keyof BilingualState;
  ruFieldName: keyof BilingualState;
  flagFieldName: keyof BilingualState;
  zhLabel: string;
  ruLabel: string;
  multiline?: boolean;
};

// ===== 子组件 =====

function SubmitButton() {
  const { pending } = useFormStatus();
  const tCommon = useTranslations('forms.common');
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? tCommon('submitting') : tCommon('submit')}
    </Button>
  );
}

// ===== 主组件 =====

export function OriginalIntentForm({
  supplierId,
  initialData,
}: {
  supplierId: number;
  initialData?: OriginalIntentInitialData | null;
}) {
  const action = saveOriginalIntent.bind(null, supplierId);
  const [state, formAction] = useActionState(action, INITIAL_FORM_STATE);
  const [bi, setBi] = useState<BilingualState>(() => buildBilingualFromInitial(initialData));
  const [isTranslating, startTranslating] = useTransition();
  const [translateError, setTranslateError] = useState<string | null>(null);
  const errors = state.errors;

  const t = useTranslations('forms.originalIntent');
  const tCommon = useTranslations('forms.common');

  const FIELD_PAIRS: FieldPair[] = [
    {
      key: 'productName',
      zhFieldName: 'productNameZh',
      ruFieldName: 'productNameRu',
      flagFieldName: 'productNameRuAutoTranslated',
      zhLabel: t('labelProductNameZh'),
      ruLabel: t('labelProductNameRu'),
    },
    {
      key: 'overview',
      zhFieldName: 'overviewZh',
      ruFieldName: 'overviewRu',
      flagFieldName: 'overviewRuAutoTranslated',
      zhLabel: t('labelOverviewZh'),
      ruLabel: t('labelOverviewRu'),
      multiline: true,
    },
  ];

  const handleZhChange = (key: keyof BilingualState, value: string) =>
    setBi((s) => ({ ...s, [key]: value }));
  const handleRuChange = (ruKey: keyof BilingualState, value: string) =>
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
      const res = await translateOriginalIntentFields(requests, direction);
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

      {/* 翻译辅助区 */}
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

      <FormSection title={t('sectionInfo')}>
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
                error={errors?.[pair.zhFieldName]?.[0]}
              >
                {pair.multiline ? (
                  <Textarea
                    id={zhFieldId}
                    name={pair.zhFieldName}
                    value={zhValue}
                    onChange={(e) => handleZhChange(pair.zhFieldName, e.target.value)}
                    rows={4}
                    placeholder={t('overviewZhPlaceholder')}
                  />
                ) : (
                  <Input
                    id={zhFieldId}
                    type="text"
                    name={pair.zhFieldName}
                    value={zhValue}
                    onChange={(e) => handleZhChange(pair.zhFieldName, e.target.value)}
                    placeholder={t('productNameZhPlaceholder')}
                  />
                )}
              </FormField>
              <FormField
                label={pair.ruLabel}
                htmlFor={ruFieldId}
              >
                {pair.multiline ? (
                  <Textarea
                    id={ruFieldId}
                    name={pair.ruFieldName}
                    value={ruValue}
                    onChange={(e) => handleRuChange(pair.ruFieldName, e.target.value)}
                    rows={4}
                    placeholder={t('overviewRuPlaceholder')}
                  />
                ) : (
                  <Input
                    id={ruFieldId}
                    type="text"
                    name={pair.ruFieldName}
                    value={ruValue}
                    onChange={(e) => handleRuChange(pair.ruFieldName, e.target.value)}
                    placeholder={t('productNameRuPlaceholder')}
                  />
                )}
                <input type="hidden" name={pair.flagFieldName} value={flagValue ? 'true' : 'false'} />
              </FormField>
            </div>
          );
        })}
      </FormSection>

      <FormActions>
        <SubmitButton />
      </FormActions>
    </form>
  );
}
