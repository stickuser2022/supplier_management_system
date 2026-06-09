import { z } from 'zod';

const stringToBool = z.enum(['true', 'false']).default('true').transform((v) => v === 'true');
const emptyToUndefined = z.literal('').transform(() => undefined);

export const noteCreateSchema = z.object({
  contentZh: z.string().trim().min(1, '记录内容(中文)必填'),
  contentRu: z.string().trim().optional(),
  contentRuAutoTranslated: stringToBool,

  happenedAt: z.coerce.date({ message: '事件日期不合法' }),

  contactId: z.union([emptyToUndefined, z.coerce.number().int().positive()]).optional(),
  quoteId: z.union([emptyToUndefined, z.coerce.number().int().positive()]).optional(),
});

export type NoteCreateInput = z.infer<typeof noteCreateSchema>;