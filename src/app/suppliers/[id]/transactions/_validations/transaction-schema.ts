import { z } from 'zod';

export const CURRENCIES = ['CNY', 'USD', 'RUB', 'EUR'] as const;
export const TRANSACTION_STATUSES = ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;

const decimalString = z
  .string()
  .trim()
  .refine((v) => /^\d+(\.\d+)?$/.test(v), '请输入有效金额(数字,小数点可选)');

const optionalString = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable();

export const transactionItemSchema = z.object({
  quoteId: z.union([z.number().int().positive(), z.null()]).optional().nullable(),
  productNameZh: z.string().trim().min(1, '产品名必填').max(200),
  productNameRu: optionalString,
  productNameRuAutoTranslated: z.boolean().default(true),
  productSpecZh: optionalString,
  productSpecRu: optionalString,
  productSpecRuAutoTranslated: z.boolean().default(true),
  quantity: z.number().int().positive('数量必须大于 0'),
  unitZh: optionalString,
  unitRu: optionalString,
  unitPrice: decimalString,
  subtotal: decimalString,
  sortOrder: z.number().int().nonnegative().default(0),
});

export const paymentSchema = z.object({
  // null = 新增行;number = 已存在,走 UPDATE
  id: z.union([z.number().int().positive(), z.null()]).optional().nullable(),
  paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD'),
  amount: decimalString,
  currency: z.enum(CURRENCIES),
  method: optionalString,
  purposeZh: optionalString,
  purposeRu: optionalString,
  purposeRuAutoTranslated: z.boolean().default(true),
});

export const transactionCreateSchema = z.object({
  contactId: z
    .union([
      z.literal('').transform(() => null),
      z.coerce.number().int().positive(),
      z.null(),
    ])
    .nullable(),
  orderedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD'),
  totalAmount: decimalString,
  currency: z.enum(CURRENCIES),
  notesZh: optionalString,
  notesRu: optionalString,
  notesRuAutoTranslated: z.coerce.boolean().default(true),
  status: z.enum(TRANSACTION_STATUSES).default('IN_PROGRESS'),
  items: z.array(transactionItemSchema).min(1, '至少添加一条明细'),
  payments: z.array(paymentSchema),
});

export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;
export type TransactionItemInput = z.infer<typeof transactionItemSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;