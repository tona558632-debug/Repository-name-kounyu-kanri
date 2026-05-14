-- ============================================================
-- seed.sql
-- マスタテーブルの初期データ
-- 何度実行しても安全（ON CONFLICT DO NOTHING）
-- ============================================================

-- 購入元マスタ
insert into public.marketplaces (code, name, sort_order, is_other) values
  ('mercari',       'メルカリ',      10, false),
  ('yahoo_fril',    'ヤフーフリマ',  20, false),
  ('yahoo_auction', 'ヤフオク',      30, false),
  ('rakuma',        'ラクマ',        40, false),
  ('paypay_fril',   'PayPayフリマ',  50, false),
  ('amazon',        'Amazon',        60, false),
  ('rakuten',       '楽天市場',      70, false),
  ('retail',        '実店舗',        80, false),
  ('other',         'その他',       999, true)
on conflict (code) do nothing;

-- カテゴリマスタ
insert into public.categories (code, name, sort_order) values
  ('fashion', 'ファッション',         10),
  ('haiace',  'ハイエースカスタム',   20),
  ('other',   'その他',               30)
on conflict (code) do nothing;

-- 取付位置マスタ
insert into public.haiace_positions (code, name, sort_order) values
  ('interior',   '内装',     10),
  ('exterior',   '外装',     20),
  ('engine',     'エンジン', 30),
  ('suspension', '足回り',   40),
  ('electrical', '電装',     50)
on conflict (code) do nothing;

-- 用途マスタ
insert into public.haiace_purposes (code, name, sort_order) values
  ('comfort',     '快適化',     10),
  ('appearance',  '見た目',     20),
  ('camping',     '車中泊',     30),
  ('loading',     '積載',       40),
  ('performance', '走行性能',   50)
on conflict (code) do nothing;
