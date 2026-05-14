"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, Clipboard, FolderOpen, Loader2, Sparkles } from "lucide-react";

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ダイアログ表示中は Ctrl+V / Cmd+V で貼り付け可能
  useEffect(() => {
    if (!open) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            handleFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleFile(file: File) {
    setErrorMsg(null);
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/parse-screenshot", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? `解析失敗 (HTTP ${res.status})`);
      }
      onParsed(data);
      toast.success("購入情報を読み取りました ✓");
      setOpen(false);
      setPreview(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "解析に失敗しました";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function openPicker(capture?: "environment" | "user") {
    if (!fileRef.current) return;
    if (capture) {
      fileRef.current.setAttribute("capture", capture);
    } else {
      fileRef.current.removeAttribute("capture");
    }
    fileRef.current.value = "";
    fileRef.current.click();
  }

  async function pasteFromClipboard() {
    setErrorMsg(null);
    try {
      // Clipboard API でクリップボードから画像取得（モバイル/PCどちらも）
      if (!navigator.clipboard?.read) {
        toast.info("Ctrl+V（または⌘+V）で画像を貼り付けてください");
        return;
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], "pasted.png", { type: imageType });
          await handleFile(file);
          return;
        }
      }
      toast.info("クリップボードに画像がありません");
    } catch (e: unknown) {
      toast.info("Ctrl+V（または⌘+V）で画像を貼り付けてください");
      console.error(e);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPreview(null); setErrorMsg(null); } }}>
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

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            メルカリ・ヤフオク・Amazonなどの購入画面のスクショを以下のいずれかで取り込んでください。
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
            <div className="grid grid-cols-1 gap-2">
              <Button type="button" variant="default" onClick={pasteFromClipboard} className="gap-1.5">
                <Clipboard className="h-4 w-4" />
                クリップボードから貼り付け
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={() => openPicker()} className="gap-1.5">
                  <FolderOpen className="h-4 w-4" />
                  ファイル選択
                </Button>
                <Button type="button" variant="outline" onClick={() => openPicker("environment")} className="gap-1.5">
                  <Camera className="h-4 w-4" />
                  カメラ撮影
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground text-center pt-1">
                💡 スクショ後すぐにこのダイアログを開いて <kbd className="px-1 border rounded bg-muted">Ctrl/⌘+V</kbd> でも貼り付け可
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <p className="font-medium mb-1">❌ 解析エラー</p>
              <p className="whitespace-pre-wrap break-words">{errorMsg}</p>
              {errorMsg.includes("credit") && (
                <p className="mt-2 text-foreground">
                  → <a href="https://console.anthropic.com/settings/billing" target="_blank" rel="noreferrer" className="underline">Anthropic Console</a> でクレジットを追加してください（最小 $5〜）
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
