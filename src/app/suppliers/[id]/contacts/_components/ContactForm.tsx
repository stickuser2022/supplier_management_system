'use client';

import { useActionState, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import {
  createContact,
  updateContact,
  translateContactFields,
  type ContactFormState,
  type ContactTranslateField,
} from '../_actions/contact-actions';

// ===== 类型 =====
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

// ===== 小组件 =====
function FieldError({ errors }: { errors?: string[] }) {
  if (!errors || errors.length === 0) return null;
  return <p className="text-red-600 text-sm mt-1">{errors[0]}</p>;
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {pending ? '保存中…' : isEdit ? '更新' : '保存'}
    </button>
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
    <form action={formAction} className="space-y-6 max-w-5xl">
      {state.status === 'error' && state.message && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">{state.message}</div>
      )}
      {translateError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-700">{translateError}</div>
      )}

      {/* 翻译按钮 */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 border rounded">
        <button
          type="button"
          onClick={handleTranslate}
          disabled={isTranslating}
          className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
        >
          {isTranslating ? '翻译中…' : '🌐 自动翻译俄文'}
        </button>
        <p className="text-sm text-gray-600">翻译姓名和职位 2 个字段。手改后该字段会上锁。</p>
      </div>

      {/* 姓名 + 职位双语对照 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">基本信息</h2>
        {FIELD_PAIRS.map((pair) => {
          const zhValue = bi[pair.zhFieldName] as string;
          const ruValue = bi[pair.ruFieldName] as string;
          const flagValue = bi[pair.flagFieldName] as boolean;
          return (
            <div key={pair.key} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">
                  {pair.zhLabel}{pair.required && <span className="text-red-500"> *</span>}
                </label>
                <input
                  type="text"
                  name={pair.zhFieldName}
                  value={zhValue}
                  onChange={(e) => handleZhChange(pair.zhFieldName, e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
                <FieldError errors={errors?.[pair.zhFieldName]} />
              </div>
              <div>
                <label className="text-sm mb-1 flex items-center gap-2">
                  <span>{pair.ruLabel}</span>
                  {!flagValue && <span className="text-xs text-amber-600">🔒 已手改</span>}
                </label>
                <input
                  type="text"
                  name={pair.ruFieldName}
                  value={ruValue}
                  onChange={(e) => handleRuChange(pair.ruFieldName, pair.flagFieldName, e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
                <input type="hidden" name={pair.flagFieldName} value={flagValue ? 'true' : 'false'} />
              </div>
            </div>
          );
        })}
      </section>

      {/* 6 个联系方式(全平铺,空的不填) */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">联系方式(空着即可不填)</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">手机</label>
            <input
              type="text"
              name="phone"
              defaultValue={initialData?.phone ?? ''}
              placeholder="多号码用 / 分隔"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">微信</label>
            <input type="text" name="wechat" defaultValue={initialData?.wechat ?? ''} className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm mb-1">邮箱</label>
            <input type="text" name="email" defaultValue={initialData?.email ?? ''} className="w-full px-3 py-2 border rounded" />
            <FieldError errors={errors?.email} />
          </div>
          <div>
            <label className="block text-sm mb-1">WhatsApp</label>
            <input type="text" name="whatsapp" defaultValue={initialData?.whatsapp ?? ''} className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm mb-1">Telegram</label>
            <input type="text" name="telegram" defaultValue={initialData?.telegram ?? ''} className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm mb-1">QQ</label>
            <input type="text" name="qq" defaultValue={initialData?.qq ?? ''} className="w-full px-3 py-2 border rounded" />
          </div>
        </div>
      </section>

      {/* 主要联系人勾选 */}
      <section>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="isPrimary"
            value="true"
            defaultChecked={initialData?.isPrimary ?? false}
            className="w-4 h-4"
          />
          <span className="text-sm">设为主要联系人(同一供应商下只能有 1 个,勾选会自动取消其他人的主要标记)</span>
        </label>
      </section>

      <SubmitButton isEdit={isEdit} />
    </form>
  );
}