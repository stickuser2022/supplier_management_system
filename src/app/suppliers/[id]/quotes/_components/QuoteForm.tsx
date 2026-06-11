'use client';

import { useActionState, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import {
  createQuote,
  updateQuote,
  translateQuoteFields,
  type QuoteFormState,
  type QuoteTranslateField,
} from '../_actions/quote-actions';
import { CURRENCIES } from '../_validations/quote-schema';
import { TagMultiSelect } from './TagMultiSelect';

// ===== 类型 =====
export type QuoteFormInitialData = {
  id: number;
  contactId: number | null;
  productNameZh: string;
  productNameRu: string | null;
  productNameRuAutoTranslated: boolean;
  productSpecZh: string | null;
  productSpecRu: string | null;
  productSpecRuAutoTranslated: boolean;
  unitPrice: string;  // 已 toString() 由 parent 处理
  currency: typeof CURRENCIES[number];
  unitZh: string | null;
  unitRu: string | null;
  moq: number | null;
  quotedAt: string;  // YYYY-MM-DD
  validUntil: string | null;  // YYYY-MM-DD or null
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
  const baseClass = 'w-full px-3 py-2 border rounded';

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
      if (!res.ok) { setTranslateError(res.error); return; }
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
        <button type="button" onClick={handleTranslate} disabled={isTranslating}
          className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50">
          {isTranslating ? '翻译中…' : '🌐 自动翻译俄文'}
        </button>
        <p className="text-sm text-gray-600">翻译产品名和规格 2 个字段。手改后该字段会上锁。</p>
      </div>

      {/* 产品信息(双语) */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">产品信息</h2>
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
                <input type="text" name={pair.zhFieldName} value={zhValue}
                  onChange={(e) => handleZhChange(pair.zhFieldName, e.target.value)}
                  className={baseClass} />
                <FieldError errors={errors?.[pair.zhFieldName]} />
              </div>
              <div>
                <label className="text-sm mb-1 flex items-center gap-2">
                  <span>{pair.ruLabel}</span>
                  {!flagValue && <span className="text-xs text-amber-600">🔒 已手改</span>}
                </label>
                <input type="text" name={pair.ruFieldName} value={ruValue}
                  onChange={(e) => handleRuChange(pair.ruFieldName, pair.flagFieldName, e.target.value)}
                  className={baseClass} />
                <input type="hidden" name={pair.flagFieldName} value={flagValue ? 'true' : 'false'} />
              </div>
            </div>
          );
        })}
      </section>

      {/* 价格 + 货币 + 单位 + 起订量 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">价格与数量</h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm mb-1">单价 <span className="text-red-500">*</span></label>
            <input type="number" step="0.01" name="unitPrice" defaultValue={initialData?.unitPrice ?? ''} className={baseClass} />
            <FieldError errors={errors?.unitPrice} />
          </div>
          <div>
            <label className="block text-sm mb-1">货币</label>
            <select name="currency" defaultValue={initialData?.currency ?? 'CNY'} className={baseClass}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">单位(中)</label>
            <input type="text" name="unitZh" defaultValue={initialData?.unitZh ?? ''} placeholder="如 件 / 个 / 箱" className={baseClass} list="unit-zh-suggestions" />
            <datalist id="unit-zh-suggestions">
              <option value="件" /><option value="个" /><option value="箱" /><option value="打" /><option value="米" /><option value="千克" />
            </datalist>
          </div>
          <div>
            <label className="block text-sm mb-1">单位(俄)</label>
            <input type="text" name="unitRu" defaultValue={initialData?.unitRu ?? ''} placeholder="шт / коробка / дюжина" className={baseClass} list="unit-ru-suggestions" />
            <datalist id="unit-ru-suggestions">
              <option value="шт" /><option value="коробка" /><option value="дюжина" /><option value="м" /><option value="кг" />
            </datalist>
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">起订量(MOQ)</label>
          <input type="number" name="moq" defaultValue={initialData?.moq ?? ''} placeholder="选填,如 100" className={baseClass} />
          <FieldError errors={errors?.moq} />
        </div>
      </section>

      {/* 时间 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">时间</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">报价日期 <span className="text-red-500">*</span></label>
            <input type="date" name="quotedAt" defaultValue={initialData?.quotedAt ?? new Date().toISOString().slice(0, 10)} className={baseClass} />
            <FieldError errors={errors?.quotedAt} />
          </div>
          <div>
            <label className="block text-sm mb-1">有效期至</label>
            <input type="date" name="validUntil" defaultValue={initialData?.validUntil ?? ''} className={baseClass} />
          </div>
          <div>
            <label className="block text-sm mb-1">交货天数</label>
            <input type="number" name="leadTimeDays" defaultValue={initialData?.leadTimeDays ?? ''} placeholder="选填,如 30" className={baseClass} />
            <FieldError errors={errors?.leadTimeDays} />
          </div>
        </div>
      </section>

      {/* 关联 + 来源 + 付款条款 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">其他信息</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">关联联系人</label>
            <select name="contactId" defaultValue={initialData?.contactId?.toString() ?? ''} className={baseClass}>
              <option value="">— 不指定 —</option>
              {availableContacts.map((c) => (
                <option key={c.id} value={c.id}>{c.nameZh}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">报价来源</label>
            <input type="text" name="source" defaultValue={initialData?.source ?? ''} placeholder="如 微信语音 / 展会现场 / 邮件" className={baseClass} />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">
            付款条件 <span className="text-xs text-gray-500">(用英文国际贸易术语,如 FOB / 30% downpayment / Net 30)</span>
          </label>
          <input type="text" name="paymentTerms" defaultValue={initialData?.paymentTerms ?? ''} placeholder="EXW / FOB / 30% downpayment, balance against B/L" className={baseClass} />
        </div>
      </section>

      {/* 品类标签 */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">品类标签</h2>
        <TagMultiSelect availableTags={availableTags} initialSelectedIds={initialData?.tagIds ?? []} locale={locale} />
      </section>

      <SubmitButton isEdit={isEdit} />
    </form>
  );
}