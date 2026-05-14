import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // 静的アセットと PWA マニフェスト・アイコンを除外
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|api/health).*)",
  ],
};
