// 出品先サイトごとの文字数制限・テンプレート定数
// 要件 R-07: サイト仕様変更時はこのファイルだけ更新で済むように一元管理

export type ListingSiteCode =
  | "mercari"
  | "yahoo_fril"
  | "rakuma"
  | "paypay_fril"
  | "yahoo_auction";

export type ListingSiteSpec = {
  code: ListingSiteCode;
  name: string;
  titleMaxLength: number;
  descriptionMaxLength: number;
};

// 文字数上限は2026年時点の公開仕様目安。実値はコメント参照元を都度確認すること。
export const listingSiteSpecs: Record<ListingSiteCode, ListingSiteSpec> = {
  mercari: {
    code: "mercari",
    name: "メルカリ",
    titleMaxLength: 40,
    descriptionMaxLength: 1000,
  },
  yahoo_fril: {
    code: "yahoo_fril",
    name: "ヤフーフリマ",
    titleMaxLength: 65,
    descriptionMaxLength: 1000,
  },
  rakuma: {
    code: "rakuma",
    name: "ラクマ",
    titleMaxLength: 65,
    descriptionMaxLength: 1000,
  },
  paypay_fril: {
    code: "paypay_fril",
    name: "PayPayフリマ",
    titleMaxLength: 65,
    descriptionMaxLength: 1000,
  },
  yahoo_auction: {
    code: "yahoo_auction",
    name: "ヤフオク",
    titleMaxLength: 65,
    descriptionMaxLength: 3000,
  },
};

export const PRICE_RANGE_LOWER_RATIO = 0.4;
export const PRICE_RANGE_UPPER_RATIO = 0.7;

export function suggestPriceRange(purchasePrice: number): {
  min: number;
  max: number;
} {
  const min = Math.max(300, Math.floor(purchasePrice * PRICE_RANGE_LOWER_RATIO));
  const max = Math.max(min, Math.floor(purchasePrice * PRICE_RANGE_UPPER_RATIO));
  return { min, max };
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)) + "…";
}
