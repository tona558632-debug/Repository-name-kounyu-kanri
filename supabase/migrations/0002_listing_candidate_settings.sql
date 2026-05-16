-- ============================================================
-- 0002_listing_candidate_settings.sql
-- 出品候補のフィルタ条件をユーザーごとに保存する
-- + items に「手動で出品候補に含めるフラグ」を追加
-- ============================================================

-- ------------------------------------------------------------
-- 1) 設定テーブル
-- ------------------------------------------------------------
create table public.listing_candidate_settings (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  threshold_days   int  not null default 180 check (threshold_days >= 0),
  -- 出品候補に含めるステータス（"unused" は通常デフォルト）
  included_statuses text[] not null default array['unused']::text[],
  -- 価格レンジ（null は無制限）
  min_price        int check (min_price is null or min_price >= 0),
  max_price        int check (max_price is null or max_price >= 0),
  -- カテゴリコードでの絞り込み（null/空配列で全カテゴリ）
  category_codes   text[],
  updated_at       timestamptz not null default now(),
  constraint chk_price_order
    check (min_price is null or max_price is null or min_price <= max_price)
);

create trigger trg_listing_candidate_settings_updated_at
  before update on public.listing_candidate_settings
  for each row execute function public.set_updated_at();

alter table public.listing_candidate_settings enable row level security;

create policy "lcs_select_own" on public.listing_candidate_settings
  for select to authenticated using (user_id = auth.uid());
create policy "lcs_insert_own" on public.listing_candidate_settings
  for insert to authenticated with check (user_id = auth.uid());
create policy "lcs_update_own" on public.listing_candidate_settings
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "lcs_delete_own" on public.listing_candidate_settings
  for delete to authenticated using (user_id = auth.uid());

-- ------------------------------------------------------------
-- 2) items に手動フラグを追加
--    条件に当てはまらなくても、ユーザーが個別に出品候補へ強制追加できる。
-- ------------------------------------------------------------
alter table public.items
  add column if not exists force_listing_candidate boolean not null default false;

create index if not exists idx_items_user_force_candidate
  on public.items(user_id) where force_listing_candidate = true and is_deleted = false;
