'use client';

import { useState, useActionState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Plus, Trash2, Sparkles, Lock, Loader2 } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActions } from '@/components/forms/form-actions';


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
  id: number | null;  // null = 新增,number = 已存在的 Payment
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

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

const SELECT_CLASS_SM =
  'flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

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
  id:null,
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
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <input type="hidden" name="payments" value={JSON.stringify(payments)} />

      <FormSection title={t('sections.main')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('fields.orderedAt')} htmlFor="orderedAt" required>
            <Input
              id="orderedAt"
              type="date"
              name="orderedAt"
              value={orderedAt}
              onChange={(e) => setOrderedAt(e.target.value)}
              required
            />
          </FormField>
          <FormField label={t('fields.contact')} htmlFor="contactId">
            <select
              id="contactId"
              name="contactId"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">—</option>
              {availableContacts.map((c) => (
                <option key={c.id} value={c.id}>{c.nameZh}</option>
              ))}
            </select>
          </FormField>
          <FormField label={t('fields.totalAmount')} htmlFor="totalAmount" required>
            <Input
              id="totalAmount"
              type="text"
              name="totalAmount"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
              className="font-mono"
            />
          </FormField>
          <FormField label={t('fields.currency')} htmlFor="currency">
            <select
              id="currency"
              name="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as (typeof CURRENCIES)[number])}
              className={SELECT_CLASS}
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
        </div>

        <FormField label={t('fields.status')} htmlFor="status">
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof TRANSACTION_STATUSES)[number])}
            className={SELECT_CLASS}
          >
            {TRANSACTION_STATUSES.map((s) => (
              <option key={s} value={s}>{t(`statuses.${s}`)}</option>
            ))}
          </select>
        </FormField>

        <FormField label={t('fields.notesZh')} htmlFor="notesZh">
          <Textarea
            id="notesZh"
            name="notesZh"
            value={notesZh}
            onChange={(e) => setNotesZh(e.target.value)}
            rows={2}
          />
        </FormField>

        <FormField
          label={
            <span className="inline-flex items-center justify-between w-full">
              <span className="inline-flex items-center gap-1">
                <span>{t('fields.notesRu')}</span>
                {!notesRuAutoTranslated && notesRu && (
                  <span className="inline-flex items-center gap-1 text-xs text-warning-fg ml-1">
                    <Lock className="size-3" />
                    {t('lockedRu')}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={handleTranslateNotes}
                disabled={translatingNotes || !notesZh.trim()}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary disabled:opacity-50 transition-colors font-normal"
              >
                {translatingNotes ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Sparkles className="size-3" />
                )}
                {t('translate')}
              </button>
            </span>
          }
          htmlFor="notesRu"
        >
          <Textarea
            id="notesRu"
            name="notesRu"
            value={notesRu}
            onChange={(e) => {
              setNotesRu(e.target.value);
              setNotesRuAutoTranslated(false);
            }}
            rows={2}
          />
          <input type="hidden" name="notesRuAutoTranslated" value={String(notesRuAutoTranslated)} />
        </FormField>
      </FormSection>

      {/* Items */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
          <h2 className="text-base font-medium text-foreground">{t('sections.items')}</h2>
          <Button
            type="button"
            onClick={() => setItems([...items, emptyItem()])}
            variant="outline"
            size="sm"
          >
            <Plus className="size-4" />
            {t('addItem')}
          </Button>
        </div>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="border border-border rounded-md p-4 bg-muted/30 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-medium">
                  {t('itemRow')} #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setItems(items.filter((_, i) => i !== idx))}
                  disabled={items.length === 1}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-danger-fg disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <Trash2 className="size-3" />
                  {t('removeItem')}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-3 space-y-1">
                  <label className="text-xs text-muted-foreground">{t('item.linkQuote')}</label>
                  <select
                    value={item.quoteId != null ? String(item.quoteId) : ''}
                    onChange={(e) =>
                      updateItem(idx, 'quoteId', e.target.value === '' ? null : Number(e.target.value))
                    }
                    className={SELECT_CLASS_SM}
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
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs text-muted-foreground">{t('item.productNameZh')}</label>
                  <Input
                    type="text"
                    value={item.productNameZh}
                    onChange={(e) => updateItem(idx, 'productNameZh', e.target.value)}
                    required
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t('item.quantity')}</label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value) || 0)}
                    required
                    min={1}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t('item.unitZh')}</label>
                  <Input
                    type="text"
                    value={item.unitZh || ''}
                    onChange={(e) => updateItem(idx, 'unitZh', e.target.value || null)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t('item.unitPrice')}</label>
                  <Input
                    type="text"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                    required
                    className="h-8 text-sm font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t('item.subtotal')}</label>
                  <Input
                    type="text"
                    value={item.subtotal}
                    onChange={(e) => updateItem(idx, 'subtotal', e.target.value)}
                    required
                    className="h-8 text-sm font-mono"
                  />
                </div>
                <div className="sm:col-span-3 space-y-1">
                  <label className="text-xs text-muted-foreground">{t('item.productSpecZh')}</label>
                  <Input
                    type="text"
                    value={item.productSpecZh || ''}
                    onChange={(e) => updateItem(idx, 'productSpecZh', e.target.value || null)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Payments */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
          <h2 className="text-base font-medium text-foreground">{t('sections.payments')}</h2>
          <Button
            type="button"
            onClick={() => setPayments([...payments, emptyPayment()])}
            variant="outline"
            size="sm"
          >
            <Plus className="size-4" />
            {t('addPayment')}
          </Button>
        </div>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">{t('paymentsEmpty')}</p>
        ) : (
          <div className="space-y-3">
            {payments.map((p, idx) => (
              <div key={idx} className="border border-border rounded-md p-4 bg-muted/30 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-medium">
                    {t('paymentRow')} #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPayments(payments.filter((_, i) => i !== idx))}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-danger-fg transition-colors"
                  >
                    <Trash2 className="size-3" />
                    {t('removePayment')}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">{t('payment.paidAt')}</label>
                    <Input
                      type="date"
                      value={p.paidAt}
                      onChange={(e) => updatePayment(idx, 'paidAt', e.target.value)}
                      required
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">{t('payment.amount')}</label>
                    <Input
                      type="text"
                      value={p.amount}
                      onChange={(e) => updatePayment(idx, 'amount', e.target.value)}
                      required
                      className="h-8 text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">{t('payment.currency')}</label>
                    <select
                      value={p.currency}
                      onChange={(e) =>
                        updatePayment(idx, 'currency', e.target.value as (typeof CURRENCIES)[number])
                      }
                      className={SELECT_CLASS_SM}
                    >
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">{t('payment.method')}</label>
                    <Input
                      type="text"
                      value={p.method || ''}
                      onChange={(e) => updatePayment(idx, 'method', e.target.value || null)}
                      placeholder={t('payment.methodPlaceholder')}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-4 space-y-1">
                    <label className="text-xs text-muted-foreground">{t('payment.purposeZh')}</label>
                    <Input
                      type="text"
                      value={p.purposeZh || ''}
                      onChange={(e) => updatePayment(idx, 'purposeZh', e.target.value || null)}
                      placeholder={t('payment.purposePlaceholder')}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {state.status === 'error' && state.message && (
        <div className="p-3 rounded-md border border-danger-fg/20 bg-danger-bg text-danger-fg text-sm">
          {state.message}
        </div>
      )}

      <FormActions>
        <Button variant="outline" asChild>
          <Link href={`/suppliers/${supplierId}`}>{t('cancel')}</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? t('saving') : t('save')}
        </Button>
      </FormActions>
    </form>
  );
}