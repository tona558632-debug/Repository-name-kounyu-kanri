import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsageStatusBadge } from "@/components/usage-status-badge";
import { EmptyState } from "@/components/empty-state";
import { ItemListFilters } from "@/components/item-list-filters";
import { formatDate } from "@/lib/date";
import { Package, Plus, Trash2 } from "lucide-react";

export const metadata = { title: "アイテム一覧" };

type SearchParams = Promise<{
  q?: string;
  status?: string;
  marketplace?: string;
  sort?: string;
  tab?: string;
}>;

export default async function ItemsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: marketplaces } = await supabase
    .from("marketplaces")
    .select("id, name, code")
    .eq("is_active", true)
    .order("sort_order");

  let query = supabase
    .from("items")
    .select("id, name, usage_status, purchase_price, purchase_date, last_used_at, category:categories(name, code), marketplace:marketplaces(name)")
    .eq("is_deleted", false);

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,seller_name.ilike.%${params.q}%,memo.ilike.%${params.q}%,storage_location.ilike.%${params.q}%`);
  }
  if (params.status) query = query.eq("usage_status", params.status);
  if (params.marketplace) query = query.eq("marketplace_id", params.marketplace);

  const sortField = params.sort ?? "created_at";
  const validSorts = ["created_at", "purchase_date", "purchase_price", "last_used_at"] as const;
  const sort = validSorts.includes(sortField as (typeof validSorts)[number]) ? sortField : "created_at";
  query = query.order(sort, { ascending: false });

  const { data: allItems } = await query;
  const items = allItems ?? [];

  const fashionItems = items.filter((i) => (i.category as { code: string } | undefined)?.code === "fashion");
  const haiaceItems = items.filter((i) => (i.category as { code: string } | undefined)?.code === "haiace");
  const otherItems = items.filter((i) => !["fashion", "haiace"].includes((i.category as { code: string } | undefined)?.code ?? ""));

  const activeTab = params.tab ?? "all";

  function ItemList({ list }: { list: typeof items }) {
    if (list.length === 0) {
      return (
        <EmptyState
          icon={Package}
          title="アイテムがありません"
          description={params.q || params.status || params.marketplace ? "条件に合うアイテムが見つかりませんでした" : "「+登録」ボタンから追加しましょう"}
        />
      );
    }
    return (
      <div className="space-y-2">
        {list.map((item) => (
          <Link key={item.id} href={`/items/${item.id}`}>
            <Card className="hover:bg-accent/50 transition-colors">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        ¥{(item.purchase_price ?? 0).toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{formatDate(item.purchase_date)}</span>
                      {(item.marketplace as { name: string } | undefined) && (
                        <>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{(item.marketplace as { name: string }).name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <UsageStatusBadge status={item.usage_status} />
                    {(item.category as { name: string } | undefined) && (
                      <Badge variant="outline" className="text-[10px] h-4">{(item.category as { name: string }).name}</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="container max-w-lg py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">アイテム一覧</h1>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="icon">
            <Link href="/items/trash"><Trash2 className="h-4 w-4" /></Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/items/new"><Plus className="h-4 w-4 mr-1" />登録</Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={null}>
        <ItemListFilters marketplaces={marketplaces ?? []} currentParams={params} />
      </Suspense>

      <Tabs defaultValue={activeTab}>
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">すべて ({items.length})</TabsTrigger>
          <TabsTrigger value="fashion" className="flex-1">ファッション ({fashionItems.length})</TabsTrigger>
          <TabsTrigger value="haiace" className="flex-1">ハイエース ({haiaceItems.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all"><ItemList list={items} /></TabsContent>
        <TabsContent value="fashion"><ItemList list={fashionItems} /></TabsContent>
        <TabsContent value="haiace"><ItemList list={haiaceItems} /></TabsContent>
      </Tabs>
    </div>
  );
}
