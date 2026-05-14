import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ItemForm } from "@/components/item-form";
import { updateItem } from "../../actions";
import { ChevronLeft } from "lucide-react";
import type { Item } from "@/types/items";

export const metadata = { title: "編集" };

type Props = { params: Promise<{ id: string }> };

export default async function EditItemPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rawItem } = await supabase
    .from("items")
    .select("*, category:categories(*), marketplace:marketplaces(*), photos:item_photos(*), fashion_details(*), haiace_details(*)")
    .eq("id", id)
    .eq("is_deleted", false)
    .single();

  if (!rawItem) notFound();

  const [{ data: positions }, { data: purposes }, { data: marketplaces }, { data: haiacePositions }, { data: haiacePurposes }] =
    await Promise.all([
      supabase.from("haiace_part_positions").select("position:haiace_positions(*)").eq("item_id", id),
      supabase.from("haiace_part_purposes").select("purpose:haiace_purposes(*)").eq("item_id", id),
      supabase.from("marketplaces").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("haiace_positions").select("*").order("sort_order"),
      supabase.from("haiace_purposes").select("*").order("sort_order"),
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

  async function actionWithId(formData: FormData) {
    "use server";
    return updateItem(id, formData);
  }

  return (
    <div className="container max-w-lg py-4">
      <div className="flex items-center gap-2 mb-4">
        <Link href={`/items/${id}`} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold">編集</h1>
      </div>
      <ItemForm
        userId={user!.id}
        marketplaces={marketplaces ?? []}
        haiacePositions={haiacePositions ?? []}
        haiacePurposes={haiacePurposes ?? []}
        item={item}
        action={actionWithId}
        submitLabel="更新する"
      />
    </div>
  );
}
