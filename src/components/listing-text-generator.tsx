"use client";

import { useState } from "react";
import { toast } from "sonner";
import { listingSiteSpecs, suggestPriceRange, truncate, type ListingSiteCode } from "@/lib/listing-templates";
import { fashionItemTypeLabels, haiaceInstallStatusLabels, haiaceRoadLegalLabels } from "@/lib/validators/enums";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Check } from "lucide-react";
import type { Item } from "@/types/items";

function generateTitle(item: Item, maxLen: number): string {
  const parts: string[] = [];
  if (item.fashion_details?.brand) parts.push(item.fashion_details.brand);
  parts.push(item.name);
  if (item.fashion_details?.size) parts.push(`サイズ${item.fashion_details.size}`);
  if (item.fashion_details?.color) parts.push(item.fashion_details.color);
  return truncate(parts.join(" "), maxLen);
}

function generateDescription(item: Item, maxLen: number): string {
  const lines: string[] = [];
  lines.push(`【商品名】${item.name}`);

  if (item.fashion_details) {
    const fd = item.fashion_details;
    if (fd.brand) lines.push(`【ブランド】${fd.brand}`);
    if (fd.item_type) lines.push(`【種別】${fashionItemTypeLabels[fd.item_type] ?? fd.item_type}`);
    if (fd.size) lines.push(`【サイズ】${fd.size}`);
    if (fd.color) lines.push(`【カラー】${fd.color}`);
  }

  if (item.haiace_details) {
    const hd = item.haiace_details;
    lines.push(`【取付状態】${haiaceInstallStatusLabels[hd.install_status]}`);
    lines.push(`【車検対応】${haiaceRoadLegalLabels[hd.road_legal]}`);
    if (hd.positions.length > 0) lines.push(`【取付位置】${hd.positions.map((p) => p.name).join("・")}`);
    if (hd.purposes.length > 0) lines.push(`【用途】${hd.purposes.map((p) => p.name).join("・")}`);
  }

  lines.push("");
  lines.push(`【状態】${item.usage_status === "unused" ? "未使用" : "使用あり"}`);
  if (item.memo) lines.push(`【備考】${item.memo}`);
  lines.push("");
  lines.push("ご不明な点はお気軽にご質問ください。");

  return truncate(lines.join("\n"), maxLen);
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("コピーしました");
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button variant="outline" size="sm" onClick={copy} className="h-7 text-xs">
      {copied ? <Check className="h-3.5 w-3.5 mr-1 text-green-600" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
      コピー
    </Button>
  );
}

export function ListingTextGenerator({ item }: { item: Item }) {
  const [siteCode, setSiteCode] = useState<ListingSiteCode>("mercari");
  const spec = listingSiteSpecs[siteCode];
  const title = generateTitle(item, spec.titleMaxLength);
  const description = generateDescription(item, spec.descriptionMaxLength);
  const priceRange = suggestPriceRange(item.purchase_price);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <p className="text-sm font-medium">出品先サイトを選択</p>
        <Select value={siteCode} onValueChange={(v) => setSiteCode(v as ListingSiteCode)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(listingSiteSpecs).map((s) => (
              <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
        <div>タイトル上限: <span className="font-medium text-foreground">{spec.titleMaxLength}文字</span></div>
        <div>本文上限: <span className="font-medium text-foreground">{spec.descriptionMaxLength}文字</span></div>
        <div>購入額: <span className="font-medium text-foreground">¥{item.purchase_price.toLocaleString()}</span></div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">タイトル</p>
            <div className="flex items-center gap-2">
              <Badge variant={title.length > spec.titleMaxLength ? "destructive" : "secondary"} className="text-xs">
                {title.length}/{spec.titleMaxLength}文字
              </Badge>
              <CopyButton text={title} />
            </div>
          </div>
          <Textarea value={title} readOnly rows={2} className="text-sm resize-none" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">商品説明</p>
            <div className="flex items-center gap-2">
              <Badge variant={description.length > spec.descriptionMaxLength ? "destructive" : "secondary"} className="text-xs">
                {description.length}/{spec.descriptionMaxLength}文字
              </Badge>
              <CopyButton text={description} />
            </div>
          </div>
          <Textarea value={description} readOnly rows={10} className="text-sm resize-none" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">推奨価格帯</p>
            <CopyButton text={`¥${priceRange.min.toLocaleString()} 〜 ¥${priceRange.max.toLocaleString()}`} />
          </div>
          <p className="text-2xl font-bold">
            ¥{priceRange.min.toLocaleString()} 〜 ¥{priceRange.max.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">購入額の40〜70%を目安（送料・手数料別途）</p>
        </CardContent>
      </Card>
    </div>
  );
}
