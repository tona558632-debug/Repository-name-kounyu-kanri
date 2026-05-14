import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSignedUrls } from "@/lib/storage";
import { formatDate, formatDatetime } from "@/lib/date";
import { usageStatusLabels, fashionItemTypeLabels, haiaceInstallStatusLabels, haiaceRoadLegalLabels } from "@/lib/validators/enums";
import { UsageStatusBadge } from "@/components/usage-status-badge";
import { StatusChangeButton } from "@/components/status-change-button";
import { MarkUsedButton } from "@/components/mark-used-button";
import { DeleteItemButton } from "@/components/delete-item-button";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Edit, Tag, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import type { Item } from "@/types/items";

export const metadata = { title: "アイテム詳細" };

type Props = { params: Promise<{ id: string }> };

async function fetchItem(id: string): Promise<Item | null> {
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("items")
    .select(`
      *,
      category:categories(*),
      marketplace:marketplaces(*),
      photos:item_photos(*),
      fashion_details(*),
      haiace_details(*)
    `)
    .eq("id", id)
    .eq("is_deleted", false)
    .single();

  if (!item) return null;

  // 取付位置・用途を別途取得
  const [{ data: positions }, { data: purposes }] = await Promise.all([
    supabase.from("haiace_part_positions").select("position:haiace_positions(*)").eq("item_id", id),
    supabase.from("haiace_part_purposes").select("purpose:haiace_purposes(*)").eq("item_id", id),
  ]);

  if (item.haiace_details) {
    (item as Item).haiace_details = {
      ...(item.haiace_details as object),
      positions: (positions ?? []).map((r) => (r as { position: object }).position),
      purposes: (purposes ?? []).map((r) => (r as { purpose: object }).purpose),
    } as Item["haiace_details"];
  }

  return item as unknown as Item;
}

export default async function ItemDetailPage({ params }: Props) {
  const { id } = await params;
  const item = await fetchItem(id);
  if (!item) notFound();

  // 写真の署名付きURL取得
  const photoPaths = (item.photos ?? []).map((p) => p.storage_path);
  const signedUrls = photoPaths.length > 0 ? await getSignedUrls(photoPaths) : {};

  const productPhotos = (item.photos ?? []).filter((p) => p.kind === "product");
  const receiptPhotos = (item.photos ?? []).filter((p) => p.kind === "receipt");

  return (
    <div className="container max-w-lg py-4 space-y-4">
      {/* ヘッダ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/items" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold truncate max-w-[16rem]">{item.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="icon">
            <Link href={`/items/${item.id}/edit`}><Edit className="h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/items/${item.id}/listing-text`}><Tag className="h-3.5 w-3.5 mr-1" />出品文</Link>
          </Button>
        </div>
      </div>

      {/* ステータスと操作 */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <UsageStatusBadge status={item.usage_status} />
            <div className="flex gap-2">
              <MarkUsedButton itemId={item.id} />
              <DeleteItemButton itemId={item.id} />
            </div>
          </div>
          <StatusChangeButton itemId={item.id} currentStatus={item.usage_status} />
        </CardContent>
      </Card>

      {/* 写真 */}
      {productPhotos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {productPhotos.map((photo) => (
            <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-muted relative">
              {signedUrls[photo.storage_path] ? (
                <Image src={signedUrls[photo.storage_path]} alt={item.name} fill className="object-cover" sizes="33vw" />
              ) : (
                <div className="flex items-center justify-center h-full"><ImageIcon className="h-8 w-8 text-muted-foreground" /></div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 基本情報 */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <DetailRow label="カテゴリ" value={item.category?.name} />
          <DetailRow label="購入元" value={item.marketplace?.name + (item.marketplace_other_name ? ` (${item.marketplace_other_name})` : "")} />
          {item.seller_name && <DetailRow label="店舗 / 出品者" value={item.seller_name} />}
          <Separator />
          <DetailRow label="購入金額" value={`¥${item.purchase_price.toLocaleString()}`} />
          {item.shipping_fee > 0 && <DetailRow label="送料" value={`¥${item.shipping_fee.toLocaleString()}`} />}
          <DetailRow label="合計" value={`¥${(item.purchase_price + item.shipping_fee).toLocaleString()}`} />
          <Separator />
          <DetailRow label="購入日" value={formatDate(item.purchase_date)} />
          {item.last_used_at && <DetailRow label="最終使用日" value={formatDate(item.last_used_at)} />}
          {item.storage_location && <DetailRow label="保管場所" value={item.storage_location} />}
          {item.memo && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">メモ</p>
              <p className="text-sm whitespace-pre-wrap">{item.memo}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ファッション詳細 */}
      {item.fashion_details && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="font-medium text-sm">ファッション詳細</h2>
            {item.fashion_details.item_type && (
              <DetailRow label="種別" value={fashionItemTypeLabels[item.fashion_details.item_type] ?? item.fashion_details.item_type} />
            )}
            {item.fashion_details.size && <DetailRow label="サイズ" value={item.fashion_details.size} />}
            {item.fashion_details.brand && <DetailRow label="ブランド" value={item.fashion_details.brand} />}
            {item.fashion_details.color && <DetailRow label="色" value={item.fashion_details.color} />}
          </CardContent>
        </Card>
      )}

      {/* ハイエース詳細 */}
      {item.haiace_details && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="font-medium text-sm">ハイエース詳細</h2>
            <DetailRow label="取付状態" value={haiaceInstallStatusLabels[item.haiace_details.install_status]} />
            <DetailRow label="車検対応" value={haiaceRoadLegalLabels[item.haiace_details.road_legal]} />
            {item.haiace_details.positions.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">取付位置</p>
                <div className="flex flex-wrap gap-1">
                  {item.haiace_details.positions.map((p) => (
                    <Badge key={p.id} variant="secondary" className="text-xs">{p.name}</Badge>
                  ))}
                </div>
              </div>
            )}
            {item.haiace_details.purposes.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">用途</p>
                <div className="flex flex-wrap gap-1">
                  {item.haiace_details.purposes.map((p) => (
                    <Badge key={p.id} variant="secondary" className="text-xs">{p.name}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* レシート */}
      {receiptPhotos.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="font-medium text-sm mb-3">レシート / 取引画面</h2>
            <div className="grid grid-cols-3 gap-2">
              {receiptPhotos.map((photo) => (
                <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-muted relative">
                  {signedUrls[photo.storage_path] ? (
                    <Image src={signedUrls[photo.storage_path]} alt="レシート" fill className="object-cover" sizes="33vw" />
                  ) : (
                    <div className="flex items-center justify-center h-full"><ImageIcon className="h-6 w-6 text-muted-foreground" /></div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center pb-2">
        登録: {formatDatetime(item.created_at)} / 更新: {formatDatetime(item.updated_at)}
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-right">{value}</span>
    </div>
  );
}
