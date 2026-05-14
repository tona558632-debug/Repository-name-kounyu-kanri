import { createClient } from "@/lib/supabase/server";

const BUCKET = "item-photos";

export async function getSignedUrl(storagePath: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 60);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function getSignedUrls(
  paths: string[],
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, 60 * 60);
  if (error || !data) return {};
  return Object.fromEntries(
    data
      .filter((d) => d.signedUrl)
      .map((d) => [d.path, d.signedUrl]),
  );
}

export async function deleteStorageFiles(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = await createClient();
  await supabase.storage.from(BUCKET).remove(paths);
}
