import { z } from 'zod';

export const TAG_CATEGORIES = [
  'PRODUCT',
  'EXPORT',
  'CERT',
  'CAPACITY',
  'CUSTOM',
] as const;

export const tagCreateSchema = z.object({
  category: z.enum(TAG_CATEGORIES),
  nameZh: z.string().trim().min(1, '中文名必填').max(50, '中文名最长 50 字'),
  nameRu: z.string().trim().min(1, '俄文名必填').max(80, '俄文名最长 80 字'),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, '颜色必须是 7 位 hex,如 #b91c1c')
    .or(z.literal(''))
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  icon: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type TagCreateInput = z.infer<typeof tagCreateSchema>;
