import { createClient } from "@/lib/supabase/server";
import { ItemForm } from "@/components/item-form";
import { createItem } from "../actions";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "新規登録" };

export default async function NewItemPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: marketplaces }, { data: haiacePositions }, { data: haiacePurposes }] = await Promise.all([
    supabase.from("marketplaces").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("haiace_positions").select("*").order("sort_order"),
    supabase.from("haiace_purposes").select("*").order("sort_order"),
  ]);

  return (
    <div className="container max-w-lg py-4">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/items" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold">新規登録</h1>
      </div>
      <ItemForm
        userId={user!.id}
        marketplaces={marketplaces ?? []}
        haiacePositions={haiacePositions ?? []}
        haiacePurposes={haiacePurposes ?? []}
        action={createItem}
        submitLabel="登録する"
      />
    </div>
  );
}
