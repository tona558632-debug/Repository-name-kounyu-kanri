"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { softDeleteItem } from "@/app/(app)/items/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export function DeleteItemButton({ itemId }: { itemId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>削除しますか？</DialogTitle>
          <DialogDescription>ゴミ箱に移動します。後から復元できます。</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>キャンセル</Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await softDeleteItem(itemId);
                if ("error" in result) {
                  toast.error(result.error);
                  setOpen(false);
                }
              })
            }
          >
            {isPending ? "削除中…" : "ゴミ箱に移動"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
