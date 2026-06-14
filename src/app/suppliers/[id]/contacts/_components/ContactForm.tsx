'use client';

import { useActionState, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { Lock, Sparkles, Loader2 } from 'lucide-react';
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

const FIELD_PAIRS: FieldPair[] = [
  { key: 'name', zhFieldName: 'nameZh', ruFieldName: 'nameRu', flagFieldName: 'nameRuAutoTranslated', zhLabel: '中文姓名', ruLabel: '俄文姓名', required: true },
  { key: 'role', zhFieldName: 'roleZh', ruFieldName: 'roleRu', flagFieldName: 'roleRuAutoTranslated', zhLabel: '职位(中文)', ruLabel: '职位(俄文)' },
];

// ===== 子组件 =====

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? '保存中…' : isEdit ? '更新' : '保存'}
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

  const handleZhChange = (key: keyof BilingualState, value: string) =>
    setBi((s) => ({ ...s, [key]: value }));
  const handleRuChange = (ruKey: keyof BilingualState, flagKey: keyof BilingualState, value: string) =>
    setBi((s) => ({ ...s, [ruKey]: value, [flagKey]: false }));

  const handleTranslate = () => {
    setTranslateError(null);
    const requests = FIELD_PAIRS
      .filter((p) => {
        const zhValue = (bi[p.zhFieldName] as string).trim();
        const isLocked = !(bi[p.flagFieldName] as boolean);
        return zhValue.length > 0 && !isLocked;
      })
      .map((p) => ({ field: p.key, text: bi[p.zhFieldName] as string }));

    if (requests.length === 0) {
      setTranslateError('没有可翻译的字段(中文为空 / 已锁定)');
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
              翻译中…
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              自动翻译俄文
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground leading-relaxed pt-1">
          翻译姓名和职位 2 个字段。手改后该字段会上锁(再次翻译不覆盖)。
        </p>
      </div>

      <FormSection title="基本信息">
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

      <FormSection title="联系方式" description="空着即可不填,多号码用 / 分隔">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="手机" htmlFor="phone">
            <Input
              id="phone"
              type="text"
              name="phone"
              defaultValue={initialData?.phone ?? ''}
              placeholder="13800138000"
            />
          </FormField>
          <FormField label="微信" htmlFor="wechat">
            <Input
              id="wechat"
              type="text"
              name="wechat"
              defaultValue={initialData?.wechat ?? ''}
            />
          </FormField>
          <FormField label="邮箱" htmlFor="email" error={errors?.email?.[0]}>
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
            设为主要联系人
            <span className="block text-xs text-muted-foreground mt-0.5">
              同一供应商下只能有 1 个,勾选会自动取消其他人的主要标记
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