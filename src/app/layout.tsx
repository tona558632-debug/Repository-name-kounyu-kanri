import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { SwRegister } from "@/components/sw-register";

export const metadata: Metadata = {
  title: {
    default: "購入品・在庫管理",
    template: "%s | 購入品・在庫管理",
  },
  description: "ファッション・ハイエースカスタムの購入品を一元管理",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "在庫管理",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
