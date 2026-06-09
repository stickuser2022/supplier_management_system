'use client';

import { useActionState, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import {
  createNote,
  updateNote,
  translateNoteFields,
  type NoteFormState,
} from '../_actions/note-actions';

export type NoteFormInitialData = {
  id: number;
  contactId: number | null;
  quoteId: number | null;
  contentZh: string;
  contentRu: string | null;
  contentRuAutoTranslated: boolean;
  happenedAt: string;  // YYYY-MM-DD
};

const INITIAL_FORM_STATE: NoteFormState = { status: 'idle' };

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

  // 受控状态(只 content 中俄两个 + 翻译标记)
  const [contentZh, setContentZh] = useState(initialData?.contentZh ?? '');
  const [contentRu, setContentRu] = useState(initialData?.contentRu ?? '');
  const [autoTranslated, setAutoTranslated] = useState(
    initialData?.contentRuAutoTranslated ?? true,
  );
  const [isTranslating, startTranslating] = useTransition();
  const [translateError, setTranslateError] = useState<string | null>(null);

  const errors = state.errors;
  const baseClass = 'w-full px-3 py-2 border rounded';

  const handleContentRuChange = (value: string) => {
    setContentRu(value);
    setAutoTranslated(false);  // 手改即解锁
  };

  const handleTranslate = () => {
    setTranslateError(null);
    if (contentZh.trim().length === 0) {
      setTranslateError('中文内容为空');
      return;
    }
    if (!autoTranslated) {
      setTranslateError('俄文已手改(锁定),不会覆盖');
      return;
    }
    startTranslating(async () => {
      const res = await translateNoteFields([{ field: 'content', text: contentZh }]);
      if (!res.ok) { setTranslateError(res.error); return; }
      setContentRu(res.results[0].translated);
      setAutoTranslated(true);
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
        <p className="text-sm text-gray-600">填好中文后点这个按钮自动翻译。手改俄文后该字段会上锁。</p>
      </div>

      {/* content 双语 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">记录内容</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">
              中文内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              name="contentZh"
              value={contentZh}
              onChange={(e) => setContentZh(e.target.value)}
              rows={6}
              className={baseClass}
              placeholder="如:5/10 微信沟通,客户问起 30cm 玩具熊报价,对方表示要先样品..."
            />
            <FieldError errors={errors?.contentZh} />
          </div>
          <div>
            <label className="text-sm mb-1 flex items-center gap-2">
              <span>俄文内容</span>
              {!autoTranslated && <span className="text-xs text-amber-600">🔒 已手改</span>}
            </label>
            <textarea
              name="contentRu"
              value={contentRu}
              onChange={(e) => handleContentRuChange(e.target.value)}
              rows={6}
              className={baseClass}
            />
            <input type="hidden" name="contentRuAutoTranslated" value={autoTranslated ? 'true' : 'false'} />
          </div>
        </div>
      </section>

      {/* 时间 + 可选关联 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">时间与关联</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">
              事件日期 <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 ml-1">(可填过去补录)</span>
            </label>
            <input
              type="date"
              name="happenedAt"
              defaultValue={initialData?.happenedAt ?? new Date().toISOString().slice(0, 10)}
              className={baseClass}
            />
            <FieldError errors={errors?.happenedAt} />
          </div>
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
            <label className="block text-sm mb-1">关联报价</label>
            <select name="quoteId" defaultValue={initialData?.quoteId?.toString() ?? ''} className={baseClass}>
              <option value="">— 不指定 —</option>
              {availableQuotes.map((q) => (
                <option key={q.id} value={q.id}>
                  #{q.id} {q.productNameZh} ({q.quotedAt.toISOString().slice(0, 10)})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <SubmitButton isEdit={isEdit} />
    </form>
  );
}