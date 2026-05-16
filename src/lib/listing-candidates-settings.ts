import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_LISTING_CANDIDATE_SETTINGS,
  getListingCandidateThresholdDays,
  type ListingCandidateSettings,
} from "@/lib/listing-candidates";
import { usageStatusValues, categoryCodeValues, type UsageStatus, type CategoryCode } from "@/lib/validators/enums";

// DB の生レコード型（types.ts がプレースホルダなので手書き）
type Row = {
  user_id: string;
  threshold_days: number;
  included_statuses: string[];
  min_price: number | null;
  max_price: number | null;
  category_codes: string[] | null;
};

function rowToSettings(row: Row | null | undefined): ListingCandidateSettings {
  if (!row) {
    // env 変数 LISTING_CANDIDATE_THRESHOLD_DAYS を初期値として尊重
    return {
      ...DEFAULT_LISTING_CANDIDATE_SETTINGS,
      thresholdDays: getListingCandidateThresholdDays(),
    };
  }
  const included = (row.included_statuses ?? []).filter((s): s is UsageStatus =>
    (usageStatusValues as readonly string[]).includes(s),
  );
  const categories = row.category_codes
    ? row.category_codes.filter((c): c is CategoryCode =>
        (categoryCodeValues as readonly string[]).includes(c),
      )
    : null;
  return {
    thresholdDays: row.threshold_days,
    includedStatuses: included.length > 0 ? included : ["unused"],
    minPrice: row.min_price,
    maxPrice: row.max_price,
    categoryCodes: categories && categories.length > 0 ? categories : null,
  };
}

/**
 * 現在ログイン中ユーザーの出品候補設定を取得する。
 * 未保存（行なし）の場合は環境変数 or デフォルトを返す。
 */
export async function loadListingCandidateSettings(): Promise<ListingCandidateSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return rowToSettings(null);

  const { data } = await supabase
    .from("listing_candidate_settings")
    .select("user_id, threshold_days, included_statuses, min_price, max_price, category_codes")
    .eq("user_id", user.id)
    .maybeSingle();

  return rowToSettings(data as Row | null);
}
