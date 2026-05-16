import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isListingCandidate } from "@/lib/listing-candidates";
import { loadListingCandidateSettings } from "@/lib/listing-candidates-settings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { UsageStatusBadge } from "@/components/usage-status-badge";
import { formatDate } from "@/lib/date";
import { differenceInCalendarDays } from "date-fns";
import { Tag, Package } from "lucide-react";

export const metadata = { title: "出品候補" };

export default async function ListingCandidatesPage() {
  const supabase = await createClient();
  const settings = await loadListingCandidateSettings();
  const now = new Date();

  const { data: items } = await supabase
    .from("items")
    .select("id, name, usage_status, last_used_at, purchase_price, purchase_date, force_listing_candidate, category:categories(name, code), marketplace:marketplaces(name)")
    .eq("is_deleted", false)
    .order("last_used_at", { ascending: true, nullsFirst: true });

  const candidates = (items ?? []).filter((i) =>
    isListingCandidate(i as Parameters<typeof isListingCandidate>[0], now, settings),
  );

  function daysSinceUsed(last_used_at: string | null): string {
    if (!last_used_at) return "使用記録なし";
    const d = differenceInCalendarDays(now, new Date(last_used_at));
    return `${d}日前に使用`;
  }

  return (
    <div className="container max-w-lg py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2"><Tag className="h-5 w-5" />出品候補</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            設定した条件（{settings.thresholdDays}日 / {settings.includedStatuses.length}ステータス）に該当
          </p>
        </div>
        <Badge variant="secondary">{candidates.length}件</Badge>
      </div>

      {candidates.length === 0 ? (
        <EmptyState
          icon={Package}
          title="出品候補はありません 🎉"
          description="すべてのアイテムが活用されています"
        />
      ) : (
        <div className="space-y-2">
          {candidates.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap text-xs text-muted-foreground">
                      <span>¥{(item.purchase_price ?? 0).toLocaleString()}</span>
                      <span>·</span>
                      <span>{formatDate(item.purchase_date)}</span>
                      <span>·</span>
                      <span className={item.usage_status === "unused" ? "text-orange-600 font-medium" : ""}>
                        {item.usage_status === "unused" ? "未使用" : daysSinceUsed(item.last_used_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <UsageStatusBadge status={item.usage_status} />
                    <div className="flex gap-1">
                      <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                        <Link href={`/items/${item.id}`}>詳細</Link>
                      </Button>
                      <Button asChild size="sm" className="h-7 text-xs">
                        <Link href={`/items/${item.id}/listing-text`}>出品文</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
