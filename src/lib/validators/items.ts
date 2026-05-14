import { z } from "zod";
import {
  categoryCodeEnum,
  fashionItemTypeEnum,
  haiaceInstallStatusEnum,
  haiaceRoadLegalEnum,
  usageStatusEnum,
} from "./enums";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 形式で入力してください");

export const itemBaseSchema = z.object({
  category_code: categoryCodeEnum,
  marketplace_id: z.string().uuid(),
  marketplace_other_name: z
    .string()
    .trim()
    .max(100)
    .nullish()
    .transform((v) => (v && v.length > 0 ? v : null)),
  seller_name: z
    .string()
    .trim()
    .max(200)
    .nullish()
    .transform((v) => (v && v.length > 0 ? v : null)),
  name: z.string().trim().min(1, "商品名は必須です").max(200),
  purchase_price: z.coerce.number().int().min(0),
  shipping_fee: z.coerce.number().int().min(0).default(0),
  purchase_date: dateString,
  memo: z
    .string()
    .max(2000)
    .nullish()
    .transform((v) => (v && v.length > 0 ? v : null)),
  usage_status: usageStatusEnum.default("storing"),
  last_used_at: dateString.nullish(),
  storage_location: z
    .string()
    .trim()
    .max(200)
    .nullish()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export const fashionDetailsSchema = z.object({
  item_type: fashionItemTypeEnum.nullable().optional(),
  size: z.string().trim().max(50).nullable().optional(),
  brand: z.string().trim().max(100).nullable().optional(),
  color: z.string().trim().max(50).nullable().optional(),
});

export const haiaceDetailsSchema = z.object({
  install_status: haiaceInstallStatusEnum.default("not_installed"),
  road_legal: haiaceRoadLegalEnum.default("unknown"),
  position_ids: z.array(z.string().uuid()).default([]),
  purpose_ids: z.array(z.string().uuid()).default([]),
});

export const itemFormSchema = z
  .discriminatedUnion("category_code", [
    itemBaseSchema.extend({
      category_code: z.literal("fashion"),
      fashion: fashionDetailsSchema,
    }),
    itemBaseSchema.extend({
      category_code: z.literal("haiace"),
      haiace: haiaceDetailsSchema,
    }),
    itemBaseSchema.extend({
      category_code: z.literal("other"),
    }),
  ])
  .refine(
    (data) => {
      if (!data.last_used_at) return true;
      return data.last_used_at >= data.purchase_date;
    },
    { path: ["last_used_at"], message: "最終使用日は購入日以降にしてください" },
  );

export type ItemFormValues = z.infer<typeof itemFormSchema>;
export type FashionDetailsValues = z.infer<typeof fashionDetailsSchema>;
export type HaiaceDetailsValues = z.infer<typeof haiaceDetailsSchema>;
