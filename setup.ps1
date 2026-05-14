# ============================================================
# setup.ps1 — 購入品・在庫管理アプリ セットアップ
# 実行方法: PowerShell で .\setup.ps1
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  購入品・在庫管理アプリ セットアップ" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Node.js チェック / インストール ──────────────────────
Write-Host "[1/4] Node.js を確認中..." -ForegroundColor White

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "  Node.js が見つかりません。winget でインストールします..." -ForegroundColor Yellow
    winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
    Write-Host ""
    Write-Host "  ✓ Node.js をインストールしました" -ForegroundColor Green
    Write-Host "  !! 新しい PowerShell ウィンドウを開いて .\setup.ps1 を再実行してください" -ForegroundColor Yellow
    exit 0
} else {
    $ver = & node --version
    Write-Host "  ✓ Node.js $ver" -ForegroundColor Green
}

# ── 2. npm install ──────────────────────────────────────────
Write-Host ""
Write-Host "[2/4] npm install を実行中..." -ForegroundColor White
npm install
Write-Host "  ✓ パッケージインストール完了" -ForegroundColor Green

# ── 3. PWA アイコン生成 ─────────────────────────────────────
Write-Host ""
Write-Host "[3/4] PWA アイコンを生成中..." -ForegroundColor White
node scripts/gen-icons.mjs
Write-Host "  ✓ アイコン生成完了" -ForegroundColor Green

# ── 4. .env.local 作成 ─────────────────────────────────────
Write-Host ""
Write-Host "[4/4] 環境変数ファイルを確認中..." -ForegroundColor White

if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "  ✓ .env.local を作成しました" -ForegroundColor Green
    Write-Host "  !! .env.local を開いて Supabase の認証情報を入力してください" -ForegroundColor Yellow
} else {
    Write-Host "  ✓ .env.local は既に存在します" -ForegroundColor Green
}

# ── 完了メッセージ ──────────────────────────────────────────
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  セットアップ完了！" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "次のステップ:" -ForegroundColor White
Write-Host ""
Write-Host "  STEP 1: Supabase プロジェクト作成" -ForegroundColor Yellow
Write-Host "    https://supabase.com → New project"
Write-Host ""
Write-Host "  STEP 2: .env.local に認証情報を設定" -ForegroundColor Yellow
Write-Host "    NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co"
Write-Host "    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ..."
Write-Host "    NEXT_PUBLIC_APP_URL=http://localhost:3000"
Write-Host ""
Write-Host "  STEP 3: Supabase SQL エディタでマイグレーション実行" -ForegroundColor Yellow
Write-Host "    ファイル: supabase\migrations\0001_init.sql"
Write-Host "    (SQL エディタに内容を貼り付けて実行)"
Write-Host ""
Write-Host "  STEP 4: Supabase SQL エディタでシードデータ投入" -ForegroundColor Yellow
Write-Host "    ファイル: supabase\seed.sql"
Write-Host ""
Write-Host "  STEP 5: アプリ起動" -ForegroundColor Yellow
Write-Host "    npm run dev"
Write-Host "    → http://localhost:3000 を開く"
Write-Host ""
Write-Host "  STEP 6: Supabase で初回ユーザー作成" -ForegroundColor Yellow
Write-Host "    Authentication → Users → Invite user"
Write-Host "    (または /login のマジックリンクで登録)"
Write-Host ""
