-- ============================================================================
--  AUTO PARTS E-COMMERCE — DATABASE FOUNDATION (Postgres / Supabase)
-- ============================================================================
--  Design decisions baked in here on purpose (these are the expensive-to-change ones):
--   1. Stock is tracked PER BRANCH, never globally. A "global quantity" column is
--      a one-way door — once orders depend on it you cannot split it by branch
--      without a migration + downtime. So we never create one.
--   2. Orders carry the customer's region AND a fulfilling_branch_id. v1 always
--      resolves to the main branch; the data is ready for region routing later.
--   3. order_items SNAPSHOT the name and price at purchase time. A live product
--      price must NEVER change what an old invoice says. Invoices are records.
--   4. Soft delete on products/categories/brands (is_deleted). Orders/invoices
--      are never deleted, only cancelled. History must survive.
-- ============================================================================

create extension if not exists pgcrypto;          -- gen_random_uuid()

-- Reusable updated_at trigger ------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ============================================================================
--  BRANCHES  (first-class. adding a branch later = INSERT one row, no rebuild)
-- ============================================================================
create table branches (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  region      text not null,            -- one of Ghana's 16 regions
  town        text,
  phone       text,
  whatsapp    text,
  is_main     boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
-- Exactly one main branch is enforceable with a partial unique index:
create unique index one_main_branch on branches (is_main) where is_main = true;

-- ============================================================================
--  CATEGORIES & BRANDS  (soft delete — referenced by products/invoices forever)
-- ============================================================================
create table categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  is_deleted  boolean not null default false,
  created_at  timestamptz not null default now()
);

create table brands (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  is_deleted  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================================
--  PRODUCTS  (the global definition. STOCK lives in branch_stock, not here.)
-- ============================================================================
create table products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  sku           text unique not null,
  description   text,
  category_id   uuid references categories(id),
  brand_id      uuid references brands(id),
  price         numeric(12,2) not null check (price >= 0),   -- GH₵
  image_urls    text[] default '{}',
  vehicle_fit   text,                 -- e.g. "Toyota Corolla 2008-2013"
  is_genuine    boolean not null default false,  -- the authenticity claim — keep honest
  is_active     boolean not null default true,   -- visible on storefront
  is_deleted    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger products_updated before update on products
  for each row execute function set_updated_at();
create index products_category_idx on products(category_id);
create index products_brand_idx    on products(brand_id);

-- ============================================================================
--  BRANCH STOCK  (the heart of multi-branch. one row per product per branch.)
-- ============================================================================
create table branch_stock (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products(id),
  branch_id       uuid not null references branches(id),
  quantity        integer not null default 0 check (quantity >= 0),
  low_stock_at    integer not null default 5,   -- alert threshold
  updated_at      timestamptz not null default now(),
  unique (product_id, branch_id)
);
create trigger branch_stock_updated before update on branch_stock
  for each row execute function set_updated_at();

-- ============================================================================
--  CUSTOMERS
-- ============================================================================
create table customers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text not null,
  email       text,
  region      text,
  address     text,
  created_at  timestamptz not null default now()
);
create index customers_phone_idx on customers(phone);

-- ============================================================================
--  ORDERS  (region routing lives here. status drives the whole fulfilment flow.)
-- ============================================================================
create table orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        text unique not null,         -- human-friendly, e.g. ORD-000123
  customer_id         uuid references customers(id),
  fulfilling_branch_id uuid references branches(id), -- v1: always main branch
  customer_region     text,                          -- captured for future routing
  delivery_address    text,
  status              text not null default 'pending'
                        check (status in ('pending','paid','processing','shipped','delivered','cancelled')),
  payment_method      text check (payment_method in ('momo','card','bank','cash_on_delivery')),
  payment_status      text not null default 'unpaid'
                        check (payment_status in ('unpaid','paid','refunded')),
  subtotal            numeric(12,2) not null default 0,
  delivery_fee        numeric(12,2) not null default 0,
  total               numeric(12,2) not null default 0,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger orders_updated before update on orders
  for each row execute function set_updated_at();
create index orders_status_idx on orders(status);
create index orders_branch_idx on orders(fulfilling_branch_id);

-- ============================================================================
--  ORDER ITEMS  (SNAPSHOT name + price. never join to live product for totals.)
-- ============================================================================
create table order_items (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references orders(id) on delete cascade,
  product_id          uuid references products(id),   -- may be null if product later removed
  product_name        text not null,                  -- snapshot
  unit_price          numeric(12,2) not null,         -- snapshot
  quantity            integer not null check (quantity > 0)
);
create index order_items_order_idx on order_items(order_id);

-- ============================================================================
--  RIDERS & DELIVERIES
-- ============================================================================
create table riders (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text not null,
  branch_id   uuid references branches(id),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table deliveries (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id),
  rider_id      uuid references riders(id),
  status        text not null default 'unassigned'
                  check (status in ('unassigned','assigned','out_for_delivery','delivered','failed')),
  assigned_at   timestamptz,
  delivered_at  timestamptz,
  cash_collected numeric(12,2),     -- for cash/MoMo-on-delivery reconciliation
  created_at    timestamptz not null default now()
);

-- ============================================================================
--  INVENTORY LOGS  (every stock movement — your "you sold a part that's gone" insurance)
-- ============================================================================
create table inventory_logs (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products(id),
  branch_id     uuid not null references branches(id),
  change_type   text not null check (change_type in ('stock_in','sale','damaged','return','adjustment')),
  qty_change    integer not null,    -- + or -
  reason        text,
  user_id       uuid,                -- who did it (auth.users)
  created_at    timestamptz not null default now()
);

-- ============================================================================
--  USERS (roles) & AUDIT LOG
-- ============================================================================
create table app_users (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  role        text not null default 'sales_rep'
                check (role in ('admin','manager','sales_rep')),
  branch_id   uuid references branches(id),   -- scope a rep to one branch (null = all)
  created_at  timestamptz not null default now()
);

create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,
  action      text not null,         -- e.g. 'product.update', 'order.status_change'
  entity_type text,
  entity_id   uuid,
  details     jsonb,
  created_at  timestamptz not null default now()
);

-- ============================================================================
--  SETTINGS  (same pattern you built for Chico Water — nothing displayed is hardcoded)
-- ============================================================================
create table settings (
  key         text primary key,
  value       text,
  label       text,
  category    text,
  type        text default 'text',   -- text|number|boolean|select
  is_public   boolean not null default false  -- public = readable by storefront
);

-- ============================================================================
--  REGION ROUTING FUNCTION
--   v1: there is one branch (main), so this always returns it.
--   v2: when you add branches, this returns the active branch in the customer's
--       region, else falls back to main. The app calls this — the logic lives
--       in ONE place, not scattered across the codebase.
-- ============================================================================
create or replace function resolve_fulfilling_branch(p_region text)
returns uuid language plpgsql as $$
declare b uuid;
begin
  select id into b from branches
    where is_active and region = p_region
    order by is_main desc limit 1;
  if b is null then
    select id into b from branches where is_main and is_active limit 1;
  end if;
  return b;
end $$;

-- ============================================================================
--  SEED — main branch (Tarkwa = you), starter categories/brands, settings
-- ============================================================================
insert into branches (name, region, town, is_main, is_active)
  values ('Main Branch', 'Western', 'Tarkwa', true, true);

insert into categories (name, slug) values
  ('Engine Oil','engine-oil'), ('Oil Filters','oil-filters'),
  ('Air Filters','air-filters'), ('Fuel Filters','fuel-filters'),
  ('Spark Plugs','spark-plugs'), ('Wiper Blades','wiper-blades'),
  ('Diagnostic Tools','diagnostic-tools'), ('Car Care','car-care');

insert into brands (name, slug) values
  ('Bosch','bosch'), ('Castrol','castrol'), ('Toyota','toyota'),
  ('Denso','denso'), ('NGK','ngk');

insert into settings (key, value, label, category, type, is_public) values
  ('business_name','Auto Supply Co.','Business name','business','text',true),
  ('business_phone','+233000000000','Phone','business','text',true),
  ('business_whatsapp','233000000000','WhatsApp','business','text',true),
  ('payment_currency','GH₵','Currency symbol','payment','text',true),
  ('payment_momo_enabled','true','MoMo enabled','payment','boolean',false),
  ('payment_cod_enabled','true','Cash on delivery enabled','payment','boolean',false),
  ('delivery_fee_default','30','Default delivery fee','delivery','number',true);

-- ============================================================================
--  ROW LEVEL SECURITY — every table ON, secure by default. No exposed tables.
--  Storefront (anon) reads only what's public. Staff run operations. Admins
--  manage settings/branches. Checkout writes stock via the SERVICE ROLE key,
--  which bypasses RLS server-side — customers never get write access.
-- ============================================================================

-- Role helpers. SECURITY DEFINER so reading app_users inside a policy runs as
-- the table owner and does NOT recurse through app_users' own RLS.
create or replace function is_admin()
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (select 1 from app_users where id = auth.uid() and role = 'admin');
$$;

create or replace function is_staff()
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (select 1 from app_users where id = auth.uid());
$$;

-- Turn RLS on for EVERY table.
alter table branches       enable row level security;
alter table categories     enable row level security;
alter table brands         enable row level security;
alter table products       enable row level security;
alter table branch_stock   enable row level security;
alter table customers      enable row level security;
alter table orders         enable row level security;
alter table order_items    enable row level security;
alter table riders         enable row level security;
alter table deliveries     enable row level security;
alter table inventory_logs enable row level security;
alter table app_users      enable row level security;
alter table audit_logs     enable row level security;
alter table settings       enable row level security;

-- ---- Storefront: anonymous visitors read only public, live data --------------
create policy public_products   on products   for select using (is_active and not is_deleted);
create policy public_categories on categories for select using (not is_deleted);
create policy public_brands     on brands     for select using (not is_deleted);
create policy public_settings   on settings   for select using (is_public);

-- ---- Staff: any authenticated user who exists in app_users -------------------
create policy staff_products     on products      for all    using (is_staff()) with check (is_staff());
create policy staff_categories   on categories    for all    using (is_staff()) with check (is_staff());
create policy staff_brands       on brands        for all    using (is_staff()) with check (is_staff());
create policy staff_branches     on branches      for select using (is_staff());
create policy staff_branch_stock on branch_stock  for all    using (is_staff()) with check (is_staff());
create policy staff_customers    on customers     for all    using (is_staff()) with check (is_staff());
create policy staff_orders       on orders        for all    using (is_staff()) with check (is_staff());
create policy staff_order_items  on order_items   for all    using (is_staff()) with check (is_staff());
create policy staff_riders       on riders        for all    using (is_staff()) with check (is_staff());
create policy staff_deliveries   on deliveries    for all    using (is_staff()) with check (is_staff());
create policy staff_inv_logs     on inventory_logs for all   using (is_staff()) with check (is_staff());

-- ---- Admin-only writes -------------------------------------------------------
create policy admin_branches_write on branches   for all    using (is_admin()) with check (is_admin());
create policy admin_settings_write on settings    for all    using (is_admin()) with check (is_admin());
create policy admin_audit_read     on audit_logs  for select using (is_admin());

-- ---- app_users: read your own row; admins manage everyone --------------------
create policy app_users_self_read   on app_users for select using (auth.uid() = id);
create policy app_users_admin_read  on app_users for select using (is_admin());
create policy app_users_admin_write on app_users for all    using (is_admin()) with check (is_admin());
