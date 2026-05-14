import { differenceInCalendarDays } from "date-fns";
import type { UsageStatus } from "@/lib/validators/enums";

const DEFAULT_THRESHOLD_DAYS = 180;

export function getListingCandidateThresholdDays(): number {
  const raw = process.env.LISTING_CANDIDATE_THRESHOLD_DAYS;
  if (!raw) return DEFAULT_THRESHOLD_DAYS;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_THRESHOLD_DAYS;
}

const EXCLUDED_STATUSES: ReadonlyArray<UsageStatus> = [
  "listing",
  "sold",
  "disposed",
];

type ListingCandidateInput = {
  usage_status: UsageStatus;
  last_used_at: string | null;
};

export function isListingCandidate(
  item: ListingCandidateInput,
  now: Date = new Date(),
  thresholdDays: number = getListingCandidateThresholdDays(),
): boolean {
  if (EXCLUDED_STATUSES.includes(item.usage_status)) return false;
  if (item.usage_status === "unused") return true;
  if (!item.last_used_at) return false;
  const lastUsed = new Date(item.last_used_at);
  return differenceInCalendarDays(now, lastUsed) >= thresholdDays;
}
