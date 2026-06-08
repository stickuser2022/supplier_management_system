'use client';// 这个指令告诉 Next.js 这是一个 Client Component,可以在浏览器运行,可以用 useState、useEffect 等 React Hooks

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  createSupplier,
  INITIAL_SUPPLIER_FORM_STATE,
} from '../_actions/supplier-actions';
import { COOPERATION_LEVELS } from '../_validations/supplier-schema';

// 合作深度的中文显示标签
const COOPERATION_LEVEL_LABELS: Record<typeof COOPERATION_LEVELS[number], string> = {
  INITIAL_CONTACT: '初步接触',
  TRIAL_ORDER: '试单阶段',
  REGULAR: '常规合作',
  STRATEGIC: '战略合作',
  INACTIVE: '已暂停',
};

// 字段错误显示组件:有错误显示红字,没错误返回 null
function FieldError({ errors }: { errors?: string[] }) {
  if (!errors || errors.length === 0) return null;
  return <p className="text-red-600 text-sm mt-1">{errors[0]}</p>;
}

// 提交按钮:用 useFormStatus 拿"是否正在提交"状态,期间禁用并改文字
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {pending ? '保存中…' : '保存'}
    </button>
  );
}

export function SupplierForm() {
  // useActionState:把 Server Action 包成可在 form 上用的 action,并维护它返回的 state
  const [state, formAction] = useActionState(createSupplier, INITIAL_SUPPLIER_FORM_STATE);
  const errors = state.errors;

  return (
    <form action={formAction} className="space-y-6 max-w-3xl">
      {/* 顶部整体错误条(校验失败、保存失败等) */}
      {state.status === 'error' && state.message && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {state.message}
        </div>
      )}

      {/* 身份信息 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">身份信息</h2>

        <div>
          <label className="block text-sm mb-1">
            供应商编号 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="code"
            placeholder="如 GZ-001"
            className="w-full px-3 py-2 border rounded"
          />
          <FieldError errors={errors?.code} />
        </div>

        <div>
          <label className="block text-sm mb-1">
            中文全名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="nameZh"
            className="w-full px-3 py-2 border rounded"
          />
          <FieldError errors={errors?.nameZh} />
        </div>

        <div>
          <label className="block text-sm mb-1">中文简称</label>
          <input
            type="text"
            name="shortNameZh"
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      </section>

      {/* 地理位置 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">地理位置</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">
              省份 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="provinceZh"
              placeholder="如 广东省"
              className="w-full px-3 py-2 border rounded"
            />
            <FieldError errors={errors?.provinceZh} />
          </div>

          <div>
            <label className="block text-sm mb-1">
              城市 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="cityZh"
              placeholder="如 广州市"
              className="w-full px-3 py-2 border rounded"
            />
            <FieldError errors={errors?.cityZh} />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">区/县</label>
          <input
            type="text"
            name="districtZh"
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">详细地址</label>
          <input
            type="text"
            name="addressZh"
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">
              纬度 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              name="latitude"
              placeholder="如 23.1291"
              className="w-full px-3 py-2 border rounded"
            />
            <FieldError errors={errors?.latitude} />
          </div>

          <div>
            <label className="block text-sm mb-1">
              经度 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              name="longitude"
              placeholder="如 113.2644"
              className="w-full px-3 py-2 border rounded"
            />
            <FieldError errors={errors?.longitude} />
          </div>
        </div>
      </section>

      {/* 业务信息 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">业务信息</h2>

        <div>
          <label className="block text-sm mb-1">合作深度</label>
          <select
            name="cooperationLevel"
            defaultValue="INITIAL_CONTACT"
            className="w-full px-3 py-2 border rounded"
          >
            {COOPERATION_LEVELS.map((level) => (
              <option key={level} value={level}>
                {COOPERATION_LEVEL_LABELS[level]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">
            认识渠道 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="discoveredVia"
            placeholder="如 广交会、朋友介绍、老李推荐"
            className="w-full px-3 py-2 border rounded"
          />
          <FieldError errors={errors?.discoveredVia} />
        </div>

        <div>
          <label className="block text-sm mb-1">官网</label>
          <input
            type="text"
            name="website"
            placeholder="https://..."
            className="w-full px-3 py-2 border rounded"
          />
          <FieldError errors={errors?.website} />
        </div>

        <div>
          <label className="block text-sm mb-1">备注 / 描述</label>
          <textarea
            name="descriptionZh"
            rows={4}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      </section>

      <SubmitButton />
    </form>
  );
}