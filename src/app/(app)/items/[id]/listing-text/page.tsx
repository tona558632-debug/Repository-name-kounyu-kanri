import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ChevronLeft } from "lucide-react";
import { ListingTextGenerator } from "@/components/listing-text-generator";
import type { Item } from "@/types/items";

export const metadata = { title: "出品テキスト生成" };

type Props = { params: Promise<{ id: string }> };

export default async function ListingTextPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: rawItem } = await supabase
    .from("items")
    .select("*, category:categories(*), marketplace:marketplaces(*), fashion_details(*), haiace_details(*)")
    .eq("id", id)
    .eq("is_deleted", false)
    .single();

  if (!rawItem) notFound();

  const [{ data: positions }, { data: purposes }] = await Promise.all([
    supabase.from("haiace_part_positions").select("position:haiace_positions(*)").eq("item_id", id),
    supabase.from("haiace_part_purposes").select("purpose:haiace_purposes(*)").eq("item_id", id),
  ]);

  const item: Item = {
    ...(rawItem as unknown as Item),
    haiace_details: rawItem.haiace_details
      ? {
          ...(rawItem.haiace_details as object),
          positions: (positions ?? []).map((r) => (r as { position: object }).position),
          purposes: (purposes ?? []).map((r) => (r as { purpose: object }).purpose),
        } as Item["haiace_details"]
      : null,
  };

  return (
    <div className="container max-w-lg py-4 space-y-4">
      <div className="flex items-center gap-2">
        <Link href={`/items/${id}`} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold">出品テキスト生成</h1>
      </div>
      <ListingTextGenerator item={item} />
    </div>
  );
}
