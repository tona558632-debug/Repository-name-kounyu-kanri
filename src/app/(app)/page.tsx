import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isListingCandidate } from "@/lib/listing-candidates";
import { loadListingCandidateSettings } from "@/lib/listing-candidates-settings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UsageStatusBadge } from "@/components/usage-status-badge";
import { formatDate } from "@/lib/date";
import { Package, Plus, Tag, TrendingDown, ShoppingBag } from "lucide-react";

export const metadata = { title: "ホーム" };

export default async function HomePage() {
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("items")
    .select("id, name, usage_status, last_used_at, purchase_price, force_listing_candidate, category:categories(name, code), created_at")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  const safeItems = items ?? [];
  const listingSettings = await loadListingCandidateSettings();
  const candidateCount = safeItems.filter((i) => isListingCandidate(i as Parameters<typeof isListingCandidate>[0], new Date(), listingSettings)).length;

  const statusCounts = safeItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.usage_status] = (acc[item.usage_status] ?? 0) + 1;
    return acc;
  }, {});

  const totalValue = safeItems
    .filter((i) => !["sold", "disposed"].includes(i.usage_status))
    .reduce((sum, i) => sum + (i.purchase_price ?? 0), 0);

  const recent = safeItems.slice(0, 5);

  return (
    <div className="container max-w-lg py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          <h1 className="text-xl font-bold">在庫管理</h1>
        </div>
        <Button asChild size="sm">
          <Link href="/items/new"><Plus className="h-4 w-4 mr-1" />登録</Link>
        </Button>
      </div>

      {/* サマリカード */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">総アイテム数</p>
            <p className="text-2xl font-bold">{safeItems.length}<span className="text-sm font-normal ml-1">件</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">出品候補</p>
                <p className="text-2xl font-bold text-orange-600">{candidateCount}<span className="text-sm font-normal ml-1">件</span></p>
              </div>
              <Tag className="h-4 w-4 text-orange-600 mt-1" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">在庫総額</p>
                <p className="text-lg font-bold">¥{totalValue.toLocaleString()}</p>
              </div>
              <ShoppingBag className="h-4 w-4 text-muted-foreground mt-1" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">未使用</p>
                <p className="text-2xl font-bold">{statusCounts["unused"] ?? 0}<span className="text-sm font-normal ml-1">件</span></p>
              </div>
              <TrendingDown className="h-4 w-4 text-muted-foreground mt-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 出品候補へのリンク */}
      {candidateCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-orange-800">出品候補が {candidateCount} 件あります</p>
              <p className="text-xs text-orange-600 mt-0.5">設定条件に該当（{listingSettings.thresholdDays}日基準）</p>
            </div>
            <Button asChild variant="outline" size="sm" className="border-orange-300 text-orange-700 hover:bg-orange-100">
              <Link href="/listing-candidates">確認する</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 最近登録したアイテム */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">最近登録したアイテム</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/items">すべて見る</Link>
          </Button>
        </div>
        {recent.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">まだ登録がありません</p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/items/new"><Plus className="h-4 w-4 mr-1" />最初のアイテムを登録</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recent.map((item) => (
              <Link key={item.id} href={`/items/${item.id}`}>
                <Card className="hover:bg-accent/50 transition-colors">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(item.category as { name: string } | undefined) && (
                        <Badge variant="outline" className="text-xs">{(item.category as { name: string }).name}</Badge>
                      )}
                      <UsageStatusBadge status={item.usage_status as string} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
