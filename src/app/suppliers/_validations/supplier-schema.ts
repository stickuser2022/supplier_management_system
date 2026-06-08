import { z } from "zod";

// 合作深度枚举:与 prisma/schema.prisma 的 CooperationLevel 保持一致
export const COOPERATION_LEVELS = [
  "INITIAL_CONTACT",
  "TRIAL_ORDER",
  "REGULAR",
  "STRATEGIC",
  "INACTIVE",
] as const;//as const 断言让 TypeScript 推断出字面量类型而非宽泛的 string 类型

// 创建供应商时的输入数据形状(本里程碑只含中文字段,俄文字段 + 翻译标记在 1b 加入)
export const supplierCreateSchema = z.object({
  // === 必填字段 ===
  code: z.string().trim().min(1, "供应商编号必填"),//trim() 去掉前后空格, min(1) 确保至少有一个字符
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

  // === 选填字段 ===
  shortNameZh: z.string().trim().optional(),
  districtZh: z.string().trim().optional(),
  addressZh: z.string().trim().optional(),
  descriptionZh: z.string().trim().optional(),
  website: z
    .union([z.url("网址格式不正确(需带 http:// 或 https://)"), z.literal("")])
    .optional(),

  // === 枚举(带默认值)===
  cooperationLevel: z.enum(COOPERATION_LEVELS).default("INITIAL_CONTACT"),
});

export type SupplierCreateInput = z.infer<typeof supplierCreateSchema>;