import { z } from 'zod';

const stringToBool = z
  .enum(['true', 'false'])
  .default('true')
  .transform((v) => v === 'true');

const stringToBoolFalse = z
  .enum(['true', 'false'])
  .default('false')
  .transform((v) => v === 'true');

export const CONTACT_STATUSES = ['ACTIVE', 'ARCHIVED'] as const;

export const contactCreateSchema = z.object({
  // 必填
  nameZh: z.string().trim().min(1, '中文姓名必填'),

  // 选填中文 / 俄文 + 翻译标记
  nameRu: z.string().trim().optional(),
  roleZh: z.string().trim().optional(),
  roleRu: z.string().trim().optional(),
  nameRuAutoTranslated: stringToBool,
  roleRuAutoTranslated: stringToBool,

  // 6 个联系方式(全可空)
  phone: z.string().trim().optional(),
  wechat: z.string().trim().optional(),
  email: z
    .union([z.email('邮箱格式不正确'), z.literal('')])
    .optional(),
  whatsapp: z.string().trim().optional(),
  telegram: z.string().trim().optional(),
  qq: z.string().trim().optional(),

  // 是否主要联系人(从 checkbox 来,默认 false)
  isPrimary: stringToBoolFalse,
});

export type ContactCreateInput = z.infer<typeof contactCreateSchema>;