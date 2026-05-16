"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deleteStorageFiles } from "@/lib/storage";
import type { UsageStatus } from "@/lib/validators/enums";

export type ActionResult = { error: string } | { success: true };

// ——— 登録 ——————————————————————————————————————————————
export async function createItem(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const itemId = formData.get("item_id") as string;
  const categoryCode = formData.get("category_code") as string;
  const marketplaceId = formData.get("marketplace_id") as string;

  // categories.id を code から解決
  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("code", categoryCode)
    .single();

  if (!category) return { error: "カテゴリが見つかりません" };

  const purchasePriceRaw = formData.get("purchase_price") as string;
  const shippingFeeRaw = formData.get("shipping_fee") as string;

  const itemPayload = {
    id: itemId,
    user_id: user.id,
    category_id: category.id,
    marketplace_id: marketplaceId,
    marketplace_other_name: (formData.get("marketplace_other_name") as string) || null,
    seller_name: (formData.get("seller_name") as string) || null,
    name: formData.get("name") as string,
    purchase_price: parseInt(purchasePriceRaw, 10) || 0,
    shipping_fee: parseInt(shippingFeeRaw, 10) || 0,
    purchase_date: formData.get("purchase_date") as string,
    memo: (formData.get("memo") as string) || null,
    usage_status: (formData.get("usage_status") as string) || "storing",
    last_used_at: (formData.get("last_used_at") as string) || null,
    storage_location: (formData.get("storage_location") as string) || null,
  };

  const { error: itemError } = await supabase.from("items").insert(itemPayload);
  if (itemError) return { error: itemError.message };

  // fashion_details
  if (categoryCode === "fashion") {
    const details = {
      item_id: itemId,
      item_type: (formData.get("fashion_item_type") as string) || null,
      size: (formData.get("fashion_size") as string) || null,
      brand: (formData.get("fashion_brand") as string) || null,
      color: (formData.get("fashion_color") as string) || null,
    };
    await supabase.from("fashion_details").insert(details);
  }

  // haiace_details
  if (categoryCode === "haiace") {
    const details = {
      item_id: itemId,
      install_status: (formData.get("haiace_install_status") as string) || "not_installed",
      road_legal: (formData.get("haiace_road_legal") as string) || "unknown",
    };
    const { error: hdError } = await supabase.from("haiace_details").insert(details);
    if (!hdError) {
      const positionIds = formData.getAll("haiace_position_ids") as string[];
      const purposeIds = formData.getAll("haiace_purpose_ids") as string[];
      if (positionIds.length > 0) {
        await supabase.from("haiace_part_positions").insert(positionIds.map((pid) => ({ item_id: itemId, position_id: pid })));
      }
      if (purposeIds.length > 0) {
        await supabase.from("haiace_part_purposes").insert(purposeIds.map((pid) => ({ item_id: itemId, purpose_id: pid })));
      }
    }
  }

  // item_photos（アップロード済みのパスを受け取る）
  const photoPaths = formData.getAll("photo_paths") as string[];
  const photoKinds = formData.getAll("photo_kinds") as string[];
  if (photoPaths.length > 0) {
    const photoRecords = photoPaths.map((path, idx) => ({
      item_id: itemId,
      storage_path: path,
      kind: photoKinds[idx] ?? "product",
      sort_order: idx,
    }));
    await supabase.from("item_photos").insert(photoRecords);
  }

  revalidatePath("/items");
  revalidatePath("/");
  redirect(`/items/${itemId}`);
}

// ——— 更新 ——————————————————————————————————————————————
export async function updateItem(itemId: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const categoryCode = formData.get("category_code") as string;
  const marketplaceId = formData.get("marketplace_id") as string;

  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("code", categoryCode)
    .single();

  if (!category) return { error: "カテゴリが見つかりません" };

  const { error: itemError } = await supabase
    .from("items")
    .update({
      category_id: category.id,
      marketplace_id: marketplaceId,
      marketplace_other_name: (formData.get("marketplace_other_name") as string) || null,
      seller_name: (formData.get("seller_name") as string) || null,
      name: formData.get("name") as string,
      purchase_price: parseInt(formData.get("purchase_price") as string, 10) || 0,
      shipping_fee: parseInt(formData.get("shipping_fee") as string, 10) || 0,
      purchase_date: formData.get("purchase_date") as string,
      memo: (formData.get("memo") as string) || null,
      usage_status: (formData.get("usage_status") as string) || "storing",
      last_used_at: (formData.get("last_used_at") as string) || null,
      storage_location: (formData.get("storage_location") as string) || null,
    })
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (itemError) return { error: itemError.message };

  // fashion_details: upsert
  if (categoryCode === "fashion") {
    await supabase.from("fashion_details").upsert({
      item_id: itemId,
      item_type: (formData.get("fashion_item_type") as string) || null,
      size: (formData.get("fashion_size") as string) || null,
      brand: (formData.get("fashion_brand") as string) || null,
      color: (formData.get("fashion_color") as string) || null,
    });
  }

  // haiace_details: upsert + 多対多再構築
  if (categoryCode === "haiace") {
    await supabase.from("haiace_details").upsert({
      item_id: itemId,
      install_status: (formData.get("haiace_install_status") as string) || "not_installed",
      road_legal: (formData.get("haiace_road_legal") as string) || "unknown",
    });
    await supabase.from("haiace_part_positions").delete().eq("item_id", itemId);
    await supabase.from("haiace_part_purposes").delete().eq("item_id", itemId);
    const positionIds = formData.getAll("haiace_position_ids") as string[];
    const purposeIds = formData.getAll("haiace_purpose_ids") as string[];
    if (positionIds.length > 0) {
      await supabase.from("haiace_part_positions").insert(positionIds.map((pid) => ({ item_id: itemId, position_id: pid })));
    }
    if (purposeIds.length > 0) {
      await supabase.from("haiace_part_purposes").insert(purposeIds.map((pid) => ({ item_id: itemId, purpose_id: pid })));
    }
  }

  // 新規写真の追加
  const newPhotoPaths = formData.getAll("new_photo_paths") as string[];
  const newPhotoKinds = formData.getAll("new_photo_kinds") as string[];
  if (newPhotoPaths.length > 0) {
    const { data: existing } = await supabase
      .from("item_photos")
      .select("sort_order")
      .eq("item_id", itemId)
      .order("sort_order", { ascending: false })
      .limit(1);
    const startOrder = existing?.[0]?.sort_order != null ? existing[0].sort_order + 1 : 0;
    await supabase.from("item_photos").insert(
      newPhotoPaths.map((path, idx) => ({
        item_id: itemId,
        storage_path: path,
        kind: newPhotoKinds[idx] ?? "product",
        sort_order: startOrder + idx,
      })),
    );
  }

  revalidatePath(`/items/${itemId}`);
  revalidatePath("/items");
  revalidatePath("/");
  redirect(`/items/${itemId}`);
}

// ——— 使用状況の更新 ——————————————————————————————————
export async function updateUsageStatus(
  itemId: string,
  newStatus: UsageStatus,
  prevStatus: UsageStatus,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { error } = await supabase
    .from("items")
    .update({ usage_status: newStatus })
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  await supabase.from("usage_logs").insert({
    item_id: itemId,
    event_type: "status_changed",
    from_status: prevStatus,
    to_status: newStatus,
  });

  revalidatePath(`/items/${itemId}`);
  revalidatePath("/items");
  revalidatePath("/");
  revalidatePath("/listing-candidates");
  return { success: true };
}

// ——— 「使った」ボタン ——————————————————————————————————
export async function markUsed(itemId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const today = new Date().toISOString().split("T")[0];

  const { error } = await supabase
    .from("items")
    .update({ last_used_at: today, usage_status: "in_use" })
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  await supabase.from("usage_logs").insert({
    item_id: itemId,
    event_type: "used",
  });

  revalidatePath(`/items/${itemId}`);
  revalidatePath("/listing-candidates");
  return { success: true };
}

// ——— 出品候補への手動追加/除外 ——————————————————————————————
export async function toggleForceListingCandidate(
  itemId: string,
  force: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { error } = await supabase
    .from("items")
    .update({ force_listing_candidate: force })
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/items/${itemId}`);
  revalidatePath("/listing-candidates");
  revalidatePath("/");
  return { success: true };
}

// ——— 論理削除 ——————————————————————————————————————————
export async function softDeleteItem(itemId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { error } = await supabase
    .from("items")
    .update({ is_deleted: true })
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/items");
  revalidatePath("/");
  redirect("/items");
}

// ——— ゴミ箱から復元 ——————————————————————————————————
export async function restoreItem(itemId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { error } = await supabase
    .from("items")
    .update({ is_deleted: false })
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/items/trash");
  revalidatePath("/items");
  return { success: true };
}

// ——— 完全削除 ——————————————————————————————————————————
export async function permanentlyDeleteItem(itemId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  // Storage ファイルを先に削除
  const { data: photos } = await supabase
    .from("item_photos")
    .select("storage_path")
    .eq("item_id", itemId);

  if (photos && photos.length > 0) {
    await deleteStorageFiles(photos.map((p) => p.storage_path));
  }

  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", user.id)
    .eq("is_deleted", true);

  if (error) return { error: error.message };

  revalidatePath("/items/trash");
  return { success: true };
}

// ——— 写真削除 ——————————————————————————————————————————
export async function deleteItemPhoto(photoId: string, storagePath: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  await deleteStorageFiles([storagePath]);
  const { error } = await supabase.from("item_photos").delete().eq("id", photoId);
  if (error) return { error: error.message };

  revalidatePath("/items");
  return { success: true };
}
