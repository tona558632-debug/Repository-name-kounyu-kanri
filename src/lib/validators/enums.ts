import { z } from "zod";

export const usageStatusValues = [
  "in_use",
  "storing",
  "unused",
  "listing",
  "sold",
  "disposed",
] as const;
export type UsageStatus = (typeof usageStatusValues)[number];
export const usageStatusEnum = z.enum(usageStatusValues);

export const usageStatusLabels: Record<UsageStatus, string> = {
  in_use: "使用中",
  storing: "保管中",
  unused: "未使用",
  listing: "出品中",
  sold: "売却済み",
  disposed: "処分済み",
};

export const fashionItemTypeValues = [
  "tops",
  "bottoms",
  "outer",
  "shoes",
  "accessory",
  "other",
] as const;
export type FashionItemType = (typeof fashionItemTypeValues)[number];
export const fashionItemTypeEnum = z.enum(fashionItemTypeValues);

export const fashionItemTypeLabels: Record<FashionItemType, string> = {
  tops: "トップス",
  bottoms: "ボトムス",
  outer: "アウター",
  shoes: "シューズ",
  accessory: "小物",
  other: "その他",
};

export const haiaceInstallStatusValues = [
  "installed",
  "removed",
  "not_installed",
] as const;
export type HaiaceInstallStatus = (typeof haiaceInstallStatusValues)[number];
export const haiaceInstallStatusEnum = z.enum(haiaceInstallStatusValues);

export const haiaceInstallStatusLabels: Record<HaiaceInstallStatus, string> = {
  installed: "取付済み",
  removed: "取り外し済み",
  not_installed: "未取付",
};

export const haiaceRoadLegalValues = [
  "compliant",
  "non_compliant",
  "unknown",
] as const;
export type HaiaceRoadLegal = (typeof haiaceRoadLegalValues)[number];
export const haiaceRoadLegalEnum = z.enum(haiaceRoadLegalValues);

export const haiaceRoadLegalLabels: Record<HaiaceRoadLegal, string> = {
  compliant: "車検対応",
  non_compliant: "車検非対応",
  unknown: "不明",
};

export const photoKindValues = ["product", "receipt"] as const;
export type PhotoKind = (typeof photoKindValues)[number];
export const photoKindEnum = z.enum(photoKindValues);

export const categoryCodeValues = ["fashion", "haiace", "other"] as const;
export type CategoryCode = (typeof categoryCodeValues)[number];
export const categoryCodeEnum = z.enum(categoryCodeValues);

export const categoryCodeLabels: Record<CategoryCode, string> = {
  fashion: "ファッション",
  haiace: "ハイエースカスタム",
  other: "その他",
};

export const usageLogEventTypeValues = ["used", "status_changed"] as const;
export type UsageLogEventType = (typeof usageLogEventTypeValues)[number];
export const usageLogEventTypeEnum = z.enum(usageLogEventTypeValues);
