'use client';

import { useActionState, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import {
  createSupplier,
  updateSupplier,
  translateSupplierFields,
  type SupplierFormState,
  type SupplierTranslateField,
} from '../_actions/supplier-actions';
import { COOPERATION_LEVELS } from '../_validations/supplier-schema';

// ===== 类型与常量 =====

const COOPERATION_LEVEL_LABELS: Record<typeof COOPERATION_LEVELS[number], string> = {
  INITIAL_CONTACT: '初步接触',
  TRIAL_ORDER: '试单阶段',
  REGULAR: '常规合作',
  STRATEGIC: '战略合作',
  INACTIVE: '已暂停',
};

// 编辑模式下传入的初始数据形状
export type SupplierFormInitialData = {
  id: number;
  code: string;
  nameZh: string;
  nameRu: string | null;
  nameRuAutoTranslated: boolean;
  shortNameZh: string | null;
  shortNameRu: string | null;
  shortNameRuAutoTranslated: boolean;
  provinceZh: string;
  provinceRu: string | null;
  provinceRuAutoTranslated: boolean;
  cityZh: string;
  cityRu: string | null;
  cityRuAutoTranslated: boolean;
  districtZh: string | null;
  districtRu: string | null;
  districtRuAutoTranslated: boolean;
  addressZh: string | null;
  addressRu: string | null;
  addressRuAutoTranslated: boolean;
  descriptionZh: string | null;
  descriptionRu: string | null;
  descriptionRuAutoTranslated: boolean;
  latitude: number;
  longitude: number;
  cooperationLevel: typeof COOPERATION_LEVELS[number];
  discoveredVia: string;
  website: string | null;
};

type BilingualState = {
  nameZh: string; nameRu: string; nameRuAutoTranslated: boolean;
  shortNameZh: string; shortNameRu: string; shortNameRuAutoTranslated: boolean;
  provinceZh: string; provinceRu: string; provinceRuAutoTranslated: boolean;
  cityZh: string; cityRu: string; cityRuAutoTranslated: boolean;
  districtZh: string; districtRu: string; districtRuAutoTranslated: boolean;
  addressZh: string; addressRu: string; addressRuAutoTranslated: boolean;
  descriptionZh: string; descriptionRu: string; descriptionRuAutoTranslated: boolean;
};

const EMPTY_BILINGUAL: BilingualState = {
  nameZh: '', nameRu: '', nameRuAutoTranslated: true,
  shortNameZh: '', shortNameRu: '', shortNameRuAutoTranslated: true,
  provinceZh: '', provinceRu: '', provinceRuAutoTranslated: true,
  cityZh: '', cityRu: '', cityRuAutoTranslated: true,
  districtZh: '', districtRu: '', districtRuAutoTranslated: true,
  addressZh: '', addressRu: '', addressRuAutoTranslated: true,
  descriptionZh: '', descriptionRu: '', descriptionRuAutoTranslated: true,
};

// 根据 initialData 算出 BilingualState 初值(null → '')
function buildBilingualFromInitial(d?: SupplierFormInitialData): BilingualState {
  if (!d) return EMPTY_BILINGUAL;
  return {
    nameZh: d.nameZh,
    nameRu: d.nameRu ?? '',
    nameRuAutoTranslated: d.nameRuAutoTranslated,
    shortNameZh: d.shortNameZh ?? '',
    shortNameRu: d.shortNameRu ?? '',
    shortNameRuAutoTranslated: d.shortNameRuAutoTranslated,
    provinceZh: d.provinceZh,
    provinceRu: d.provinceRu ?? '',
    provinceRuAutoTranslated: d.provinceRuAutoTranslated,
    cityZh: d.cityZh,
    cityRu: d.cityRu ?? '',
    cityRuAutoTranslated: d.cityRuAutoTranslated,
    districtZh: d.districtZh ?? '',
    districtRu: d.districtRu ?? '',
    districtRuAutoTranslated: d.districtRuAutoTranslated,
    addressZh: d.addressZh ?? '',
    addressRu: d.addressRu ?? '',
    addressRuAutoTranslated: d.addressRuAutoTranslated,
    descriptionZh: d.descriptionZh ?? '',
    descriptionRu: d.descriptionRu ?? '',
    descriptionRuAutoTranslated: d.descriptionRuAutoTranslated,
  };
}

const INITIAL_FORM_STATE: SupplierFormState = { status: 'idle' };

type FieldPair = {
  key: SupplierTranslateField;
  zhFieldName: keyof BilingualState;
  ruFieldName: keyof BilingualState;
  flagFieldName: keyof BilingualState;
  zhLabel: string;
  ruLabel: string;
  required?: boolean;
  multiline?: boolean;
  zhPlaceholder?: string;
};

const FIELD_PAIRS: FieldPair[] = [
  { key: 'name', zhFieldName: 'nameZh', ruFieldName: 'nameRu', flagFieldName: 'nameRuAutoTranslated', zhLabel: '中文全名', ruLabel: '俄文全名', required: true },
  { key: 'shortName', zhFieldName: 'shortNameZh', ruFieldName: 'shortNameRu', flagFieldName: 'shortNameRuAutoTranslated', zhLabel: '中文简称', ruLabel: '俄文简称' },
  { key: 'province', zhFieldName: 'provinceZh', ruFieldName: 'provinceRu', flagFieldName: 'provinceRuAutoTranslated', zhLabel: '省份', ruLabel: '俄文省份', required: true, zhPlaceholder: '如 广东省' },
  { key: 'city', zhFieldName: 'cityZh', ruFieldName: 'cityRu', flagFieldName: 'cityRuAutoTranslated', zhLabel: '城市', ruLabel: '俄文城市', required: true, zhPlaceholder: '如 广州市' },
  { key: 'district', zhFieldName: 'districtZh', ruFieldName: 'districtRu', flagFieldName: 'districtRuAutoTranslated', zhLabel: '区/县', ruLabel: '俄文区/县' },
  { key: 'address', zhFieldName: 'addressZh', ruFieldName: 'addressRu', flagFieldName: 'addressRuAutoTranslated', zhLabel: '详细地址', ruLabel: '俄文地址' },
  { key: 'description', zhFieldName: 'descriptionZh', ruFieldName: 'descriptionRu', flagFieldName: 'descriptionRuAutoTranslated', zhLabel: '备注 / 描述', ruLabel: '俄文备注 / 描述', multiline: true },
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

function BilingualFieldRow({
  pair, bi, errors, onZhChange, onRuChange,
}: {
  pair: FieldPair;
  bi: BilingualState;
  errors?: Record<string, string[] | undefined>;
  onZhChange: (key: keyof BilingualState, value: string) => void;
  onRuChange: (ruKey: keyof BilingualState, flagKey: keyof BilingualState, value: string) => void;
}) {
  const zhValue = bi[pair.zhFieldName] as string;
  const ruValue = bi[pair.ruFieldName] as string;
  const flagValue = bi[pair.flagFieldName] as boolean;
  const baseClass = 'w-full px-3 py-2 border rounded';

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm mb-1">
          {pair.zhLabel}{pair.required && <span className="text-red-500"> *</span>}
        </label>
        {pair.multiline ? (
          <textarea name={pair.zhFieldName} value={zhValue} onChange={(e) => onZhChange(pair.zhFieldName, e.target.value)} rows={3} className={baseClass} placeholder={pair.zhPlaceholder} />
        ) : (
          <input type="text" name={pair.zhFieldName} value={zhValue} onChange={(e) => onZhChange(pair.zhFieldName, e.target.value)} className={baseClass} placeholder={pair.zhPlaceholder} />
        )}
        <FieldError errors={errors?.[pair.zhFieldName]} />
      </div>
      <div>
        <label className="text-sm mb-1 flex items-center gap-2">
          <span>{pair.ruLabel}</span>
          {!flagValue && <span className="text-xs text-amber-600">🔒 已手改</span>}
        </label>
        {pair.multiline ? (
          <textarea name={pair.ruFieldName} value={ruValue} onChange={(e) => onRuChange(pair.ruFieldName, pair.flagFieldName, e.target.value)} rows={3} className={baseClass} />
        ) : (
          <input type="text" name={pair.ruFieldName} value={ruValue} onChange={(e) => onRuChange(pair.ruFieldName, pair.flagFieldName, e.target.value)} className={baseClass} />
        )}
        <input type="hidden" name={pair.flagFieldName} value={flagValue ? 'true' : 'false'} />
      </div>
    </div>
  );
}

// ===== 主组件 =====

export function SupplierForm({ initialData }: { initialData?: SupplierFormInitialData }) {
  const isEdit = Boolean(initialData);

  // 提交时调的 action:新建用 createSupplier,编辑用 updateSupplier(id 通过 .bind 预绑)
  const action = isEdit
    ? updateSupplier.bind(null, initialData!.id)
    : createSupplier;
  const [state, formAction] = useActionState(action, INITIAL_FORM_STATE);

  // useState lazy initializer:第一次渲染才计算,避免每次 render 重算
  const [bi, setBi] = useState<BilingualState>(() => buildBilingualFromInitial(initialData));
  const [isTranslating, startTranslating] = useTransition();
  const [translateError, setTranslateError] = useState<string | null>(null);

  const errors = state.errors;

  const handleZhChange = (key: keyof BilingualState, value: string) => {
    setBi((s) => ({ ...s, [key]: value }));
  };
  const handleRuChange = (ruKey: keyof BilingualState, flagKey: keyof BilingualState, value: string) => {
    setBi((s) => ({ ...s, [ruKey]: value, [flagKey]: false }));
  };

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
      const res = await translateSupplierFields(requests);
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

      <div className="flex items-center gap-4 p-4 bg-gray-50 border rounded">
        <button type="button" onClick={handleTranslate} disabled={isTranslating} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50">
          {isTranslating ? '翻译中…' : '🌐 自动翻译俄文'}
        </button>
        <p className="text-sm text-gray-600">
          填好中文后点这个按钮,AI 把 7 个俄文字段一齐填好。手改俄文后该字段会上锁(再次翻译不覆盖)。
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">基本信息(中俄对照)</h2>
        {FIELD_PAIRS.map((pair) => (
          <BilingualFieldRow key={pair.key} pair={pair} bi={bi} errors={errors} onZhChange={handleZhChange} onRuChange={handleRuChange} />
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">其他信息</h2>

        <div>
          <label className="block text-sm mb-1">
            供应商编号 <span className="text-red-500">*</span>
            {isEdit && <span className="ml-2 text-xs text-gray-500">(编辑模式下不可修改)</span>}
          </label>
          <input
            type="text"
            name="code"
            placeholder="如 GZ-001"
            defaultValue={initialData?.code}
            readOnly={isEdit}
            className={`w-full px-3 py-2 border rounded ${isEdit ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`}
          />
          <FieldError errors={errors?.code} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">纬度 <span className="text-red-500">*</span></label>
            <input type="number" step="any" name="latitude" placeholder="如 23.1291" defaultValue={initialData?.latitude} className="w-full px-3 py-2 border rounded" />
            <FieldError errors={errors?.latitude} />
          </div>
          <div>
            <label className="block text-sm mb-1">经度 <span className="text-red-500">*</span></label>
            <input type="number" step="any" name="longitude" placeholder="如 113.2644" defaultValue={initialData?.longitude} className="w-full px-3 py-2 border rounded" />
            <FieldError errors={errors?.longitude} />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">合作深度</label>
          <select name="cooperationLevel" defaultValue={initialData?.cooperationLevel ?? 'INITIAL_CONTACT'} className="w-full px-3 py-2 border rounded">
            {COOPERATION_LEVELS.map((level) => (
              <option key={level} value={level}>{COOPERATION_LEVEL_LABELS[level]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">认识渠道 <span className="text-red-500">*</span></label>
          <input type="text" name="discoveredVia" placeholder="如 广交会、朋友介绍、老李推荐" defaultValue={initialData?.discoveredVia} className="w-full px-3 py-2 border rounded" />
          <FieldError errors={errors?.discoveredVia} />
        </div>

        <div>
          <label className="block text-sm mb-1">官网</label>
          <input type="text" name="website" placeholder="https://..." defaultValue={initialData?.website ?? ''} className="w-full px-3 py-2 border rounded" />
          <FieldError errors={errors?.website} />
        </div>
      </section>

      <SubmitButton isEdit={isEdit} />
    </form>
  );
}