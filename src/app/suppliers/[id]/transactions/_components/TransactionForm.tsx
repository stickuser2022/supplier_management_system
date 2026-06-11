'use client';

import { useState, useActionState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  createTransaction,
  updateTransaction,
  translateTransactionText,
  type TransactionFormState,
} from '../_actions/transaction-actions';
import {
  CURRENCIES,
  TRANSACTION_STATUSES,
} from '../_validations/transaction-schema';

type ItemRow = {
  quoteId: number | null;
  productNameZh: string;
  productNameRu: string | null;
  productNameRuAutoTranslated: boolean;
  productSpecZh: string | null;
  productSpecRu: string | null;
  productSpecRuAutoTranslated: boolean;
  quantity: number;
  unitZh: string | null;
  unitRu: string | null;
  unitPrice: string;
  subtotal: string;
  sortOrder: number;
};

type PaymentRow = {
  paidAt: string;
  amount: string;
  currency: (typeof CURRENCIES)[number];
  method: string | null;
  purposeZh: string | null;
  purposeRu: string | null;
  purposeRuAutoTranslated: boolean;
};

export type TransactionFormInitialData = {
  id?: number;
  contactId: number | null;
  orderedAt: string;
  totalAmount: string;
  currency: (typeof CURRENCIES)[number];
  notesZh: string | null;
  notesRu: string | null;
  notesRuAutoTranslated: boolean;
  status: (typeof TRANSACTION_STATUSES)[number];
  items: ItemRow[];
  payments: PaymentRow[];
};

const initialState: TransactionFormState = { status: 'idle' };

const emptyItem = (): ItemRow => ({
  quoteId: null,
  productNameZh: '',
  productNameRu: null,
  productNameRuAutoTranslated: true,
  productSpecZh: null,
  productSpecRu: null,
  productSpecRuAutoTranslated: true,
  quantity: 1,
  unitZh: null,
  unitRu: null,
  unitPrice: '0',
  subtotal: '0',
  sortOrder: 0,
});

const emptyPayment = (): PaymentRow => ({
  paidAt: new Date().toISOString().slice(0, 10),
  amount: '0',
  currency: 'CNY',
  method: null,
  purposeZh: null,
  purposeRu: null,
  purposeRuAutoTranslated: true,
});

export function TransactionForm({
  supplierId,
  initialData,
  availableContacts,
  availableQuotes,
}: {
  supplierId: number;
  initialData?: TransactionFormInitialData;
  availableContacts: { id: number; nameZh: string }[];
  availableQuotes: {
    id: number;
    productNameZh: string;
    quotedAt: Date;
    unitPrice: string;
    currency: string;
  }[];
}) {
  const t = useTranslations('transactions');

  const isEdit = !!initialData?.id;
  const boundAction = isEdit
    ? updateTransaction.bind(null, initialData!.id!)
    : createTransaction.bind(null, supplierId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  const [contactId, setContactId] = useState<string>(
    initialData?.contactId != null ? String(initialData.contactId) : '',
  );
  const [orderedAt, setOrderedAt] = useState(
    initialData?.orderedAt || new Date().toISOString().slice(0, 10),
  );
  const [totalAmount, setTotalAmount] = useState(initialData?.totalAmount || '0');
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>(
    initialData?.currency || 'CNY',
  );
  const [notesZh, setNotesZh] = useState(initialData?.notesZh || '');
  const [notesRu, setNotesRu] = useState(initialData?.notesRu || '');
  const [notesRuAutoTranslated, setNotesRuAutoTranslated] = useState(
    initialData?.notesRuAutoTranslated ?? true,
  );
  const [status, setStatus] = useState<(typeof TRANSACTION_STATUSES)[number]>(
    initialData?.status || 'IN_PROGRESS',
  );
  const [items, setItems] = useState<ItemRow[]>(
    initialData?.items.length ? initialData.items : [emptyItem()],
  );
  const [payments, setPayments] = useState<PaymentRow[]>(
    initialData?.payments || [],
  );
  const [translatingNotes, setTranslatingNotes] = useState(false);

  function updateItem<K extends keyof ItemRow>(idx: number, key: K, value: ItemRow[K]) {
    setItems((cur) => cur.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));
  }
  function updatePayment<K extends keyof PaymentRow>(idx: number, key: K, value: PaymentRow[K]) {
    setPayments((cur) => cur.map((p, i) => (i === idx ? { ...p, [key]: value } : p)));
  }

  async function handleTranslateNotes() {
    if (!notesZh.trim()) return;
    setTranslatingNotes(true);
    const res = await translateTransactionText(notesZh);
    if (res.ok) {
      setNotesRu(res.translated);
      setNotesRuAutoTranslated(true);
    } else {
      alert(res.error);
    }
    setTranslatingNotes(false);
  }

  return (
    <form action={formAction} className="space-y-6 max-w-4xl">
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <input type="hidden" name="payments" value={JSON.stringify(payments)} />

      {/* 主信息 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-1">{t('sections.main')}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">{t('fields.orderedAt')}</label>
            <input
              type="date"
              name="orderedAt"
              value={orderedAt}
              onChange={(e) => setOrderedAt(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">{t('fields.contact')}</label>
            <select
              name="contactId"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            >
              <option value="">—</option>
              {availableContacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameZh}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">{t('fields.totalAmount')}</label>
            <input
              type="text"
              name="totalAmount"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">{t('fields.currency')}</label>
            <select
              name="currency"
              value={currency}
              onChange={(e) =>
                setCurrency(e.target.value as (typeof CURRENCIES)[number])
              }
              className="w-full px-3 py-2 border rounded text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm mb-1">{t('fields.status')}</label>
            <select
              name="status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as (typeof TRANSACTION_STATUSES)[number])
              }
              className="w-full px-3 py-2 border rounded text-sm"
            >
              {TRANSACTION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`statuses.${s}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm mb-1">{t('fields.notesZh')}</label>
            <textarea
              name="notesZh"
              value={notesZh}
              onChange={(e) => setNotesZh(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
          <div className="col-span-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm">{t('fields.notesRu')}</label>
              <button
                type="button"
                onClick={handleTranslateNotes}
                disabled={translatingNotes || !notesZh.trim()}
                className="text-xs text-blue-600 hover:underline disabled:opacity-50"
              >
                {translatingNotes ? '…' : t('translate')}
              </button>
            </div>
            <textarea
              name="notesRu"
              value={notesRu}
              onChange={(e) => {
                setNotesRu(e.target.value);
                setNotesRuAutoTranslated(false);
              }}
              rows={2}
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <input
              type="hidden"
              name="notesRuAutoTranslated"
              value={String(notesRuAutoTranslated)}
            />
            {!notesRuAutoTranslated && notesRu && (
              <p className="text-xs text-gray-500 mt-1">🔒 {t('lockedRu')}</p>
            )}
          </div>
        </div>
      </section>

      {/* 明细 Items */}
      <section className="space-y-3">
        <div className="flex justify-between items-center border-b pb-1">
          <h2 className="text-lg font-semibold">{t('sections.items')}</h2>
          <button
            type="button"
            onClick={() => setItems([...items, emptyItem()])}
            className="text-sm text-blue-600 hover:underline"
          >
            + {t('addItem')}
          </button>
        </div>
        {items.map((item, idx) => (
          <div key={idx} className="border rounded p-3 bg-gray-50 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {t('itemRow')} #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => setItems(items.filter((_, i) => i !== idx))}
                disabled={items.length === 1}
                className="text-xs text-red-600 hover:underline disabled:opacity-30"
              >
                {t('removeItem')}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-3">
                <label className="block text-xs mb-1">{t('item.linkQuote')}</label>
                <select
                  value={item.quoteId != null ? String(item.quoteId) : ''}
                  onChange={(e) =>
                    updateItem(
                      idx,
                      'quoteId',
                      e.target.value === '' ? null : Number(e.target.value),
                    )
                  }
                  className="w-full px-2 py-1 border rounded text-xs"
                >
                  <option value="">—</option>
                  {availableQuotes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.productNameZh} · {q.unitPrice} {q.currency} ·{' '}
                      {q.quotedAt.toISOString().slice(0, 10)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs mb-1">{t('item.productNameZh')}</label>
                <input
                  type="text"
                  value={item.productNameZh}
                  onChange={(e) => updateItem(idx, 'productNameZh', e.target.value)}
                  required
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">{t('item.quantity')}</label>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(idx, 'quantity', Number(e.target.value) || 0)
                  }
                  required
                  min={1}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">{t('item.unitZh')}</label>
                <input
                  type="text"
                  value={item.unitZh || ''}
                  onChange={(e) => updateItem(idx, 'unitZh', e.target.value || null)}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">{t('item.unitPrice')}</label>
                <input
                  type="text"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                  required
                  className="w-full px-2 py-1 border rounded text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">{t('item.subtotal')}</label>
                <input
                  type="text"
                  value={item.subtotal}
                  onChange={(e) => updateItem(idx, 'subtotal', e.target.value)}
                  required
                  className="w-full px-2 py-1 border rounded text-sm font-mono"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-xs mb-1">{t('item.productSpecZh')}</label>
                <input
                  type="text"
                  value={item.productSpecZh || ''}
                  onChange={(e) =>
                    updateItem(idx, 'productSpecZh', e.target.value || null)
                  }
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* 付款 Payments */}
      <section className="space-y-3">
        <div className="flex justify-between items-center border-b pb-1">
          <h2 className="text-lg font-semibold">{t('sections.payments')}</h2>
          <button
            type="button"
            onClick={() => setPayments([...payments, emptyPayment()])}
            className="text-sm text-blue-600 hover:underline"
          >
            + {t('addPayment')}
          </button>
        </div>
        {payments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">{t('paymentsEmpty')}</p>
        ) : (
          payments.map((p, idx) => (
            <div key={idx} className="border rounded p-3 bg-gray-50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {t('paymentRow')} #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPayments(payments.filter((_, i) => i !== idx))
                  }
                  className="text-xs text-red-600 hover:underline"
                >
                  {t('removePayment')}
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs mb-1">{t('payment.paidAt')}</label>
                  <input
                    type="date"
                    value={p.paidAt}
                    onChange={(e) => updatePayment(idx, 'paidAt', e.target.value)}
                    required
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">{t('payment.amount')}</label>
                  <input
                    type="text"
                    value={p.amount}
                    onChange={(e) => updatePayment(idx, 'amount', e.target.value)}
                    required
                    className="w-full px-2 py-1 border rounded text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">{t('payment.currency')}</label>
                  <select
                    value={p.currency}
                    onChange={(e) =>
                      updatePayment(
                        idx,
                        'currency',
                        e.target.value as (typeof CURRENCIES)[number],
                      )
                    }
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1">{t('payment.method')}</label>
                  <input
                    type="text"
                    value={p.method || ''}
                    onChange={(e) => updatePayment(idx, 'method', e.target.value || null)}
                    placeholder={t('payment.methodPlaceholder')}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div className="col-span-4">
                  <label className="block text-xs mb-1">{t('payment.purposeZh')}</label>
                  <input
                    type="text"
                    value={p.purposeZh || ''}
                    onChange={(e) =>
                      updatePayment(idx, 'purposeZh', e.target.value || null)
                    }
                    placeholder={t('payment.purposePlaceholder')}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {state.status === 'error' && state.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? t('saving') : t('save')}
        </button>
        <Link
          href={`/suppliers/${supplierId}`}
          className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
        >
          {t('cancel')}
        </Link>
      </div>
    </form>
  );
}