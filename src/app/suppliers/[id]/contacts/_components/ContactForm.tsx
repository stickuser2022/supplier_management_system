'use client';

import { useActionState, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { Sparkles, Loader2 } from 'lucide-react';
import {
  createContact,
  updateContact,
  translateContactFields,
  type ContactFormState,
  type ContactTranslateField,
} from '../_actions/contact-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActions } from '@/components/forms/form-actions';

// ===== 类型与常量(未变动)=====

export type ContactFormInitialData = {
  id: number;
  nameZh: string;
  nameRu: string | null;
  nameRuAutoTranslated: boolean;
  roleZh: string | null;
  roleRu: string | null;
  roleRuAutoTranslated: boolean;
  phone: string | null;
  wechat: string | null;
  email: string | null;
  whatsapp: string | null;
  telegram: string | null;
  qq: string | null;
  isPrimary: boolean;
};

type BilingualState = {
  nameZh: string; nameRu: string; nameRuAutoTranslated: boolean;
  roleZh: string; roleRu: string; roleRuAutoTranslated: boolean;
};

const EMPTY_BILINGUAL: BilingualState = {
  nameZh: '', nameRu: '', nameRuAutoTranslated: true,
  roleZh: '', roleRu: '', roleRuAutoTranslated: true,
};

function buildBilingualFromInitial(d?: ContactFormInitialData): BilingualState {
  if (!d) return EMPTY_BILINGUAL;
  return {
    nameZh: d.nameZh,
    nameRu: d.nameRu ?? '',
    nameRuAutoTranslated: d.nameRuAutoTranslated,
    roleZh: d.roleZh ?? '',
    roleRu: d.roleRu ?? '',
    roleRuAutoTranslated: d.roleRuAutoTranslated,
  };
}

const INITIAL_FORM_STATE: ContactFormState = { status: 'idle' };

type FieldPair = {
  key: ContactTranslateField;
  zhFieldName: keyof BilingualState;
  ruFieldName: keyof BilingualState;
  flagFieldName: keyof BilingualState;
  zhLabel: string;
  ruLabel: string;
  required?: boolean;
};

// ===== 子组件 =====

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

// ===== 主组件 =====

export function ContactForm({
  supplierId,
  initialData,
}: {
  supplierId: number;
  initialData?: ContactFormInitialData;
}) {
  const isEdit = Boolean(initialData);
  const action = isEdit
    ? updateContact.bind(null, initialData!.id)
    : createContact.bind(null, supplierId);
  const [state, formAction] = useActionState(action, INITIAL_FORM_STATE);
  const [bi, setBi] = useState<BilingualState>(() => buildBilingualFromInitial(initialData));
  const [isTranslating, startTranslating] = useTransition();
  const [translateError, setTranslateError] = useState<string | null>(null);
  const errors = state.errors;

  const t = useTranslations('forms.contact');
  const tCommon = useTranslations('forms.common');

  // FIELD_PAIRS 移到组件内部:label 走 t(),原本是 module-level 常量改不了
  const FIELD_PAIRS: FieldPair[] = [
    { key: 'name', zhFieldName: 'nameZh', ruFieldName: 'nameRu', flagFieldName: 'nameRuAutoTranslated', zhLabel: t('labelNameZh'), ruLabel: t('labelNameRu'), required: true },
    { key: 'role', zhFieldName: 'roleZh', ruFieldName: 'roleRu', flagFieldName: 'roleRuAutoTranslated', zhLabel: t('labelRoleZh'), ruLabel: t('labelRoleRu') },
  ];

  const handleZhChange = (key: keyof BilingualState, value: string) =>
    setBi((s) => ({ ...s, [key]: value }));
  // 已去除"已手改"机制:用户改俄文不再翻 flag,因此重翻会覆盖现有俄文(用户预期)
  const handleRuChange = (ruKey: keyof BilingualState, _flagKey: keyof BilingualState, value: string) =>
    setBi((s) => ({ ...s, [ruKey]: value }));

  const handleTranslate = () => {
    setTranslateError(null);
    const requests = FIELD_PAIRS
      .filter((p) => (bi[p.zhFieldName] as string).trim().length > 0)
      .map((p) => ({ field: p.key, text: bi[p.zhFieldName] as string }));

    if (requests.length === 0) {
      setTranslateError(t('noTranslateTargets'));
      return;
    }

    startTranslating(async () => {
      const res = await translateContactFields(requests);
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

      {/* 自动翻译辅助区 */}
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
            <>
              <Loader2 className="size-4 animate-spin" />
              {tCommon('translating')}
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              {t('autoTranslateButton')}
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground leading-relaxed pt-1">
          {t('autoTranslateHint')}
        </p>
      </div>

      <FormSection title={t('sectionBasic')}>
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
              <FormField
                label={pair.ruLabel}
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

      <FormSection title={t('sectionContact')} description={t('contactHint')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('labelPhone')} htmlFor="phone">
            <Input
              id="phone"
              type="text"
              name="phone"
              defaultValue={initialData?.phone ?? ''}
              placeholder="13800138000"
            />
          </FormField>
          <FormField label={t('labelWechat')} htmlFor="wechat">
            <Input
              id="wechat"
              type="text"
              name="wechat"
              defaultValue={initialData?.wechat ?? ''}
            />
          </FormField>
          <FormField label={t('labelEmail')} htmlFor="email" error={errors?.email?.[0]}>
            <Input
              id="email"
              type="email"
              name="email"
              defaultValue={initialData?.email ?? ''}
            />
          </FormField>
          <FormField label="WhatsApp" htmlFor="whatsapp">
            <Input
              id="whatsapp"
              type="text"
              name="whatsapp"
              defaultValue={initialData?.whatsapp ?? ''}
            />
          </FormField>
          <FormField label="Telegram" htmlFor="telegram">
            <Input
              id="telegram"
              type="text"
              name="telegram"
              defaultValue={initialData?.telegram ?? ''}
            />
          </FormField>
          <FormField label="QQ" htmlFor="qq">
            <Input
              id="qq"
              type="text"
              name="qq"
              defaultValue={initialData?.qq ?? ''}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection>
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            name="isPrimary"
            value="true"
            defaultChecked={initialData?.isPrimary ?? false}
            className="size-4 mt-0.5 rounded border-border accent-primary cursor-pointer"
          />
          <span className="text-sm text-foreground leading-snug">
            {t('labelIsPrimary')}
            <span className="block text-xs text-muted-foreground mt-0.5">
              {t('primaryHint')}
            </span>
          </span>
        </label>
      </FormSection>

      <FormActions>
        <SubmitButton isEdit={isEdit} />
      </FormActions>
    </form>
  );
}