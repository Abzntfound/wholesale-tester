-- Wholesale Clearance UK — initial Supabase schema
-- Run via Supabase CLI: supabase db push
-- Or paste into Supabase SQL Editor

-- Extensions
create extension if not exists "pg_trgm";

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  product_id text unique not null,
  name text not null,
  slug text unique,
  category text not null,
  subcategory text,
  brand text,
  price numeric(12, 2),
  rrp numeric(12, 2),
  quantity integer default 0,
  condition text,
  description text,
  image_url text,
  product_url text,
  stock_status text not null default 'in_stock',
  product_type text,
  tags text[] default '{}',
  featured boolean not null default false,
  popular boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_slug_idx on public.products (slug);
create index if not exists products_name_trgm_idx on public.products using gin (name gin_trgm_ops);
create index if not exists products_tags_idx on public.products using gin (tags);

-- Product images (normalised)
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_idx on public.product_images (product_id);

-- Wishlists
create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists wishlist_user_idx on public.wishlist_items (user_id);

-- Basket items
create table if not exists public.basket_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists basket_user_idx on public.basket_items (user_id);

-- Customer addresses
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  line1 text not null,
  line2 text,
  city text not null,
  county text,
  postcode text not null,
  country text not null default 'GB',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_number text unique,
  status text not null default 'pending',
  payment_status text not null default 'unpaid',
  subtotal numeric(12, 2) not null default 0,
  vat numeric(12, 2) not null default 0,
  delivery numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  payment_reference text,
  shipping_address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders (user_id);

-- Order line items (snapshot at purchase time)
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  quantity integer not null default 1,
  unit_price numeric(12, 2) not null,
  total numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists basket_items_updated_at on public.basket_items;
create trigger basket_items_updated_at before update on public.basket_items
  for each row execute function public.set_updated_at();

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.basket_items enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Products: public read
drop policy if exists "Products are viewable by everyone" on public.products;
create policy "Products are viewable by everyone"
  on public.products for select using (true);

drop policy if exists "Product images are viewable by everyone" on public.product_images;
create policy "Product images are viewable by everyone"
  on public.product_images for select using (true);

-- Profiles: own data only
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Wishlist
drop policy if exists "Users manage own wishlist" on public.wishlist_items;
create policy "Users manage own wishlist"
  on public.wishlist_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Basket
drop policy if exists "Users manage own basket" on public.basket_items;
create policy "Users manage own basket"
  on public.basket_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Addresses
drop policy if exists "Users manage own addresses" on public.addresses;
create policy "Users manage own addresses"
  on public.addresses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Orders
drop policy if exists "Users view own orders" on public.orders;
create policy "Users view own orders"
  on public.orders for select using (auth.uid() = user_id);

drop policy if exists "Users create own orders" on public.orders;
create policy "Users create own orders"
  on public.orders for insert with check (auth.uid() = user_id);

drop policy if exists "Users view own order items" on public.order_items;
create policy "Users view own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "Users create own order items" on public.order_items;
create policy "Users create own order items"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

-- Full-text search helper (optional RPC)
create or replace function public.search_products(search_query text)
returns setof public.products
language sql stable
as $$
  select *
  from public.products p
  where
    search_query is null
    or search_query = ''
    or p.name ilike '%' || search_query || '%'
    or p.product_id ilike '%' || search_query || '%'
    or p.category ilike '%' || search_query || '%'
    or p.subcategory ilike '%' || search_query || '%'
    or p.brand ilike '%' || search_query || '%'
    or p.description ilike '%' || search_query || '%'
    or p.product_type ilike '%' || search_query || '%'
    or p.condition ilike '%' || search_query || '%'
    or exists (
      select 1 from unnest(coalesce(p.tags, '{}')) t
      where t ilike '%' || search_query || '%'
    )
  order by p.featured desc, p.created_at desc;
$$;

grant execute on function public.search_products(text) to anon, authenticated;
