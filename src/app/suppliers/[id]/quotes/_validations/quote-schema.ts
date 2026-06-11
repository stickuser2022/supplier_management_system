import { z } from 'zod';

const stringToBool = z
  .enum(['true', 'false'])
  .default('true')
  .transform((v) => v === 'true');

// 空字符串转 undefined,让 optional 处理
const emptyToUndefined = z.literal('').transform(() => undefined);

export const CURRENCIES = ['CNY', 'USD', 'RUB', 'EUR'] as const;
export const QUOTE_STATUSES = ['ACTIVE', 'ARCHIVED'] as const;

export const quoteCreateSchema = z.object({
  // 关联联系人(可选)
  contactId: z
    .union([emptyToUndefined, z.coerce.number().int().positive()])
    .optional(),

  // 产品(双语)
  productNameZh: z.string().trim().min(1, '产品名(中文)必填'),
  productNameRu: z.string().trim().optional(),
  productSpecZh: z.string().trim().optional(),
  productSpecRu: z.string().trim().optional(),
  productNameRuAutoTranslated: stringToBool,
  productSpecRuAutoTranslated: stringToBool,

  // 价格(必填)
  unitPrice: z.coerce
    .number({ message: '单价需为数字' })
    .positive('单价必须大于 0'),
  currency: z.enum(CURRENCIES).default('CNY'),

  // 单位(双字段,UI 自动补全)
  unitZh: z.string().trim().optional(),
  unitRu: z.string().trim().optional(),

  // 起订量(可选正整数)
  moq: z
    .union([emptyToUndefined, z.coerce.number().int().positive('起订量必须大于 0')])
    .optional(),

  // 时间
  quotedAt: z.coerce.date({ message: '报价日期不合法' }),
  validUntil: z.union([emptyToUndefined, z.coerce.date()]).optional(),

  // 交货天数(可选非负整数)
  leadTimeDays: z
    .union([emptyToUndefined, z.coerce.number().int().min(0, '不能为负')])
    .optional(),

  // 文本字段
  paymentTerms: z.string().trim().optional(),
  source: z.string().trim().optional(),
});

export type QuoteCreateInput = z.infer<typeof quoteCreateSchema>;