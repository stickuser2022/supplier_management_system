import { z } from 'zod';

const stringToBool = z
  .enum(['true', 'false'])
  .default('true')
  .transform((v) => v === 'true');

export const originalIntentSchema = z.object({
  productNameZh: z.string().trim().optional(),
  productNameRu: z.string().trim().optional(),
  overviewZh: z.string().trim().optional(),
  overviewRu: z.string().trim().optional(),
  productNameRuAutoTranslated: stringToBool,
  overviewRuAutoTranslated: stringToBool,
});

export type OriginalIntentInput = z.infer<typeof originalIntentSchema>;
