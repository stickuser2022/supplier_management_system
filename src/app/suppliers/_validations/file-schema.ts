import { z } from 'zod';

/**
 * File 表 title 字段编辑校验
 * - titleZh 可空(File 表本来就允许 null)
 * - titleRu 可空
 * - titleRuAutoTranslated 由表单逻辑决定:
 *   admin 手改俄文 → false(锁定)
 *   admin 点"自动翻译"按钮填写 → true
 */
export const fileTitleSchema = z.object({
  titleZh: z
    .string()
    .trim()
    .max(200, '标题不能超过 200 字')
    .transform((v) => (v === '' ? null : v))
    .nullable(),
  titleRu: z
    .string()
    .trim()
    .max(200, '俄文标题不能超过 200 字')
    .transform((v) => (v === '' ? null : v))
    .nullable(),
  titleRuAutoTranslated: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .transform((v) => v === true || v === 'true'),
});

export type FileTitleInput = z.infer<typeof fileTitleSchema>;