-- Gonggu Platform (Vite + Supabase) schema
-- Paste this into Supabase SQL editor and run.

-- Extensions
create extension if not exists pgcrypto;

-- =========================
-- Tables
-- =========================

-- Optional: application profile table (not strictly required by current UI)
create table if not exists public.profiles (
  id uuid primary key,
  role text not null check (role in ('producer', 'seller', 'consumer')),
  name text not null,
  store_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  producer_id uuid,
  name text not null,
  description text,
  image_url text,
  wholesale_price integer not null check (wholesale_price >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.gonggu (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid,
  product_id uuid not null references public.products(id) on delete restrict,
  title text not null,
  sale_price integer not null check (sale_price >= 0),
  min_quantity integer not null check (min_quantity > 0),
  current_quantity integer not null default 0 check (current_quantity >= 0),
  deadline timestamptz not null,
  status text not null default 'open' check (status in ('open', 'closed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists gonggu_status_created_at_idx on public.gonggu(status, created_at desc);
create index if not exists gonggu_seller_id_idx on public.gonggu(seller_id);
create index if not exists gonggu_product_id_idx on public.gonggu(product_id);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  gonggu_id uuid not null references public.gonggu(id) on delete cascade,
  consumer_name text not null,
  consumer_phone text not null,
  quantity integer not null check (quantity > 0),
  total_price integer not null check (total_price >= 0),
  created_at timestamptz not null default now()
);

create index if not exists orders_gonggu_id_created_at_idx on public.orders(gonggu_id, created_at desc);

-- =========================
-- Trigger: increment gonggu.current_quantity on order insert
-- =========================

create or replace function public.increment_gonggu_quantity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only count orders for open gonggu
  update public.gonggu
     set current_quantity = current_quantity + new.quantity
   where id = new.gonggu_id
     and status = 'open';

  return new;
end;
$$;

drop trigger if exists orders_after_insert_increment on public.orders;
create trigger orders_after_insert_increment
after insert on public.orders
for each row execute function public.increment_gonggu_quantity();

-- =========================
-- Row Level Security (RLS)
-- =========================

alter table public.products enable row level security;
alter table public.gonggu enable row level security;
alter table public.orders enable row level security;
alter table public.profiles enable row level security;

-- PRODUCTS: 누구나 조회 가능 (홈/상세에서 join)
drop policy if exists "products_select_public" on public.products;
create policy "products_select_public"
on public.products
for select
to public
using (true);

-- GONGGU: 공개 조회는 open만, 판매자는 본인 것 전체 조회/생성 가능
drop policy if exists "gonggu_select_public_open" on public.gonggu;
create policy "gonggu_select_public_open"
on public.gonggu
for select
to public
using (
  status = 'open'
  or (auth.uid() is not null and seller_id = auth.uid())
);

drop policy if exists "gonggu_insert_seller_only" on public.gonggu;
create policy "gonggu_insert_seller_only"
on public.gonggu
for insert
to authenticated
with check (seller_id = auth.uid());

drop policy if exists "gonggu_update_seller_only" on public.gonggu;
create policy "gonggu_update_seller_only"
on public.gonggu
for update
to authenticated
using (seller_id = auth.uid())
with check (seller_id = auth.uid());

-- ORDERS: 비로그인(anon)도 참여 가능. 단 open인 공구에만 insert 허용.
drop policy if exists "orders_insert_public_open_gonggu_only" on public.orders;
create policy "orders_insert_public_open_gonggu_only"
on public.orders
for insert
to public
with check (
  exists (
    select 1
      from public.gonggu g
     where g.id = gonggu_id
       and g.status = 'open'
       and g.deadline > now()
  )
);

-- (선택) 판매자만 자신의 공구 주문 조회 가능
drop policy if exists "orders_select_seller_only" on public.orders;
create policy "orders_select_seller_only"
on public.orders
for select
to authenticated
using (
  exists (
    select 1
      from public.gonggu g
     where g.id = orders.gonggu_id
       and g.seller_id = auth.uid()
  )
);

-- PROFILES: 본인만 읽기/쓰기 (옵션)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

