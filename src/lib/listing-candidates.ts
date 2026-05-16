import { differenceInCalendarDays } from "date-fns";
import type { UsageStatus } from "@/lib/validators/enums";
import type { CategoryCode } from "@/lib/validators/enums";

// ============================================================
// 設定型と既定値
// ============================================================

export type ListingCandidateSettings = {
  thresholdDays: number;
  includedStatuses: UsageStatus[];
  minPrice: number | null;
  maxPrice: number | null;
  // null/空配列 = 全カテゴリ
  categoryCodes: CategoryCode[] | null;
};

// "unused" は強制候補と同様に常に対象。それ以外は閾値日数で判定する。
export const DEFAULT_LISTING_CANDIDATE_SETTINGS: ListingCandidateSettings = {
  thresholdDays: 180,
  includedStatuses: ["unused"],
  minPrice: null,
  maxPrice: null,
  categoryCodes: null,
};

// 出品候補から構造的に除外するステータス
// （売却済み・処分済みなど「もう出品できないもの」）
const HARD_EXCLUDED_STATUSES: ReadonlyArray<UsageStatus> = [
  "listing",
  "sold",
  "disposed",
];

// ============================================================
// 環境変数フォールバック（後方互換）
// ============================================================

export function getListingCandidateThresholdDays(): number {
  const raw = process.env.LISTING_CANDIDATE_THRESHOLD_DAYS;
  if (!raw) return DEFAULT_LISTING_CANDIDATE_SETTINGS.thresholdDays;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0
    ? n
    : DEFAULT_LISTING_CANDIDATE_SETTINGS.thresholdDays;
}

// ============================================================
// 判定ロジック
// ============================================================

export type ListingCandidateInput = {
  usage_status: UsageStatus;
  last_used_at: string | null;
  purchase_price?: number | null;
  // category は join で読まれる想定 (code を持つ)。null/undefined もありうる。
  category?: { code?: string | null } | null;
  // 手動オーバーライド
  force_listing_candidate?: boolean | null;
};

export function isListingCandidate(
  item: ListingCandidateInput,
  now: Date = new Date(),
  settings: ListingCandidateSettings = DEFAULT_LISTING_CANDIDATE_SETTINGS,
): boolean {
  // 構造的除外（出品済み・売却済みなど）は手動フラグでも上書き不可
  if (HARD_EXCLUDED_STATUSES.includes(item.usage_status)) return false;

  // 手動オーバーライド: 強制で候補入り
  if (item.force_listing_candidate) return true;

  // 価格フィルタ
  const price = item.purchase_price ?? 0;
  if (settings.minPrice != null && price < settings.minPrice) return false;
  if (settings.maxPrice != null && price > settings.maxPrice) return false;

  // カテゴリフィルタ
  if (settings.categoryCodes && settings.categoryCodes.length > 0) {
    const code = item.category?.code;
    if (!code || !settings.categoryCodes.includes(code as CategoryCode)) return false;
  }

  // 含めるステータスに該当しない場合は除外
  if (!settings.includedStatuses.includes(item.usage_status)) return false;

  // "unused" は last_used_at に関係なく対象
  if (item.usage_status === "unused") return true;

  // それ以外は last_used_at が閾値日数以上前なら対象
  if (!item.last_used_at) return false;
  const lastUsed = new Date(item.last_used_at);
  return differenceInCalendarDays(now, lastUsed) >= settings.thresholdDays;
}
