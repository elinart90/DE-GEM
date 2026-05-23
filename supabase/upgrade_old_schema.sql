-- ============================================================================
--  UPGRADE — run ONCE in the Supabase SQL editor.
--  You ran the OLD schema.sql. This brings that database up to the secure
--  version WITHOUT dropping tables or losing data:
--    1. app_users.id becomes a real FK to auth.users
--    2. is_admin() / is_staff() role helpers
--    3. RLS enabled on the 10 tables the old file left open
--    4. staff/admin write policies so the admin app can actually read & write
--  Safe to re-run (every policy is dropped before it's created).
-- ============================================================================

-- 1. Foreign key on app_users.id ------------------------------------------------
--    If this errors, an app_users row has an id that is NOT a real auth user
--    (the silent-typo trap). Delete that bad row, then re-run.
alter table app_users drop constraint if exists app_users_id_fkey;
alter table app_users
  add constraint app_users_id_fkey
  foreign key (id) references auth.users(id) on delete cascade;

-- 2. Role helpers (SECURITY DEFINER so reading app_users in a policy can't recurse)
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

-- 3. Enable RLS on the tables the old schema left exposed ------------------------
alter table branches       enable row level security;
alter table branch_stock   enable row level security;
alter table customers      enable row level security;
alter table orders         enable row level security;
alter table order_items    enable row level security;
alter table riders         enable row level security;
alter table deliveries     enable row level security;
alter table inventory_logs enable row level security;
alter table app_users      enable row level security;
alter table audit_logs     enable row level security;
-- products / categories / brands / settings already had RLS from the old file.

-- 4. Policies (drop-then-create = re-runnable) ----------------------------------
-- Staff = any authenticated row in app_users.  Admin = role 'admin'.

drop policy if exists staff_products on products;
create policy staff_products on products for all using (is_staff()) with check (is_staff());
drop policy if exists staff_categories on categories;
create policy staff_categories on categories for all using (is_staff()) with check (is_staff());
drop policy if exists staff_brands on brands;
create policy staff_brands on brands for all using (is_staff()) with check (is_staff());

drop policy if exists staff_branches on branches;
create policy staff_branches on branches for select using (is_staff());
drop policy if exists admin_branches_write on branches;
create policy admin_branches_write on branches for all using (is_admin()) with check (is_admin());

drop policy if exists staff_branch_stock on branch_stock;
create policy staff_branch_stock on branch_stock for all using (is_staff()) with check (is_staff());
drop policy if exists staff_customers on customers;
create policy staff_customers on customers for all using (is_staff()) with check (is_staff());
drop policy if exists staff_orders on orders;
create policy staff_orders on orders for all using (is_staff()) with check (is_staff());
drop policy if exists staff_order_items on order_items;
create policy staff_order_items on order_items for all using (is_staff()) with check (is_staff());
drop policy if exists staff_riders on riders;
create policy staff_riders on riders for all using (is_staff()) with check (is_staff());
drop policy if exists staff_deliveries on deliveries;
create policy staff_deliveries on deliveries for all using (is_staff()) with check (is_staff());
drop policy if exists staff_inv_logs on inventory_logs;
create policy staff_inv_logs on inventory_logs for all using (is_staff()) with check (is_staff());

drop policy if exists admin_settings_write on settings;
create policy admin_settings_write on settings for all using (is_admin()) with check (is_admin());
drop policy if exists admin_audit_read on audit_logs;
create policy admin_audit_read on audit_logs for select using (is_admin());

drop policy if exists app_users_self_read on app_users;
create policy app_users_self_read on app_users for select using (auth.uid() = id);
drop policy if exists app_users_admin_read on app_users;
create policy app_users_admin_read on app_users for select using (is_admin());
drop policy if exists app_users_admin_write on app_users;
create policy app_users_admin_write on app_users for all using (is_admin()) with check (is_admin());

-- Your existing storefront_* SELECT policies stay as-is — same effect as the
-- public_* names in the new schema, so there's nothing to rename.

-- ---------------------------------------------------------------------------
-- After this runs:
--   • Adding products / categories / brands and saving settings will work
--     (you must be signed in as your admin — is_admin() checks auth.uid()).
--   • orders / customers / branch_stock / logs are no longer world-readable.
-- If you haven't yet: also run supabase/storage.sql so image upload works.
-- ---------------------------------------------------------------------------
