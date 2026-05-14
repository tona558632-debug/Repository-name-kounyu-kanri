import { loginWithPassword, loginWithMagicLink } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

type Props = {
  searchParams: Promise<{ error?: string; message?: string; redirect?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { error, message, redirect } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Package className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">購入品・在庫管理</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ログイン</CardTitle>
            <CardDescription>メールアドレスとパスワードでログイン</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={loginWithPassword} className="space-y-4">
              {redirect && <input type="hidden" name="redirect" value={redirect} />}
              <div className="space-y-1.5">
                <Label htmlFor="email">メールアドレス</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">パスワード</Label>
                <Input id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••••••" />
              </div>
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
              )}
              <Button type="submit" className="w-full">ログイン</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">パスワードなしでログイン</CardTitle>
            <CardDescription>メールにログインリンクを送信します</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={loginWithMagicLink} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="magic-email">メールアドレス</Label>
                <Input id="magic-email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
              </div>
              {message && (
                <p className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">{message}</p>
              )}
              <Button type="submit" variant="outline" className="w-full">メールでリンクを受け取る</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
