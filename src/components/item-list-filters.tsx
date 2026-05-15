"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usageStatusLabels, usageStatusValues } from "@/lib/validators/enums";
import { Search } from "lucide-react";

type Props = {
  marketplaces: { id: string; name: string }[];
  currentParams: { q?: string; status?: string; marketplace?: string; sort?: string };
};

export function ItemListFilters({ marketplaces, currentParams }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="商品名・メモなどで検索"
          defaultValue={currentParams.q ?? ""}
          className="pl-8"
          onChange={(e) => update("q", e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Select
          value={currentParams.status ?? "all"}
          onValueChange={(v) => update("status", v === "all" ? "" : v)}
        >
          <SelectTrigger className="flex-1 text-xs h-8">
            <SelectValue placeholder="使用状況" />
          </SelectTrigger>
          <SelectContent>
            {/* Radix Select は value="" を許容しないため "all" をセンチネルに使う */}
            <SelectItem value="all">すべて</SelectItem>
            {usageStatusValues.map((s) => (
              <SelectItem key={s} value={s}>{usageStatusLabels[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={currentParams.marketplace ?? "all"}
          onValueChange={(v) => update("marketplace", v === "all" ? "" : v)}
        >
          <SelectTrigger className="flex-1 text-xs h-8">
            <SelectValue placeholder="購入元" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {marketplaces.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={currentParams.sort ?? "created_at"} onValueChange={(v) => update("sort", v)}>
          <SelectTrigger className="w-28 text-xs h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">登録日</SelectItem>
            <SelectItem value="purchase_date">購入日</SelectItem>
            <SelectItem value="purchase_price">金額</SelectItem>
            <SelectItem value="last_used_at">最終使用日</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
