import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/login/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut, User, Info } from "lucide-react";

export const metadata = { title: "設定" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const threshold = process.env.LISTING_CANDIDATE_THRESHOLD_DAYS ?? "180";

  const { count: itemCount } = await supabase
    .from("items")
    .select("*", { count: "exact", head: true })
    .eq("is_deleted", false);

  return (
    <div className="container max-w-lg py-4 space-y-4">
      <h1 className="text-lg font-bold">設定</h1>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" />アカウント</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">メールアドレス</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <Separator />
          <form action={logout}>
            <Button variant="destructive" size="sm" type="submit" className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              ログアウト
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Info className="h-4 w-4" />データ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">登録アイテム数</span>
            <span className="font-medium">{itemCount ?? 0}件</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">出品候補の閾値</span>
            <span className="font-medium">{threshold}日</span>
          </div>
          <p className="text-xs text-muted-foreground">閾値は環境変数 LISTING_CANDIDATE_THRESHOLD_DAYS で変更可能です。</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">アプリについて</CardTitle>
          <CardDescription>購入品・在庫管理アプリ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">バージョン</span>
            <span>0.1.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">スタック</span>
            <span>Next.js 15 / Supabase / Vercel</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
