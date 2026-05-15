import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const PROMPT = `この画像はフリマサイトや通販サイトの購入履歴・購入確認・商品ページです。
以下の情報をJSONのみで返してください（説明文・マークダウン不要）。不明な項目はnullにしてください。

{
  "name": "商品名（できるだけ正確に）",
  "purchase_price": 送料を除いた購入金額の数値（円・整数・記号なし）,
  "shipping_fee": 送料の数値（円・整数。送料無料や不明なら0）,
  "purchase_date": "YYYY-MM-DD形式の購入日（不明ならnull）",
  "marketplace_code": "mercari / yahoo_auction / yahoo_fril / rakuma / paypay_fril / amazon / rakuten / retail / other のいずれか",
  "seller_name": "出品者名または店舗名（不明ならnull）",
  "memo": "商品の状態・色・サイズなど補足情報（不明ならnull）"
}`;

export async function POST(request: NextRequest) {
  // 認証チェック
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY が設定されていません" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const image = formData.get("image") as File | null;
    if (!image) return NextResponse.json({ error: "画像がありません" }, { status: 400 });

    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const mimeType = image.type || "image/jpeg";
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"] as const;
    const finalMime = (validTypes as readonly string[]).includes(mimeType) ? mimeType : "image/jpeg";

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      // 2.5-flash-lite: 同じ 15 RPM だが日次上限が 2.0-flash の 5 倍 (1000 RPD)
      model: "gemini-2.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" },
    });

    const result = await model.generateContent([
      { text: PROMPT },
      { inlineData: { data: base64, mimeType: finalMime } },
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error("[parse-screenshot]", err);

    let message = "解析に失敗しました";
    let code: "rate_limit" | "invalid_key" | "unknown" = "unknown";
    let retryAfterSec: number | null = null;

    if (err && typeof err === "object") {
      const e = err as { message?: string; status?: number };
      const raw = e.message ?? "";

      // Gemini は 429 のとき details に "retryDelay":"37s" を含むことが多い
      const retryMatch = raw.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
      if (retryMatch) retryAfterSec = Math.ceil(parseFloat(retryMatch[1]));

      if (raw.includes("API key") || raw.includes("API_KEY_INVALID")) {
        message = "Gemini API キーが無効です。設定を確認してください。";
        code = "invalid_key";
      } else if (
        raw.includes("quota") ||
        raw.includes("rate") ||
        raw.includes("RESOURCE_EXHAUSTED") ||
        raw.includes("429")
      ) {
        code = "rate_limit";
        if (!retryAfterSec) retryAfterSec = 60;
        message = `Gemini API の無料枠を超過しました。${retryAfterSec}秒後に自動再試行します。`;
      } else if (raw) {
        message = `Gemini: ${raw}`;
      }
    }

    return NextResponse.json(
      { error: message, code, retryAfterSec },
      { status: code === "rate_limit" ? 429 : 500 }
    );
  }
}
