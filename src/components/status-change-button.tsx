"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateUsageStatus } from "@/app/(app)/items/actions";
import { usageStatusValues, usageStatusLabels, type UsageStatus } from "@/lib/validators/enums";
import { Button } from "@/components/ui/button";

type Props = { itemId: string; currentStatus: string };

export function StatusChangeButton({ itemId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const status = currentStatus as UsageStatus;

  function handleChange(newStatus: UsageStatus) {
    startTransition(async () => {
      const result = await updateUsageStatus(itemId, newStatus, status);
      if ("error" in result) toast.error(result.error);
      else toast.success(`ステータスを「${usageStatusLabels[newStatus]}」に変更しました`);
    });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {usageStatusValues.filter((s) => s !== status).map((s) => (
        <Button
          key={s}
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          disabled={isPending}
          onClick={() => handleChange(s)}
        >
          {usageStatusLabels[s]}に変更
        </Button>
      ))}
    </div>
  );
}
