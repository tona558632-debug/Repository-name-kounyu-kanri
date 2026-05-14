"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, FolderOpen, Loader2, Sparkles } from "lucide-react";

export type ParsedPurchase = {
  name?: string | null;
  purchase_price?: number | null;
  shipping_fee?: number | null;
  purchase_date?: string | null;
  marketplace_code?: string | null;
  seller_name?: string | null;
  memo?: string | null;
};

type Props = { onParsed: (data: ParsedPurchase) => void };

export function ScreenshotParser({ onParsed }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/parse-screenshot", { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "解析失敗");
      }
      const data: ParsedPurchase = await res.json();
      onParsed(data);
      toast.success("購入情報を読み取りました ✓");
      setOpen(false);
      setPreview(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "解析に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  function openPicker(capture?: "environment" | "screen") {
    if (!fileRef.current) return;
    if (capture) {
      fileRef.current.setAttribute("capture", capture);
    } else {
      fileRef.current.removeAttribute("capture");
    }
    fileRef.current.value = "";
    fileRef.current.click();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setPreview(null); }}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          スクリーンショットから自動入力（AI）
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            購入履歴から自動入力
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            メルカリ・ヤフオク・Amazonなどの購入確認画面や商品ページのスクリーンショットを選択してください。AIが商品名・金額・日付などを自動で読み取ります。
          </p>

          {preview && (
            <div className="rounded-lg overflow-hidden border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="プレビュー" className="w-full max-h-52 object-contain" />
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />

          {loading ? (
            <div className="flex items-center justify-center py-4 gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              AIが解析中…
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => openPicker()} className="gap-1.5">
                <FolderOpen className="h-4 w-4" />
                ファイルを選択
              </Button>
              <Button type="button" onClick={() => openPicker("environment")} className="gap-1.5">
                <Camera className="h-4 w-4" />
                カメラで撮影
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
