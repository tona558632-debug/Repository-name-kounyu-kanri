"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { restoreItem, permanentlyDeleteItem } from "@/app/(app)/items/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RotateCcw, Trash2 } from "lucide-react";

type Props = {
  id: string;
  name: string;
  categoryName?: string;
  purchasePrice: number;
  deletedAt: string;
};

export function TrashItemCard({ id, name, categoryName, purchasePrice, deletedAt }: Props) {
  const [isPendingRestore, startRestore] = useTransition();
  const [isPendingDelete, startDelete] = useTransition();
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  if (deleted) return null;

  return (
    <Card className="opacity-70">
      <CardContent className="p-3 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{name}</p>
          <p className="text-xs text-muted-foreground">
            {categoryName} · ¥{purchasePrice.toLocaleString()} · {deletedAt}に削除
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={isPendingRestore}
          onClick={() =>
            startRestore(async () => {
              const res = await restoreItem(id);
              if ("error" in res) toast.error(res.error);
              else { toast.success("復元しました"); setDeleted(true); }
            })
          }
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          復元
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>完全に削除しますか？</DialogTitle>
              <DialogDescription>この操作は取り消せません。写真も含めて完全に削除されます。</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>キャンセル</Button>
              <Button
                variant="destructive"
                disabled={isPendingDelete}
                onClick={() =>
                  startDelete(async () => {
                    const res = await permanentlyDeleteItem(id);
                    if ("error" in res) toast.error(res.error);
                    else { toast.success("完全に削除しました"); setOpen(false); setDeleted(true); }
                  })
                }
              >
                {isPendingDelete ? "削除中…" : "完全に削除"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
