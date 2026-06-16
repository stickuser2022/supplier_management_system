import { z } from "zod";

// 合作深度枚举:与 prisma/schema.prisma 的 CooperationLevel 保持一致
export const COOPERATION_LEVELS = [
  "INITIAL_CONTACT",
  "TRIAL_ORDER",
  "REGULAR",
  "STRATEGIC",
  "INACTIVE",
] as const;

// 把 FormData 里的 "true" / "false" 字符串转成真正的 boolean
// 表单的 hidden input value 只能是字符串,服务端要还原成布尔
const stringToBool = z
  .enum(["true", "false"])
  .default("true")
  .transform((v) => v === "true");

export const supplierCreateSchema = z.object({
  // === 必填字段 ===
  code: z.string().trim().min(1, "供应商编号必填"),
  nameZh: z.string().trim().min(1, "中文全名必填"),
  provinceZh: z.string().trim().min(1, "省份必填"),
  cityZh: z.string().trim().min(1, "城市必填"),
  discoveredVia: z.string().trim().min(1, "认识渠道必填"),
  latitude: z.coerce
    .number({ message: "纬度需为数字" })
    .min(-90, "纬度需在 -90 到 90 之间")
    .max(90, "纬度需在 -90 到 90 之间"),
  longitude: z.coerce
    .number({ message: "经度需为数字" })
    .min(-180, "经度需在 -180 到 180 之间")
    .max(180, "经度需在 -180 到 180 之间"),

  // === 选填中文字段 ===
  shortNameZh: z.string().trim().optional(),
  districtZh: z.string().trim().optional(),
  addressZh: z.string().trim().optional(),
  descriptionZh: z.string().trim().optional(),
  mainProductsZh: z.string().trim().optional(),
  website: z
    .union([z.url("网址格式不正确(需带 http:// 或 https://)"), z.literal("")])
    .optional(),

  // === 选填俄文字段(8 个,可空,可由 AI 填或人工填)===
  nameRu: z.string().trim().optional(),
  shortNameRu: z.string().trim().optional(),
  provinceRu: z.string().trim().optional(),
  cityRu: z.string().trim().optional(),
  districtRu: z.string().trim().optional(),
  addressRu: z.string().trim().optional(),
  descriptionRu: z.string().trim().optional(),
  mainProductsRu: z.string().trim().optional(),

  // === 翻译标记(8 个,boolean,从 hidden input 字符串转过来)===
  nameRuAutoTranslated: stringToBool,
  shortNameRuAutoTranslated: stringToBool,
  provinceRuAutoTranslated: stringToBool,
  cityRuAutoTranslated: stringToBool,
  districtRuAutoTranslated: stringToBool,
  addressRuAutoTranslated: stringToBool,
  descriptionRuAutoTranslated: stringToBool,
  mainProductsRuAutoTranslated: stringToBool,

  // === 枚举(带默认值)===
  cooperationLevel: z.enum(COOPERATION_LEVELS).default("INITIAL_CONTACT"),
});

export type SupplierCreateInput = z.infer<typeof supplierCreateSchema>;