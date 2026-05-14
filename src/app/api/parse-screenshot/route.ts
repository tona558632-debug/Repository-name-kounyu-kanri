import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
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
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY が設定されていません" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const image = formData.get("image") as File | null;
    if (!image) return NextResponse.json({ error: "画像がありません" }, { status: 400 });

    // Base64変換
    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const mimeType = image.type || "image/jpeg";
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
    const mediaType = (validTypes as readonly string[]).includes(mimeType)
      ? (mimeType as (typeof validTypes)[number])
      : "image/jpeg";

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[parse-screenshot]", err);
    return NextResponse.json({ error: "解析に失敗しました" }, { status: 500 });
  }
}
