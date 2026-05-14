"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { PhotoUploader } from "@/components/photo-uploader";
import { ScreenshotParser, type ParsedPurchase } from "@/components/screenshot-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  usageStatusValues, usageStatusLabels,
  fashionItemTypeValues, fashionItemTypeLabels,
  haiaceInstallStatusValues, haiaceInstallStatusLabels,
  haiaceRoadLegalValues, haiaceRoadLegalLabels,
  categoryCodeValues, categoryCodeLabels,
  type CategoryCode, type UsageStatus,
} from "@/lib/validators/enums";
import { todayInputDate } from "@/lib/date";
import type { Marketplace, HaiacePosition, HaiacePurpose, Item } from "@/types/items";

type Props = {
  userId: string;
  marketplaces: Marketplace[];
  haiacePositions: HaiacePosition[];
  haiacePurposes: HaiacePurpose[];
  item?: Item;
  action: (formData: FormData) => Promise<{ error: string } | { success: true }>;
  submitLabel?: string;
};

export function ItemForm({ userId, marketplaces, haiacePositions, haiacePurposes, item, action, submitLabel = "保存" }: Props) {
  const router = useRouter();
  const [itemId] = useState(item?.id ?? uuidv4());
  const [categoryCode, setCategoryCode] = useState<CategoryCode>(
    (item?.category?.code as CategoryCode) ?? "fashion",
  );
  const [marketplaceId, setMarketplaceId] = useState(item?.marketplace_id ?? "");
  const [selectedMarketplace, setSelectedMarketplace] = useState<Marketplace | undefined>(
    marketplaces.find((m) => m.id === item?.marketplace_id),
  );
  const [usageStatus, setUsageStatus] = useState<UsageStatus>((item?.usage_status as UsageStatus) ?? "storing");
  const [positionIds, setPositionIds] = useState<string[]>(
    item?.haiace_details?.positions.map((p) => p.id) ?? [],
  );
  const [purposeIds, setPurposeIds] = useState<string[]>(
    item?.haiace_details?.purposes.map((p) => p.id) ?? [],
  );
  const [uploadedPhotos, setUploadedPhotos] = useState<{ storagePath: string; kind: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI自動入力用の controlled state
  const [name, setName] = useState(item?.name ?? "");
  const [purchasePrice, setPurchasePrice] = useState<number | "">(item?.purchase_price ?? "");
  const [shippingFee, setShippingFee] = useState<number | "">(item?.shipping_fee ?? 0);
  const [purchaseDate, setPurchaseDate] = useState(item?.purchase_date ?? todayInputDate());
  const [sellerName, setSellerName] = useState(item?.seller_name ?? "");
  const [memo, setMemo] = useState(item?.memo ?? "");

  const isOtherMarketplace = selectedMarketplace?.is_other ?? false;
  const activeMarketplaces = marketplaces.filter((m) => m.is_active);

  // スクリーンショット解析後に呼ばれるコールバック
  function handleParsed(data: ParsedPurchase) {
    if (data.name) setName(data.name);
    if (data.purchase_price != null) setPurchasePrice(data.purchase_price);
    if (data.shipping_fee != null) setShippingFee(data.shipping_fee);
    if (data.purchase_date) setPurchaseDate(data.purchase_date);
    if (data.seller_name) setSellerName(data.seller_name);
    if (data.memo) setMemo(data.memo);
    if (data.marketplace_code) {
      const mp = marketplaces.find((m) => m.code === data.marketplace_code);
      if (mp) {
        setMarketplaceId(mp.id);
        setSelectedMarketplace(mp);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set("item_id", itemId);
    formData.set("category_code", categoryCode);
    formData.set("marketplace_id", marketplaceId);
    formData.set("usage_status", usageStatus);

    // 多対多
    formData.delete("haiace_position_ids");
    formData.delete("haiace_purpose_ids");
    positionIds.forEach((id) => formData.append("haiace_position_ids", id));
    purposeIds.forEach((id) => formData.append("haiace_purpose_ids", id));

    // 写真パス
    const pathKey = item ? "new_photo_paths" : "photo_paths";
    const kindKey = item ? "new_photo_kinds" : "photo_kinds";
    uploadedPhotos.forEach((p) => {
      formData.append(pathKey, p.storagePath);
      formData.append(kindKey, p.kind);
    });

    const result = await action(formData);
    if ("error" in result) {
      toast.error(result.error);
      setIsSubmitting(false);
    }
  }

  function togglePosition(id: string) {
    setPositionIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }
  function togglePurpose(id: string) {
    setPurposeIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-8">

      {/* AI自動入力ボタン */}
      <ScreenshotParser onParsed={handleParsed} />

      {/* カテゴリ */}
      <div className="space-y-2">
        <Label>カテゴリ <span className="text-destructive">*</span></Label>
        <div className="flex gap-2 flex-wrap">
          {categoryCodeValues.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setCategoryCode(code)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                categoryCode === code
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-input hover:bg-accent"
              }`}
            >
              {categoryCodeLabels[code]}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* 共通項目 */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">商品名 <span className="text-destructive">*</span></Label>
          <Input
            id="name" name="name" required maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="商品名を入力"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="purchase_price">購入金額 (円) <span className="text-destructive">*</span></Label>
            <Input
              id="purchase_price" name="purchase_price" type="number" min={0} required
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shipping_fee">送料 (円)</Label>
            <Input
              id="shipping_fee" name="shipping_fee" type="number" min={0}
              value={shippingFee}
              onChange={(e) => setShippingFee(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="purchase_date">購入日 <span className="text-destructive">*</span></Label>
          <Input
            id="purchase_date" name="purchase_date" type="date" required
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>購入元 <span className="text-destructive">*</span></Label>
          <Select value={marketplaceId} onValueChange={(val) => {
            setMarketplaceId(val);
            setSelectedMarketplace(marketplaces.find((m) => m.id === val));
          }}>
            <SelectTrigger>
              <SelectValue placeholder="購入元を選択" />
            </SelectTrigger>
            <SelectContent>
              {activeMarketplaces.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isOtherMarketplace && (
          <div className="space-y-1.5">
            <Label htmlFor="marketplace_other_name">購入元（自由入力） <span className="text-destructive">*</span></Label>
            <Input id="marketplace_other_name" name="marketplace_other_name" required defaultValue={item?.marketplace_other_name ?? ""} placeholder="例: eBay" />
          </div>
        )}
        {!isOtherMarketplace && <input type="hidden" name="marketplace_other_name" value="" />}

        <div className="space-y-1.5">
          <Label htmlFor="seller_name">店舗名 / 出品者名</Label>
          <Input
            id="seller_name" name="seller_name" maxLength={200}
            value={sellerName}
            onChange={(e) => setSellerName(e.target.value)}
            placeholder="任意"
          />
        </div>

        <div className="space-y-1.5">
          <Label>使用状況</Label>
          <Select value={usageStatus} onValueChange={(v) => setUsageStatus(v as UsageStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {usageStatusValues.map((s) => (
                <SelectItem key={s} value={s}>{usageStatusLabels[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="last_used_at">最終使用日</Label>
            <Input id="last_used_at" name="last_used_at" type="date" defaultValue={item?.last_used_at ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="storage_location">保管場所</Label>
            <Input id="storage_location" name="storage_location" defaultValue={item?.storage_location ?? ""} placeholder="例: クローゼット" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="memo">メモ</Label>
          <Textarea
            id="memo" name="memo" rows={3} maxLength={2000}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="購入理由・状態メモなど"
          />
        </div>
      </div>

      {/* ファッション固有 */}
      {categoryCode === "fashion" && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">ファッション詳細</h3>
            <div className="space-y-1.5">
              <Label>アイテム種別</Label>
              <Select name="fashion_item_type" defaultValue={item?.fashion_details?.item_type ?? undefined}>
                <SelectTrigger><SelectValue placeholder="選択しない" /></SelectTrigger>
                <SelectContent>
                  {fashionItemTypeValues.map((t) => <SelectItem key={t} value={t}>{fashionItemTypeLabels[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fashion_size">サイズ</Label>
                <Input id="fashion_size" name="fashion_size" maxLength={50} defaultValue={item?.fashion_details?.size ?? ""} placeholder="M / 27cm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fashion_brand">ブランド</Label>
                <Input id="fashion_brand" name="fashion_brand" maxLength={100} defaultValue={item?.fashion_details?.brand ?? ""} placeholder="UNIQLO" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fashion_color">色</Label>
                <Input id="fashion_color" name="fashion_color" maxLength={50} defaultValue={item?.fashion_details?.color ?? ""} placeholder="ブラック" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ハイエース固有 */}
      {categoryCode === "haiace" && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">ハイエース詳細</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>取付状態</Label>
                <Select name="haiace_install_status" defaultValue={item?.haiace_details?.install_status ?? "not_installed"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {haiaceInstallStatusValues.map((s) => <SelectItem key={s} value={s}>{haiaceInstallStatusLabels[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>車検対応</Label>
                <Select name="haiace_road_legal" defaultValue={item?.haiace_details?.road_legal ?? "unknown"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {haiaceRoadLegalValues.map((s) => <SelectItem key={s} value={s}>{haiaceRoadLegalLabels[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>取付位置（複数選択可）</Label>
              <div className="flex flex-wrap gap-3">
                {haiacePositions.map((p) => (
                  <label key={p.id} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox checked={positionIds.includes(p.id)} onCheckedChange={() => togglePosition(p.id)} />
                    <span className="text-sm">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>用途（複数選択可）</Label>
              <div className="flex flex-wrap gap-3">
                {haiacePurposes.map((p) => (
                  <label key={p.id} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox checked={purposeIds.includes(p.id)} onCheckedChange={() => togglePurpose(p.id)} />
                    <span className="text-sm">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 写真 */}
      <Separator />
      <div className="space-y-3">
        <h3 className="font-medium">商品写真</h3>
        <PhotoUploader
          userId={userId}
          itemId={itemId}
          kind="product"
          maxPhotos={12}
          existingCount={item?.photos?.filter((p) => p.kind === "product").length ?? 0}
          label="写真を撮影"
          onPhotosChange={(photos) => setUploadedPhotos((prev) => [...prev.filter((p) => p.kind !== "product"), ...photos])}
        />
        <h3 className="font-medium pt-2">レシート / 取引画面</h3>
        <PhotoUploader
          userId={userId}
          itemId={itemId}
          kind="receipt"
          maxPhotos={3}
          existingCount={item?.photos?.filter((p) => p.kind === "receipt").length ?? 0}
          label="レシートを撮影"
          onPhotosChange={(photos) => setUploadedPhotos((prev) => [...prev.filter((p) => p.kind !== "receipt"), ...photos])}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || !marketplaceId}>
        {isSubmitting ? "保存中…" : submitLabel}
      </Button>
    </form>
  );
}
