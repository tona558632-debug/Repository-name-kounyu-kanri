-- ============================================================
-- 0001_init.sql
-- 購入品・在庫管理アプリ 初期スキーマ
-- 要件定義書 v0.2 / セクション 3.2 〜 3.6 に対応
-- ============================================================

-- 拡張
create extension if not exists pgcrypto;

-- ============================================================
-- 共通: updated_at 自動更新トリガ関数（C-10）
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- マスタテーブル
-- ============================================================

-- 3.2.2 購入元マスタ
create table public.marketplaces (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  is_other boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_marketplaces_updated_at
  before update on public.marketplaces
  for each row execute function public.set_updated_at();

-- 3.2.3 カテゴリマスタ
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code in ('fashion','haiace','other')),
  name text not null,
  sort_order int not null default 0
);

-- 3.2.8 ハイエース取付位置マスタ
create table public.haiace_positions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  sort_order int not null default 0
);

-- 3.2.10 ハイエース用途マスタ
create table public.haiace_purposes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  sort_order int not null default 0
);

-- ============================================================
-- 3.2.4 items（中核テーブル）
-- ============================================================
create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  marketplace_id uuid not null references public.marketplaces(id),
  marketplace_other_name text,
  seller_name text,
  name text not null,
  -- C-02: 金額は0以上
  purchase_price int not null check (purchase_price >= 0),
  shipping_fee int not null default 0 check (shipping_fee >= 0),
  purchase_date date not null,
  memo text,
  -- C-01: usage_status は許可値のみ
  usage_status text not null default 'storing'
    check (usage_status in ('in_use','storing','unused','listing','sold','disposed')),
  last_used_at date,
  storage_location text,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- C-03: 購入日 <= 最終使用日
  constraint chk_items_use_after_purchase
    check (last_used_at is null or last_used_at >= purchase_date)
);

create index idx_items_user_category   on public.items(user_id, category_id) where is_deleted = false;
create index idx_items_user_status     on public.items(user_id, usage_status) where is_deleted = false;
create index idx_items_user_last_used  on public.items(user_id, last_used_at) where is_deleted = false;
create index idx_items_user_marketplace on public.items(user_id, marketplace_id) where is_deleted = false;

create trigger trg_items_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- C-04: marketplace_other_name の整合性
--   購入元が is_other=true なら必須、そうでなければ NULL
-- ------------------------------------------------------------
create or replace function public.check_marketplace_other_name()
returns trigger
language plpgsql
as $$
declare
  v_is_other boolean;
begin
  select is_other into v_is_other
    from public.marketplaces
    where id = new.marketplace_id;

  if v_is_other and (new.marketplace_other_name is null or btrim(new.marketplace_other_name) = '') then
    raise exception '購入元が「その他」の場合は marketplace_other_name が必須です';
  end if;

  if not v_is_other and new.marketplace_other_name is not null then
    raise exception '購入元が「その他」以外の場合は marketplace_other_name は指定できません';
  end if;

  return new;
end;
$$;

create trigger trg_items_check_marketplace_other_name
  before insert or update of marketplace_id, marketplace_other_name on public.items
  for each row execute function public.check_marketplace_other_name();

-- ------------------------------------------------------------
-- カテゴリ変更時、無関係になった詳細レコードを連動削除
-- （C-05 / C-06 のサポート）
-- ------------------------------------------------------------
create or replace function public.cleanup_item_category_details()
returns trigger
language plpgsql
as $$
begin
  if old.category_id is distinct from new.category_id then
    delete from public.fashion_details where item_id = new.id;
    delete from public.haiace_details where item_id = new.id;
    delete from public.haiace_part_positions where item_id = new.id;
    delete from public.haiace_part_purposes where item_id = new.id;
  end if;
  return new;
end;
$$;

-- ============================================================
-- 3.2.5 item_photos
-- ============================================================
create table public.item_photos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  storage_path text not null,
  kind text not null check (kind in ('product','receipt')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_item_photos_item on public.item_photos(item_id, sort_order);

-- ============================================================
-- 3.2.6 fashion_details（C-05）
-- ============================================================
create table public.fashion_details (
  item_id uuid primary key references public.items(id) on delete cascade,
  item_type text check (item_type in ('tops','bottoms','outer','shoes','accessory','other')),
  size text,
  brand text,
  color text
);

create or replace function public.check_fashion_category()
returns trigger
language plpgsql
as $$
declare
  v_code text;
begin
  select c.code into v_code
    from public.items i
    join public.categories c on c.id = i.category_id
    where i.id = new.item_id;

  if v_code is null then
    raise exception 'fashion_details: 親 items が存在しません (item_id=%)', new.item_id;
  end if;

  if v_code <> 'fashion' then
    raise exception 'fashion_details はカテゴリが fashion の items にのみ付与可能です（current: %）', v_code;
  end if;

  return new;
end;
$$;

create trigger trg_fashion_details_check_category
  before insert or update on public.fashion_details
  for each row execute function public.check_fashion_category();

-- ============================================================
-- 3.2.7 haiace_details（C-06）
-- ============================================================
create table public.haiace_details (
  item_id uuid primary key references public.items(id) on delete cascade,
  install_status text not null default 'not_installed'
    check (install_status in ('installed','removed','not_installed')),
  road_legal text not null default 'unknown'
    check (road_legal in ('compliant','non_compliant','unknown'))
);

create or replace function public.check_haiace_category()
returns trigger
language plpgsql
as $$
declare
  v_code text;
begin
  select c.code into v_code
    from public.items i
    join public.categories c on c.id = i.category_id
    where i.id = new.item_id;

  if v_code is null then
    raise exception 'haiace_details: 親 items が存在しません (item_id=%)', new.item_id;
  end if;

  if v_code <> 'haiace' then
    raise exception 'haiace_details はカテゴリが haiace の items にのみ付与可能です（current: %）', v_code;
  end if;

  return new;
end;
$$;

create trigger trg_haiace_details_check_category
  before insert or update on public.haiace_details
  for each row execute function public.check_haiace_category();

-- 3.2.9 取付位置 多対多
create table public.haiace_part_positions (
  item_id uuid not null references public.items(id) on delete cascade,
  position_id uuid not null references public.haiace_positions(id),
  primary key (item_id, position_id)
);

-- 3.2.11 用途 多対多
create table public.haiace_part_purposes (
  item_id uuid not null references public.items(id) on delete cascade,
  purpose_id uuid not null references public.haiace_purposes(id),
  primary key (item_id, purpose_id)
);

-- カテゴリ変更時の cleanup トリガを items に貼る（C-05/C-06 補助）
create trigger trg_items_cleanup_category_details
  after update of category_id on public.items
  for each row execute function public.cleanup_item_category_details();

-- ============================================================
-- 3.2.12 usage_logs
-- ============================================================
create table public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  -- C-07
  event_type text not null check (event_type in ('used','status_changed')),
  from_status text,
  to_status text,
  occurred_at timestamptz not null default now()
);

create index idx_usage_logs_item on public.usage_logs(item_id, occurred_at desc);

-- ============================================================
-- 3.2.13 sales（後追い L-04）
-- ============================================================
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  item_id uuid unique not null references public.items(id) on delete cascade,
  sold_at date not null,
  sold_price int not null check (sold_price >= 0),
  sold_marketplace_id uuid references public.marketplaces(id),
  fee int not null default 0 check (fee >= 0),
  shipping_cost int not null default 0 check (shipping_cost >= 0),
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_sales_updated_at
  before update on public.sales
  for each row execute function public.set_updated_at();

-- ============================================================
-- Row Level Security （3.4）
-- ============================================================
alter table public.marketplaces           enable row level security;
alter table public.categories             enable row level security;
alter table public.haiace_positions       enable row level security;
alter table public.haiace_purposes        enable row level security;
alter table public.items                  enable row level security;
alter table public.item_photos            enable row level security;
alter table public.fashion_details        enable row level security;
alter table public.haiace_details         enable row level security;
alter table public.haiace_part_positions  enable row level security;
alter table public.haiace_part_purposes   enable row level security;
alter table public.usage_logs             enable row level security;
alter table public.sales                  enable row level security;

-- マスタ: 認証済みユーザーは参照のみ
create policy "marketplaces_select_authenticated"     on public.marketplaces      for select to authenticated using (true);
create policy "categories_select_authenticated"       on public.categories        for select to authenticated using (true);
create policy "haiace_positions_select_authenticated" on public.haiace_positions  for select to authenticated using (true);
create policy "haiace_purposes_select_authenticated"  on public.haiace_purposes   for select to authenticated using (true);

-- items: 自分のレコードのみ
create policy "items_select_own" on public.items for select to authenticated using (user_id = auth.uid());
create policy "items_insert_own" on public.items for insert to authenticated with check (user_id = auth.uid());
create policy "items_update_own" on public.items for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "items_delete_own" on public.items for delete to authenticated using (user_id = auth.uid());

-- 子テーブル: 親 items の所有者のみ
create policy "item_photos_all" on public.item_photos for all to authenticated
  using (exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid()))
  with check (exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid()));

create policy "fashion_details_all" on public.fashion_details for all to authenticated
  using (exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid()))
  with check (exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid()));

create policy "haiace_details_all" on public.haiace_details for all to authenticated
  using (exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid()))
  with check (exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid()));

create policy "haiace_part_positions_all" on public.haiace_part_positions for all to authenticated
  using (exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid()))
  with check (exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid()));

create policy "haiace_part_purposes_all" on public.haiace_part_purposes for all to authenticated
  using (exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid()))
  with check (exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid()));

create policy "usage_logs_all" on public.usage_logs for all to authenticated
  using (exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid()))
  with check (exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid()));

create policy "sales_all" on public.sales for all to authenticated
  using (exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid()))
  with check (exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid()));

-- ============================================================
-- Storage bucket（3.5）
-- ============================================================
insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', false)
on conflict (id) do nothing;

-- 自分のフォルダ ({user_id}/...) のみアクセス可
create policy "item-photos_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "item-photos_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "item-photos_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "item-photos_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);
