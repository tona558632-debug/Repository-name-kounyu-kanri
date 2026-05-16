"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  usageStatusValues,
  usageStatusLabels,
  categoryCodeValues,
  categoryCodeLabels,
  type UsageStatus,
  type CategoryCode,
} from "@/lib/validators/enums";
import { saveListingCandidateSettings } from "@/app/(app)/settings/actions";
import type { ListingCandidateSettings } from "@/lib/listing-candidates";

// 「もう出品できない」ステータスはチェックボックスから除外
const SELECTABLE_STATUSES: UsageStatus[] = usageStatusValues.filter(
  (s) => !(["listing", "sold", "disposed"] as UsageStatus[]).includes(s),
) as UsageStatus[];

type Props = { initial: ListingCandidateSettings };

export function ListingCandidateSettingsForm({ initial }: Props) {
  const [thresholdDays, setThresholdDays] = useState<number>(initial.thresholdDays);
  const [statuses, setStatuses] = useState<UsageStatus[]>(initial.includedStatuses);
  const [minPrice, setMinPrice] = useState<string>(initial.minPrice?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState<string>(initial.maxPrice?.toString() ?? "");
  const [categories, setCategories] = useState<CategoryCode[]>(initial.categoryCodes ?? []);
  const [pending, startTransition] = useTransition();

  function toggle<T>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveListingCandidateSettings({
        thresholdDays,
        includedStatuses: statuses,
        minPrice: minPrice === "" ? null : Number(minPrice),
        maxPrice: maxPrice === "" ? null : Number(maxPrice),
        categoryCodes: categories,
      });
      if ("error" in res) toast.error(res.error);
      else toast.success("保存しました ✓");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* 閾値日数 */}
      <div className="space-y-1.5">
        <Label htmlFor="thresholdDays" className="text-sm">未使用日数の閾値</Label>
        <div className="flex items-center gap-2">
          <Input
            id="thresholdDays"
            type="number"
            min={0}
            max={36500}
            value={thresholdDays}
            onChange={(e) => setThresholdDays(Number.parseInt(e.target.value || "0", 10))}
            className="w-32"
          />
          <span className="text-sm text-muted-foreground">日以上未使用なら候補</span>
        </div>
      </div>

      <Separator />

      {/* 含めるステータス */}
      <div className="space-y-2">
        <Label className="text-sm">候補に含めるステータス</Label>
        <div className="grid grid-cols-2 gap-2">
          {SELECTABLE_STATUSES.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={statuses.includes(s)}
                onCheckedChange={() => setStatuses((prev) => toggle(prev, s))}
              />
              {usageStatusLabels[s]}
            </label>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          「未使用」は日数に関係なく常に候補。それ以外のステータスは閾値日数以上経過したものが候補。
        </p>
      </div>

      <Separator />

      {/* 価格レンジ */}
      <div className="space-y-1.5">
        <Label className="text-sm">購入価格レンジ（任意）</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={minPrice}
            placeholder="下限"
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-28"
          />
          <span className="text-sm text-muted-foreground">〜</span>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={maxPrice}
            placeholder="上限"
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-28"
          />
          <span className="text-sm text-muted-foreground">円</span>
        </div>
      </div>

      <Separator />

      {/* カテゴリ */}
      <div className="space-y-2">
        <Label className="text-sm">対象カテゴリ（未選択＝すべて）</Label>
        <div className="grid grid-cols-3 gap-2">
          {categoryCodeValues.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={categories.includes(c)}
                onCheckedChange={() => setCategories((prev) => toggle(prev, c))}
              />
              {categoryCodeLabels[c]}
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "保存中…" : "保存"}
      </Button>
    </form>
  );
}
