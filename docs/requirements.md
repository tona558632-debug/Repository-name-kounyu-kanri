# 購入品・在庫管理アプリ 要件定義書

最終更新日: 2026-04-29
バージョン: 0.2（ドラフト・懸念点反映版）

---

## 1. プロジェクト概要

### 1.1 目的
オンラインのフリマサイト・オークションサイト全般、および実店舗で購入した
「ファッション品」および「ハイエースカスタムパーツ」を一元管理し、
使っていないものをフリマ出品候補として抽出することを目的とする個人向けWebアプリケーション。

### 1.2 利用者
- 主たる利用者: 本人 1名
- 想定拡張: 将来的に家族共有の可能性あり（要件として優先度は低いが、設計時に考慮）

### 1.3 利用環境
| 環境 | ブラウザ | 重視するUX |
|------|---------|------------|
| PC | Chrome | 一覧性・編集効率 |
| iPhone | iOS Safari | 撮影→即登録、片手操作 |
| Android | Chrome | 撮影→即登録、片手操作 |

PWA対応によりホーム画面に追加して、ネイティブアプリに近い体験で使用可能とする。

---

## 2. 機能一覧（MVP / 後追い / やらないこと）

### 2.1 MVP（最初に作る）

| # | 機能 | 概要 |
|---|------|------|
| F-01 | 購入品の登録 | 手入力 + 写真アップロード（複数枚）、レシート/取引画面スクショの添付 |
| F-02 | 一覧表示 | カテゴリ別タブ（ファッション/ハイエース/その他）、購入元フィルタ、フリーワード検索、ソート（購入日・購入金額・最終使用日） |
| F-03 | 詳細表示・編集・削除 | 購入品の詳細ページ、編集フォーム、論理削除（ゴミ箱からの復元可） |
| F-04 | 使用状況の更新 | 一覧／詳細から「使用中・保管中・未使用・出品中・売却済み・処分済み」を素早く切替 |
| F-05 | 出品候補の自動抽出 | 「未使用」または「最終使用日から6ヶ月以上経過」のものを抽出する専用ビュー |
| F-06 | 出品用テキスト生成補助 | タイトル案・説明文案・推奨価格帯をフォームに表示してコピペ可能。出品先サイトを選択すると、各サイトの文字数制限などに合わせたテンプレートで生成 |
| F-07 | 認証 | Supabase Authによるメール+パスワード（または Magic Link）ログイン |
| F-08 | PWA対応 | manifest / Service Worker、ホーム画面追加、オフライン時の閲覧（最低限） |
| F-09 | 写真撮影UI | スマホでカメラを直接起動して撮影→そのまま登録するフローを最優先で実装 |

### 2.2 後追い（あったら便利）

| # | 機能 | 概要 |
|---|------|------|
| L-01 | レシートOCR | レシート写真を解析し、購入日・店舗名・金額を自動入力 |
| L-02 | 集計ダッシュボード | 購入金額の合計、カテゴリ別／購入元別／月別集計、グラフ表示 |
| L-03 | ハイエース現在構成ビュー | 「取付済み」のパーツのみを取付位置別に一覧表示 |
| L-04 | 売却履歴管理 | 売却額・売却日・売却先を記録し、購入額との差分から利益を計算 |
| L-05 | 出品候補の通知 | 一定期間使われていないアイテムをまとめて週次でレポート（メール／プッシュ） |
| L-06 | 家族共有 | 複数ユーザーでの共有閲覧／編集（Supabase RLSでの制御） |
| L-07 | バーコード／JANコードからの登録補助 | バーコードスキャンで商品名候補を取得 |

### 2.3 やらないこと（スコープ外）

| # | やらないこと | 理由 |
|---|------|------|
| N-01 | 各フリマサイトへの自動出品 | 各サービス利用規約上のリスクがあるため、コピペ用テキスト生成までに留める |
| N-02 | 決済・課金機能 | 個人利用が前提のため不要 |
| N-03 | 売上計上・税務処理 | 確定申告等の用途は本アプリのスコープ外 |
| N-04 | 他ユーザー向けのSaaS化 | 個人および家族利用を超える機能（請求、テナント分離、サポート等）は持たない |

### 2.4 機能↔画面 トレーサビリティ・マトリクス

各機能がどの画面で実現されるかを明示する。実装時の抜け漏れチェックおよびテスト範囲特定に用いる。

| 機能ID | 機能名 | 主画面 | 副画面（補助的に関与） |
|--------|--------|--------|------------------------|
| F-01 | 購入品の登録 | S-05 新規登録 | S-02 ホーム（FABから遷移） |
| F-02 | 一覧表示 | S-03 一覧 | S-02 ホーム（最近登録の小一覧） |
| F-03 | 詳細表示・編集・削除 | S-04 詳細 / S-06 編集 | S-13 ゴミ箱（復元・完全削除） |
| F-04 | 使用状況の更新 | S-04 詳細 | S-03 一覧（カードからのクイック切替） |
| F-05 | 出品候補の自動抽出 | S-07 出品候補一覧 | S-02 ホーム（候補件数バッジ） |
| F-06 | 出品用テキスト生成補助 | S-08 出品テキスト生成 | S-04 詳細（生成ボタン起点） |
| F-07 | 認証 | S-01 ログイン | 全画面（ガード） |
| F-08 | PWA対応 | 全画面 | S-12 設定（インストール案内） |
| F-09 | 写真撮影UI | S-05 新規登録 | S-06 編集（追加撮影） |
| L-01 | レシートOCR | S-05 新規登録 | — |
| L-02 | 集計ダッシュボード | S-10 集計 | S-02 ホーム（簡易サマリ） |
| L-03 | ハイエース現在構成ビュー | S-09 構成ビュー | — |
| L-04 | 売却履歴管理 | S-11 売却履歴 | S-04 詳細（売却済み時の表示） |
| L-05 | 出品候補の通知 | （バックグラウンド） | S-12 設定（通知ON/OFF） |
| L-06 | 家族共有 | S-12 設定 | 全画面（権限影響） |
| L-07 | バーコード登録補助 | S-05 新規登録 | — |

---

## 3. データモデル

### 3.0 スキーマ設計判断（カテゴリ固有項目の持ち方）

カテゴリごとに固有項目が異なるため、データの持ち方として以下3案を比較検討した。

| 案 | 概要 | 長所 | 短所 |
|----|------|------|------|
| A: **カテゴリ別テーブル分割**（採用） | `fashion_details` / `haiace_details` のように1対0..1で正規化 | 型・NOT NULL・一意制約・インデックスをDBで強制できる／クエリが素直／TS型が綺麗 | カテゴリを増やすたびにテーブル＆マイグレーションが増える |
| B: `items.attributes JSONB` | すべての固有項目を1つのJSONB列に格納 | カテゴリ追加がスキーマ変更不要／柔軟 | 値の型・必須性をDBで強制できない／集計クエリが煩雑／TS型をzodで二重定義する必要 |
| C: EAV（Entity-Attribute-Value） | 属性メタテーブル＋値テーブル | 完全に動的 | 個人アプリには過剰／クエリが複雑／パフォーマンス劣化 |

**採用方針: A**

理由:
- 当面のカテゴリは「ファッション」「ハイエース」「その他」の3つで固定的。動的にカテゴリが増える要件ではない。
- ハイエースは「取付位置・用途」が多対多であり、JSONBよりリレーションで持つほうが集計（L-03 構成ビュー）が単純。
- 「その他」カテゴリは固有項目を持たず、`items` の共通項目＋`memo` のみで運用する（詳細テーブルなし）。
- 将来カテゴリが頻繁に増えそうな兆候が出た時点で、案Bへの段階的移行を検討する余地は残す。

**カテゴリ↔詳細テーブル整合性ルール**（→ 3.6 で制約として明記）:
- `categories.code = 'fashion'` の `items` のみ `fashion_details` を持つ（`items.id` で1対0..1）。
- `categories.code = 'haiace'` の `items` のみ `haiace_details` を持つ。
- `categories.code = 'other'` の `items` はどちらの詳細テーブルも持たない。

### 3.1 ER図（テキスト表現）

```
┌──────────────┐        ┌──────────────────┐        ┌────────────────┐
│   users      │        │   marketplaces   │        │   categories   │
│  (Supabase)  │        │   （マスタ）      │        │  （マスタ）     │
└──────┬───────┘        └────────┬─────────┘        └────────┬───────┘
       │ 1                       │ 1                          │ 1
       │                         │                            │
       │ N                       │ N                          │ N
       │                         │                            │
       ▼                         ▼                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                              items                                  │
│  購入品の中核テーブル（ファッション/ハイエース共通項目を保持）        │
└──┬─────────────┬─────────────┬──────────────┬─────────────┬─────────┘
   │ 1           │ 1           │ 1            │ 1           │ 1
   │             │             │              │             │
   │ N           │ 0..1        │ 0..1         │ N           │ N
   ▼             ▼             ▼              ▼             ▼
┌──────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐ ┌──────────┐
│item_     │ │fashion_    │ │haiace_     │ │usage_    │ │sales     │
│photos    │ │details     │ │details     │ │logs      │ │（後追い）│
└──────────┘ └────────────┘ └─┬──────────┘ └──────────┘ └──────────┘
                              │ N
                              │
                              ▼
              ┌───────────────────────────┐
              │ haiace_part_positions     │ ← 取付位置（多対多）
              │ haiace_part_purposes      │ ← 用途（多対多）
              └───────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────┐
              │ haiace_positions （マスタ）│
              │ haiace_purposes  （マスタ）│
              └───────────────────────────┘
```

### 3.2 テーブル定義

#### 3.2.1 users（Supabase Auth が管理）
| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK | Supabase Authのユーザーid |
| email | text | unique | |
| created_at | timestamptz | | |

※ 本アプリではauth.usersをそのまま参照する。

#### 3.2.2 marketplaces（購入元マスタ）
| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK | |
| code | text | unique, not null | システム識別子（mercari, yahoo_fril, yahoo_auction, rakuma, paypay_fril, amazon, rakuten, retail, other 等） |
| name | text | not null | 表示名（例: メルカリ） |
| sort_order | int | default 0 | 表示順 |
| is_active | bool | default true | 非表示にしたい場合にfalse |
| is_other | bool | default false | 「その他（自由入力）」フラグ。trueのitemは`marketplace_other_name`を使用 |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |

初期投入データ:
- mercari / メルカリ
- yahoo_fril / ヤフーフリマ
- yahoo_auction / ヤフオク
- rakuma / ラクマ
- paypay_fril / PayPayフリマ
- amazon / Amazon
- rakuten / 楽天市場
- retail / 実店舗
- other / その他（is_other = true）

#### 3.2.3 categories（カテゴリマスタ）
| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK | |
| code | text | unique, not null | fashion / haiace / other |
| name | text | not null | 表示名 |
| sort_order | int | default 0 | |

#### 3.2.4 items（購入品 中核テーブル）
| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK | |
| user_id | uuid | FK→auth.users.id, not null | 所有ユーザー |
| category_id | uuid | FK→categories.id, not null | カテゴリ |
| marketplace_id | uuid | FK→marketplaces.id, not null | 購入元 |
| marketplace_other_name | text | nullable | 購入元が「その他」の場合の自由入力名 |
| seller_name | text | nullable | 店舗名・出品者名（自由入力） |
| name | text | not null | 商品名 |
| purchase_price | int | not null, ≥0 | 購入金額（円） |
| shipping_fee | int | not null, default 0 | 送料（円） |
| purchase_date | date | not null | 購入日 |
| memo | text | nullable | メモ |
| usage_status | text | not null, default 'storing' | in_use / storing / unused / listing / sold / disposed |
| last_used_at | date | nullable | 最終使用日 |
| storage_location | text | nullable | 保管場所 |
| is_deleted | bool | not null, default false | 論理削除 |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |

インデックス: (user_id, category_id), (user_id, usage_status), (user_id, last_used_at), (user_id, marketplace_id)

#### 3.2.5 item_photos（写真／スクショ）
| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK | |
| item_id | uuid | FK→items.id (cascade), not null | |
| storage_path | text | not null | Supabase Storageのパス |
| kind | text | not null | product / receipt（商品写真 or レシート/取引画面） |
| sort_order | int | default 0 | 表示順 |
| created_at | timestamptz | default now() | |

#### 3.2.6 fashion_details（ファッション固有）
| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| item_id | uuid | PK, FK→items.id (cascade) | |
| item_type | text | nullable | tops / bottoms / outer / shoes / accessory / other |
| size | text | nullable | サイズ（自由入力） |
| brand | text | nullable | ブランド |
| color | text | nullable | 色 |

#### 3.2.7 haiace_details（ハイエースカスタム固有）
| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| item_id | uuid | PK, FK→items.id (cascade) | |
| install_status | text | not null, default 'not_installed' | installed / removed / not_installed |
| road_legal | text | not null, default 'unknown' | compliant / non_compliant / unknown |

#### 3.2.8 haiace_positions（取付位置マスタ）
| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK | |
| code | text | unique, not null | interior / exterior / engine / suspension / electrical |
| name | text | not null | 内装 / 外装 / エンジン / 足回り / 電装 |
| sort_order | int | default 0 | |

#### 3.2.9 haiace_part_positions（取付位置 多対多）
| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| item_id | uuid | PK (composite), FK→items.id (cascade) | |
| position_id | uuid | PK (composite), FK→haiace_positions.id | |

#### 3.2.10 haiace_purposes（用途マスタ）
| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK | |
| code | text | unique, not null | comfort / appearance / camping / loading / performance |
| name | text | not null | 快適化 / 見た目 / 車中泊 / 積載 / 走行性能 |
| sort_order | int | default 0 | |

#### 3.2.11 haiace_part_purposes（用途 多対多）
| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| item_id | uuid | PK (composite), FK→items.id (cascade) | |
| purpose_id | uuid | PK (composite), FK→haiace_purposes.id | |

#### 3.2.12 usage_logs（使用履歴／状態変更履歴）
| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK | |
| item_id | uuid | FK→items.id (cascade), not null | |
| event_type | text | not null | used / status_changed |
| from_status | text | nullable | |
| to_status | text | nullable | |
| occurred_at | timestamptz | not null, default now() | |

「使った」ボタンを押すと event_type=used のログが追加され、items.last_used_atも同時更新される設計を想定。

#### 3.2.13 sales（売却履歴 / 後追い L-04）
| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK | |
| item_id | uuid | FK→items.id, unique | 1商品につき1売却を想定 |
| sold_at | date | not null | |
| sold_price | int | not null, ≥0 | |
| sold_marketplace_id | uuid | FK→marketplaces.id | 売却先 |
| fee | int | default 0 | 販売手数料（円） |
| shipping_cost | int | default 0 | 発送費用（売り手負担分） |
| memo | text | nullable | |

利益 = sold_price − fee − shipping_cost − (items.purchase_price + items.shipping_fee)

### 3.3 列挙値（参考）

| 区分 | 値 |
|------|-----|
| usage_status | in_use（使用中） / storing（保管中） / unused（未使用） / listing（出品中） / sold（売却済み） / disposed（処分済み） |
| fashion.item_type | tops / bottoms / outer / shoes / accessory / other |
| haiace.install_status | installed / removed / not_installed |
| haiace.road_legal | compliant / non_compliant / unknown |
| photo.kind | product / receipt |

### 3.4 認可（Row Level Security 方針）
- 全テーブルにRLSを有効化。
- 個人データテーブル（items / item_photos / usage_logs / sales 等）は `user_id = auth.uid()` のレコードのみ参照・更新可能。
- マスタテーブル（marketplaces / categories / haiace_positions / haiace_purposes）は authenticated ロールに対し参照のみ許可。書き込みはサービスロール経由（管理画面 or マイグレーション）。

### 3.5 ストレージ構成（Supabase Storage）
- バケット: `item-photos`（private）
- パス命名: `{user_id}/{item_id}/{uuid}.{ext}`
- 取得は署名付きURL経由（有効期限60分程度）。
- 1アイテムあたり写真は最大15枚（商品写真12枚＋レシート3枚を目安）。アプリ層で枚数チェック。
- アップロード前にクライアント側で長辺1600px・JPEG品質80に圧縮。サーバ受信時の上限は1ファイル5MB。

### 3.6 整合性制約・データルール

DBレベルで強制すべき制約を明示する（マイグレーションSQLで CHECK・トリガとして実装）。

| # | 制約 | 実装方法 |
|---|------|----------|
| C-01 | `items.usage_status` は許可値のみ | CHECK制約: `IN ('in_use','storing','unused','listing','sold','disposed')` |
| C-02 | `items.purchase_price >= 0`、`shipping_fee >= 0` | CHECK制約 |
| C-03 | `items.purchase_date <= last_used_at` | CHECK制約（last_used_at IS NULL は許可） |
| C-04 | `marketplace_other_name` は購入元が `is_other = true` の場合のみ NOT NULL | BEFORE INSERT/UPDATE トリガで検査 |
| C-05 | `fashion_details` は `items.category_id` が fashion の場合のみ存在 | BEFORE INSERT/UPDATE トリガで検査（カテゴリ変更時は詳細レコードを連動削除/作成） |
| C-06 | `haiace_details` は `items.category_id` が haiace の場合のみ存在 | 同上 |
| C-07 | `usage_logs.event_type` は許可値のみ | CHECK制約: `IN ('used','status_changed')` |
| C-08 | `items` 削除時、関連 `item_photos` / `usage_logs` / `sales` / `haiace_part_*` も削除 | FK の ON DELETE CASCADE |
| C-09 | `usage_status = 'sold'` の `items` には `sales` レコードが必要 | アプリ層でチェック（DB制約は循環参照になるため避ける） |
| C-10 | `updated_at` は更新時に自動更新 | BEFORE UPDATE トリガ（全テーブル共通関数） |

**論理削除のリストア期限**: `is_deleted = true` のレコードは無期限で保持する（個人利用前提のためストレージ圧迫リスクは限定的）。ただし完全削除（物理削除）はゴミ箱画面から手動操作のみ。

**金額の単位**: `purchase_price` / `shipping_fee` / `sold_price` 等の金額は **円・整数** で保持する（小数は扱わない）。

---

## 4. 画面一覧と画面遷移

### 4.1 画面一覧

| 画面ID | 画面名 | 概要 | 主な用途 |
|--------|--------|------|---------|
| S-01 | ログイン | メール+パスワード または Magic Link | 認証 |
| S-02 | ホーム / ダッシュボード | 件数サマリ、出品候補件数、最近登録した品 | 入口 |
| S-03 | 一覧（カテゴリタブ） | ファッション / ハイエース / その他 のタブ。フィルタ・検索・ソート | 探す |
| S-04 | 詳細 | 購入品の全情報、写真、使用ログ | 確認 |
| S-05 | 新規登録 | 写真撮影→共通項目→カテゴリ別項目 のステップ入力 | 登録 |
| S-06 | 編集 | 既存データの編集 | 修正 |
| S-07 | 出品候補一覧 | 自動抽出された出品候補 | 出品準備 |
| S-08 | 出品テキスト生成 | サイト選択 → タイトル/本文/価格テンプレ表示・コピー | 出品支援 |
| S-09 | ハイエース構成ビュー（後追い） | 取付済みパーツの取付位置別ビュー | 確認 |
| S-10 | 集計ダッシュボード（後追い） | 金額集計・グラフ | 振り返り |
| S-11 | 売却履歴（後追い） | 売却済み品の一覧と利益 | 振り返り |
| S-12 | 設定 | プロフィール、購入元マスタの「その他」追加など | 管理 |
| S-13 | ゴミ箱 | 論理削除済みの一覧、復元・完全削除 | 復旧 |

### 4.2 画面遷移図（テキスト）

#### 4.2.1 主要遷移

```
[S-01 ログイン]
      │ login成功
      │（失敗時は同画面でエラー表示）
      ▼
┌──────────────────────────────────────────────────────────┐
│ 認証済み領域（共通: ボトムナビ／ハンバーガー、戻るボタン） │
│                                                          │
│ [S-02 ホーム]                                             │
│  ├─→ [S-03 一覧]    タブ: ファッション/ハイエース/その他   │
│  │     ├─ フィルタ・検索・ソート                          │
│  │     ├─ カード tap     →  [S-04 詳細]                   │
│  │     └─ FAB(+) tap     →  [S-05 新規登録]               │
│  │                                                       │
│  ├─→ [S-07 出品候補一覧]                                  │
│  │     ├─ アイテム tap   →  [S-04 詳細]                   │
│  │     └─「出品テキスト生成」→ [S-08 出品テキスト生成]      │
│  │                                                       │
│  ├─→ [S-05 新規登録]   submit成功 → [S-04 詳細]            │
│  │                     submit失敗 → 同画面でエラー表示     │
│  │                                                       │
│  ├─→ [S-12 設定]                                          │
│  │     └─→ [S-13 ゴミ箱]   復元 → [S-04 詳細]              │
│  │                         完全削除 → 同画面              │
│  │                                                       │
│  └─→ （後追い）[S-09 構成] / [S-10 集計] / [S-11 売却履歴]│
│                                                          │
│ [S-04 詳細]                                              │
│  ├─「編集」     → [S-06 編集]   保存 → [S-04 詳細]         │
│  ├─「使った」   → 同画面（last_used_at更新トースト）       │
│  ├─「状態変更」 → 同画面（usage_status更新トースト）       │
│  ├─「出品文生成」→ [S-08 出品テキスト生成]                 │
│  └─「削除」     → 確認ダイアログ → [S-03 一覧]（論理削除）│
└──────────────────────────────────────────────────────────┘

[ログアウト] ─→ [S-01 ログイン]
[未認証で保護画面へアクセス] ─→ [S-01 ログイン]（戻り先を保持）
```

#### 4.2.2 各画面で扱う特殊状態

| 画面 | 空状態 | エラー状態 | ローディング |
|------|--------|------------|--------------|
| S-02 ホーム | 「まだ登録がありません」+ 登録CTA | サーバ取得失敗時はリトライボタン | スケルトン |
| S-03 一覧 | フィルタ条件下で0件: 「条件に合うアイテムがありません」 | 同上 | スケルトンカード×6 |
| S-04 詳細 | 写真未登録: プレースホルダ表示 | 404: 「アイテムが見つかりません」+ 一覧へ戻るリンク | スケルトン |
| S-05 登録 | — | 写真アップロード失敗: 個別に再送ボタン／全体送信失敗: フォーム値保持＋再試行 | 送信中はボタンdisable + プログレス |
| S-07 出品候補 | 候補0件: 「出品候補はありません 🎉」 | 同S-02 | スケルトン |
| S-08 出品文生成 | — | サイト未選択: 操作不可 | 生成は同期的（即時） |
| S-13 ゴミ箱 | 「ゴミ箱は空です」 | — | スケルトン |

#### 4.2.3 オフライン時の挙動
- 一覧・詳細・ゴミ箱は Service Worker キャッシュで閲覧可。
- 登録・編集・削除はオフラインでは不可（明示的に「オンラインで再試行してください」表示）。
- 写真アップロード中にオフライン化した場合は IndexedDB に再送キューを保持し、復帰時に自動再送（R-01）。

### 4.3 主要画面の要件メモ

#### S-05 新規登録
- ステップ1: 写真撮影／選択（必須最低1枚を推奨、未登録でも保存可）
- ステップ2: 共通項目（購入元・購入日・商品名・金額・カテゴリなど）
- ステップ3: カテゴリ別項目（ファッション or ハイエース）
- スマホでは カメラ起動 → 撮影 → 自動でアップロード開始（バックグラウンド）
- 入力中の値は localStorage に下書き保存し、誤遷移時の喪失を防ぐ

#### S-07 出品候補一覧
- 抽出条件:
  1. usage_status = 'unused'
  2. または `last_used_at` が現在日から180日以上前
- 除外: usage_status が listing / sold / disposed のもの
- 「出品テキスト生成へ」ボタンから S-08 へ遷移

#### S-08 出品テキスト生成
- 出品先サイトを選択（メルカリ / ヤフーフリマ / ラクマ / PayPayフリマ / ヤフオク 等）
- サイトごとの文字数上限に合わせ、タイトル案・本文案を生成
- 推奨価格帯は「購入金額からのレンジ」を機械的に提示（例: 購入額の40〜70%）
- コピー用ボタン（タイトル / 本文 / 価格）を個別に配置

---

## 5. ディレクトリ構成案（Next.js 15 App Router）

```
購入使用状況管理アプリ/
├── docs/
│   └── requirements.md            ← 本ドキュメント
├── public/
│   ├── icons/                      PWAアイコン
│   └── manifest.webmanifest
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                S-02 ホーム
│   │   ├── (auth)/
│   │   │   └── login/page.tsx      S-01
│   │   ├── items/
│   │   │   ├── page.tsx            S-03 一覧
│   │   │   ├── new/page.tsx        S-05 新規登録
│   │   │   ├── trash/page.tsx      S-13 ゴミ箱
│   │   │   └── [id]/
│   │   │       ├── page.tsx        S-04 詳細
│   │   │       ├── edit/page.tsx   S-06 編集
│   │   │       └── listing-text/page.tsx  S-08 出品テキスト生成
│   │   ├── listing-candidates/
│   │   │   └── page.tsx            S-07 出品候補
│   │   ├── haiace-build/
│   │   │   └── page.tsx            S-09 構成ビュー（後追い）
│   │   ├── stats/
│   │   │   └── page.tsx            S-10 集計（後追い）
│   │   ├── sales/
│   │   │   └── page.tsx            S-11 売却履歴（後追い）
│   │   ├── settings/
│   │   │   └── page.tsx            S-12 設定
│   │   └── api/
│   │       └── （必要に応じてRoute Handler）
│   ├── components/
│   │   ├── ui/                     shadcn/ui 生成物
│   │   ├── items/                  一覧カード、フィルタ、フォーム部品
│   │   ├── photos/                 写真アップローダ、ギャラリー
│   │   └── listing/                出品テキスト生成UI
│   ├── features/
│   │   ├── items/                  ドメインロジック（取得・登録・更新）
│   │   ├── listing-candidates/     抽出ロジック
│   │   └── listing-text/           サイト別テンプレ生成
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           ブラウザ用クライアント
│   │   │   ├── server.ts           Server Component / Route Handler用
│   │   │   └── types.ts            DB型（supabase gen types）
│   │   ├── validators/             zodスキーマ
│   │   └── utils/
│   ├── hooks/
│   ├── styles/
│   │   └── globals.css
│   └── types/
├── supabase/
│   ├── migrations/                 SQLマイグレーション
│   └── seed.sql                    マスタデータ初期投入
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 6. 技術スタックと非機能要件

### 6.1 技術スタック
| レイヤ | 技術 |
|--------|------|
| フロント | Next.js 15（App Router）+ TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| 認証 | Supabase Auth |
| DB | Supabase (PostgreSQL) + Row Level Security |
| ストレージ | Supabase Storage |
| ホスティング | Vercel |
| PWA | next-pwa もしくは自前で manifest + Service Worker |
| バリデーション | zod |
| フォーム | react-hook-form |
| 画像処理 | next/image（必要なら browser-image-compression でアップロード前圧縮） |

### 6.2 非機能要件
| 区分 | 要件 |
|------|------|
| 認証 | 個人利用前提だが、必ずログイン必須。RLSで他ユーザーのデータが見えないこと。新規ユーザー登録は管理者承認制 or オフ（自分のアカウントのみ） |
| パフォーマンス | 一覧表示は1000件程度までストレスなく操作可能（ページング or 仮想リスト）。初回LCP 2.5s以内（モバイル4G） |
| オフライン | 一覧・詳細の閲覧のみ最低限オフライン可（Service Workerによるキャッシュ） |
| レスポンシブ | スマホ縦持ち優先で設計し、PCではグリッド密度を上げる |
| 入力UX | 写真撮影から登録完了まで30秒以内（理想） |
| バックアップ | Supabaseの自動バックアップに依存。CSVエクスポートは後追い検討 |
| アクセシビリティ | shadcn/uiの標準準拠（最低限のARIA・キーボード操作）を維持 |

### 6.3 セキュリティ
| 項目 | 方針 |
|------|------|
| 認証 | Supabase Auth。セッションは httpOnly Cookie（@supabase/ssr）。Magic Link または メール+パスワード（パスワード最低12文字） |
| 認可 | 全テーブル RLS 有効化。`user_id = auth.uid()` を必須条件として全ポリシーに含める |
| 機密情報 | Supabase の `service_role` キーはサーバ側環境変数のみ。クライアントからは使用しない（`anon` キーのみ露出） |
| Storage | バケットはprivate。署名付きURLを都度発行。直接URL公開は行わない |
| CSP | Next.js の `next.config.ts` で Content-Security-Policy を設定（`script-src 'self'`、Supabase ドメイン許可） |
| XSS | React の標準エスケープに依存。`dangerouslySetInnerHTML` は原則禁止 |
| 入力検証 | 全Server Action / Route Handler で zod による入力スキーマ検証を必須化 |
| ファイルアップロード | MIMEタイプを `image/jpeg|png|webp|heic` に制限。EXIFは保持（撮影日メタとして将来活用余地） |
| レート制限 | Vercel/Supabase標準の制限に依存。明示的なレート制限はMVPでは設けない |
| 依存ライブラリ | `npm audit` を CI で実行（後追いでDependabot連携） |

### 6.4 ロギング・モニタリング
| 項目 | 方針 |
|------|------|
| クライアントエラー | Vercel Web Analytics + Sentry（無料枠）でJSエラーを収集（後追い検討） |
| サーバログ | Server Action / Route Handler のエラーは `console.error` に出力 → Vercel Logs に集約 |
| アクセスログ | Vercel 標準のアクセスログを利用 |
| DBログ | Supabase Dashboard のログビューを必要時に参照（本アプリ側からは送信しない） |
| 個人情報のログ | 商品名・メモなどの本文はログ出力しない。エラーログには `item_id` 等のIDのみ |
| 通知 | MVPではアラート通知なし。L-05（出品候補通知）導入時に検討 |

### 6.5 テスト方針
| レイヤ | ツール | 方針 |
|--------|--------|------|
| 型チェック | TypeScript `tsc --noEmit` | CI必須 |
| Lint | ESLint + Prettier | CI必須 |
| ユニット | Vitest | `lib/` 配下のドメインロジック（出品候補抽出・出品テキスト生成・バリデータ）を中心にカバー |
| 結合 | Vitest + Supabase ローカル / @testing-library/react | 主要 Server Action と主要画面のレンダリング |
| E2E | Playwright（後追い） | MVP段階では手動E2E。後追いで「登録→一覧→詳細→出品候補」のゴールデンパスを自動化 |
| カバレッジ目標 | ドメインロジックのみ80%以上、UIは課さない | 過剰なテストは個人開発の機動性を損なうため、価値ある箇所に絞る |

### 6.6 環境変数一覧（`.env.local.example`）

```
# Supabase（クライアント・サーバ両方で使用）
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# サーバ側のみ（Server Action / Route Handler / Migration）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# アプリ動作設定
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 出品候補の閾値（日数）。未設定時はデフォルト180日
LISTING_CANDIDATE_THRESHOLD_DAYS=180

# 後追い: Sentry（任意）
# NEXT_PUBLIC_SENTRY_DSN=
```

`SUPABASE_SERVICE_ROLE_KEY` は **絶対にクライアントに渡さない**。`.env.local` は `.gitignore` で除外。

### 6.7 設計判断・実装方針

#### API実装方式: Server Actions を主、Route Handler を補助
- **書き込み系**（登録・更新・削除）は Server Actions を採用。フォームから直接呼び出せて型安全、CSRF対策が標準で組み込まれる。
- **読み取り系**は Server Component から Supabase クライアントを直接呼び出す。
- **Route Handler (`/api/*`)** は以下の場合のみ使用:
  - Webhook受信（後追い）
  - クライアントJSから直接叩く必要があるエンドポイント（写真の署名URL再発行など）
  - 外部からアクセスされるエンドポイント

#### 検索の実装
- MVPでは **PostgreSQL の `ILIKE` 部分一致** を商品名・メモ・店舗名・ブランド・保管場所に対して実行。
- 件数が増えて遅くなった時点で **`pg_trgm` の GIN インデックス** を追加（マイグレーションで切替）。
- 全文検索（`tsvector`）は日本語形態素解析の手間に対して効果が薄いため、当面導入しない。

#### 出品候補の閾値（180日）
- 環境変数 `LISTING_CANDIDATE_THRESHOLD_DAYS`（デフォルト180）で全体既定値を持つ。
- 後追いで設定画面から変更可能にする（user_settings テーブル新設）。
- MVP段階では環境変数のみで運用。

#### ゴミ箱の保持期限
- 無期限保持（個人利用前提）。完全削除はゴミ箱画面から手動操作のみ。
- ゴミ箱に入れた瞬間、紐づく `item_photos` のSupabase Storage実体は **保持** する（復元できるように）。完全削除時にDBレコードと共にStorageからも削除。

#### 画像の扱い
- アップロード前にクライアントで圧縮（`browser-image-compression`、長辺1600px・JPEG品質80）。
- 1アイテムあたり最大15枚（商品12 + レシート3）。
- サーバ受信時のサイズ上限は5MB/枚。MIMEは jpeg/png/webp/heic を許可。

#### 状態遷移ルール（usage_status）
```
        ┌─────────────────────────────────────┐
        │                                     ▼
[unused] ─→ [in_use] ⇄ [storing] ─→ [listing] ─→ [sold]
                              └────────────────→ [disposed]
```
- 任意の状態から `disposed` への遷移は許可。
- `sold` から他状態への戻しは許可（誤操作復旧のため）。
- 状態遷移時は `usage_logs` に記録。

#### バリデーション
- フォームのスキーマは `lib/validators/` に zod で定義。
- クライアント（react-hook-form の resolver）とサーバ（Server Action）で同じスキーマを再利用。
- DBの CHECK 制約と zod スキーマは値域を一致させる（変更時は両方更新）。

#### マイグレーション運用
- `supabase/migrations/` に通し番号付きSQLを置く（例: `0001_init.sql`、`0002_add_sales.sql`）。
- マスタデータは `supabase/seed.sql` に分離し、再投入可能（ON CONFLICT DO NOTHING）にする。
- 本番反映は Supabase CLI 経由で手動。CI連携は後追い。

---

## 7. 想定される課題と対処方針

| # | 課題 | 影響 | 対処方針 |
|---|------|------|----------|
| R-01 | スマホでの写真アップロードが遅い／失敗する | 登録UXの致命傷 | クライアントで圧縮（長辺1600px程度／JPEG品質80）してからアップロード。失敗時は再送キュー（IndexedDB）で吸収 |
| R-02 | 「最終使用日」を更新する習慣がつかず、出品候補が機能しない | 機能F-05が形骸化 | 詳細画面に「使った」ワンタップボタンを設置し、`usage_logs`と`items.last_used_at`を同時更新。週次の通知（後追いL-05）で促す |
| R-03 | カテゴリ別の固有項目で、テーブル分割か単一テーブルJSONかの設計判断 | スキーマ柔軟性 vs クエリ容易性 | 3.0「スキーマ設計判断」で3案比較のうえ案A（テーブル分割）を採用。整合性は3.6 C-05/C-06 のトリガで担保。将来カテゴリが増えそうな兆候が出たら案B（JSONB）への移行を検討 |
| R-04 | 購入元マスタの「その他」入力が散在し、表記ゆれが発生 | 集計の精度劣化 | `marketplace_other_name`は自由入力としつつ、設定画面（後追い）でマスタへ昇格できる導線を用意。集計画面では「その他」をまとめて表示し、必要に応じて細分化 |
| R-05 | 画像ストレージ容量の肥大化 | コスト・性能 | 圧縮済みのみ保存／削除時は紐づく画像も即時削除（DBトリガ or アプリ側）／古い「処分済み」アイテムは画像のみアーカイブする運用を将来検討 |
| R-06 | 出品テキストの自動生成精度 | F-06の有用性 | MVPではテンプレ＋プレースホルダ置換のみで開始。将来的にLLM連携を検討するが、本要件のスコープ外 |
| R-07 | 出品先サイトの文字数制限・仕様変更 | テンプレ陳腐化 | サイトごとの制限値は定数として一元管理（lib/listing-templates.ts）。仕様変更時はそこだけ更新で済むようにする |
| R-08 | iOS Safari のPWA制約（カメラ・ストレージ） | スマホUXの低下 | カメラは `<input type="file" capture="environment">` で確実に動作するパスを基本とし、PWAとしてのインストールはあくまで補助的位置づけ |
| R-09 | 家族共有時のデータ分離方針 | 将来要件 | 「世帯（household）」概念を後追いで導入する設計余地を残す。MVPでは `user_id` 単位、後追いで `household_id` を追加してマイグレーション可能にする |
| R-10 | レシートOCRの精度・コスト | L-01実装時 | MVP対象外。導入時はクラウドAPI（Google Vision等）を検討し、月次コストを試算してから判断 |
| R-11 | 論理削除と参照整合性 | データ復旧／集計の一貫性 | `is_deleted`をビューでフィルタしたクエリを基本とする。`usage_logs`等の子データは残し、復元時にそのまま見えるようにする |
| R-12 | タイムゾーン | 日付ズレ | 購入日・最終使用日など日付項目は date 型（時間なし）で扱い、タイムスタンプは timestamptz で UTC 保存。表示時にAsia/Tokyoへ変換 |

---

## 8. 用語

| 用語 | 定義 |
|------|------|
| アイテム | 本アプリで管理する購入品1つを指す |
| 購入元 | フリマサイト・オークションサイト・実店舗などの入手チャネル |
| 出品候補 | 「未使用」もしくは「最終使用日から180日以上経過」のアイテム |
| ハイエースカスタム | トヨタ ハイエース に取り付けるカスタムパーツ全般 |

---

## 9. 今後のアクション（要件確定後）

1. 本要件定義のレビュー・フィックス
2. Supabaseプロジェクト作成、マイグレーションSQL（DDL）作成
3. Next.jsプロジェクト初期化、shadcn/ui導入、基本レイアウト
4. 認証 → 一覧 → 登録 → 詳細 の順でMVP実装
5. 出品候補抽出 / 出品テキスト生成
6. PWA対応・Vercelデプロイ
7. 後追い機能の優先度付け
