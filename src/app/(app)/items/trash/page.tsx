import { createClient } from "@/lib/supabase/server";
import { TrashItemCard } from "@/components/trash-item-card";
import { EmptyState } from "@/components/empty-state";
import { ChevronLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/date";

export const metadata = { title: "ゴミ箱" };

export default async function TrashPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("items")
    .select("id, name, purchase_price, updated_at, category:categories(name)")
    .eq("is_deleted", true)
    .order("updated_at", { ascending: false });

  return (
    <div className="container max-w-lg py-4 space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/items" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold">ゴミ箱</h1>
      </div>
      <p className="text-xs text-muted-foreground">削除したアイテムを復元または完全削除できます。</p>

      {(!items || items.length === 0) ? (
        <EmptyState icon={Trash2} title="ゴミ箱は空です" />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <TrashItemCard
              key={item.id}
              id={item.id}
              name={item.name}
              categoryName={(item.category as { name: string } | undefined)?.name}
              purchasePrice={item.purchase_price}
              deletedAt={formatDate(item.updated_at)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
