"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { markUsed } from "@/app/(app)/items/actions";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";

export function MarkUsedButton({ itemId }: { itemId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await markUsed(itemId);
          if ("error" in result) toast.error(result.error);
          else toast.success("最終使用日を今日に更新しました");
        })
      }
    >
      <CheckCheck className="h-3.5 w-3.5 mr-1" />
      使った
    </Button>
  );
}
