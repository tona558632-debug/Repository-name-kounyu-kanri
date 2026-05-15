"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, Clipboard, FolderOpen, Loader2, Sparkles } from "lucide-react";

// 長辺 1280px / JPEG 80% に圧縮。HEIC など Canvas が読めない形式は元ファイルを返す。
async function compressImage(file: File, maxSize = 1280, quality = 0.8): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/heic" || file.type === "image/heif") {
    return file;
  }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const ratio = Math.min(1, maxSize / Math.max(width, height));
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) return resolve(file);
          const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
          resolve(new File([blob], name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

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
  const [retryIn, setRetryIn] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastFileRef = useRef<File | null>(null);

  const handleFile = useCallback(async (file: File) => {
    lastFileRef.current = file;
    setErrorMsg(null);
    setRetryIn(null);
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const compressed = await compressImage(file);
      const fd = new FormData();
      fd.append("image", compressed);
      const res = await fetch("/api/parse-screenshot", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 429 && typeof data?.retryAfterSec === "number") {
          setErrorMsg(data?.error ?? "Gemini API の無料枠を超過しました。");
          setRetryIn(data.retryAfterSec);
          return;
        }
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
  }, [onParsed]);

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
  }, [open, handleFile]);

  // レート制限カウントダウン → 0 で自動再試行
  useEffect(() => {
    if (retryIn === null) return;
    if (retryIn <= 0) {
      const f = lastFileRef.current;
      setRetryIn(null);
      if (f) handleFile(f);
      return;
    }
    const t = setTimeout(() => setRetryIn((v) => (v === null ? null : v - 1)), 1000);
    return () => clearTimeout(t);
  }, [retryIn, handleFile]);

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
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPreview(null); setErrorMsg(null); setRetryIn(null); lastFileRef.current = null; } }}>
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
          ) : retryIn !== null ? (
            <div className="flex items-center justify-center py-4 gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              レート制限中… {retryIn}秒後に自動再試行します
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
              {(errorMsg.includes("API キー") || errorMsg.includes("GEMINI_API_KEY")) && (
                <p className="mt-2 text-foreground">
                  → <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline">Google AI Studio</a> で無料APIキーを取得してください
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
