import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("メールアドレスの形式が正しくありません"),
  password: z.string().min(12, "パスワードは12文字以上にしてください"),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const magicLinkSchema = z.object({
  email: z.string().email("メールアドレスの形式が正しくありません"),
});

export type MagicLinkValues = z.infer<typeof magicLinkSchema>;
