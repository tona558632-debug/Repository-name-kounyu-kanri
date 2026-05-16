"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { usageStatusEnum, categoryCodeEnum } from "@/lib/validators/enums";

const SettingsSchema = z
  .object({
    thresholdDays: z.coerce.number().int().min(0).max(36500),
    includedStatuses: z.array(usageStatusEnum).min(1, "最低1つは選択してください"),
    minPrice: z
      .union([z.coerce.number().int().min(0), z.literal("")])
      .optional()
      .transform((v) => (v === "" || v == null ? null : Number(v))),
    maxPrice: z
      .union([z.coerce.number().int().min(0), z.literal("")])
      .optional()
      .transform((v) => (v === "" || v == null ? null : Number(v))),
    categoryCodes: z.array(categoryCodeEnum).optional(),
  })
  .refine(
    (v) => v.minPrice == null || v.maxPrice == null || v.minPrice <= v.maxPrice,
    { message: "最低価格は最高価格以下にしてください", path: ["minPrice"] },
  );

export type SaveListingCandidateSettingsResult =
  | { success: true }
  | { error: string };

export async function saveListingCandidateSettings(
  input: unknown,
): Promise<SaveListingCandidateSettingsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const parsed = SettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" / ") };
  }
  const v = parsed.data;

  const { error } = await supabase.from("listing_candidate_settings").upsert(
    {
      user_id: user.id,
      threshold_days: v.thresholdDays,
      included_statuses: v.includedStatuses,
      min_price: v.minPrice,
      max_price: v.maxPrice,
      category_codes: v.categoryCodes && v.categoryCodes.length > 0 ? v.categoryCodes : null,
    },
    { onConflict: "user_id" },
  );

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/listing-candidates");
  revalidatePath("/");
  return { success: true };
}
