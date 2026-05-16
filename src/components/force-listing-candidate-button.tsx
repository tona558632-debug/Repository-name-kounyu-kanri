"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { toggleForceListingCandidate } from "@/app/(app)/items/actions";
import { Button } from "@/components/ui/button";
import { Tag, TagsIcon } from "lucide-react";

type Props = { itemId: string; current: boolean };

export function ForceListingCandidateButton({ itemId, current }: Props) {
  const [pending, startTransition] = useTransition();
  const next = !current;

  return (
    <Button
      variant={current ? "default" : "outline"}
      size="sm"
      disabled={pending}
      className="h-7 text-xs"
      onClick={() =>
        startTransition(async () => {
          const res = await toggleForceListingCandidate(itemId, next);
          if ("error" in res) toast.error(res.error);
          else toast.success(next ? "出品候補に追加しました" : "出品候補から外しました");
        })
      }
    >
      {current ? (
        <>
          <TagsIcon className="h-3.5 w-3.5 mr-1" />
          候補から外す
        </>
      ) : (
        <>
          <Tag className="h-3.5 w-3.5 mr-1" />
          候補に追加
        </>
      )}
    </Button>
  );
}
