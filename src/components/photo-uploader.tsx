"use client";

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type UploadedPhoto = {
  storagePath: string;
  kind: "product" | "receipt";
  previewUrl: string;
};

type Props = {
  userId: string;
  itemId: string;
  kind?: "product" | "receipt";
  onPhotosChange?: (photos: UploadedPhoto[]) => void;
  maxPhotos?: number;
  label?: string;
  existingCount?: number;
};

export function PhotoUploader({
  userId,
  itemId,
  kind = "product",
  onPhotosChange,
  maxPhotos = 12,
  label = "写真を追加",
  existingCount = 0,
}: Props) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const remaining = maxPhotos - existingCount - photos.length;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    const newPhotos: UploadedPhoto[] = [];

    for (const file of Array.from(files).slice(0, remaining)) {
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
          fileType: "image/jpeg",
          initialQuality: 0.8,
        });
        const ext = "jpg";
        const filename = `${crypto.randomUUID()}.${ext}`;
        const storagePath = `${userId}/${itemId}/${filename}`;

        const { error: uploadError } = await supabase.storage
          .from("item-photos")
          .upload(storagePath, compressed, { contentType: "image/jpeg", upsert: false });

        if (uploadError) throw new Error(uploadError.message);

        const previewUrl = URL.createObjectURL(compressed);
        newPhotos.push({ storagePath, kind, previewUrl });
      } catch (e) {
        setError(`アップロード失敗: ${e instanceof Error ? e.message : "不明なエラー"}`);
      }
    }

    const updated = [...photos, ...newPhotos];
    setPhotos(updated);
    onPhotosChange?.(updated);
    setUploading(false);
  }

  function removePhoto(idx: number) {
    const updated = photos.filter((_, i) => i !== idx);
    setPhotos(updated);
    onPhotosChange?.(updated);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {photos.map((p, idx) => (
          <div key={p.storagePath} className="relative h-20 w-20 rounded-lg overflow-hidden border bg-muted">
            <Image src={p.previewUrl} alt="" fill className="object-cover" sizes="80px" unoptimized />
            <button
              type="button"
              onClick={() => removePhoto(idx)}
              className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "h-20 w-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors",
              uploading && "opacity-50 pointer-events-none",
            )}
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
            <span className="text-[10px]">{uploading ? "送信中" : label}</span>
          </button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {remaining <= 0 && <p className="text-xs text-muted-foreground">上限（{maxPhotos}枚）に達しました</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
