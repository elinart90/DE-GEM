-- ============================================================================
--  PHASE 1 SQL — run AFTER schema.sql, in the Supabase SQL editor.
--  schema.sql already sets up RLS + policies. This file only seeds your admin.
-- ============================================================================

-- CREATE YOUR FIRST ADMIN
--   Supabase won't let you insert into auth.users via SQL, so:
--     a) Supabase Dashboard → Authentication → Users → "Add user"
--        Enter your email + password, tick "Auto Confirm User".
--     b) COPY (don't type) that new user's UUID.
--     c) Paste it below and run.
--   This runs as the postgres role in the SQL editor, so it bypasses RLS —
--   the "only admins can make admins" rule doesn't block your first one.

insert into app_users (id, name, role, branch_id)
values (
  '9e2f7363-444e-42bd-994c-11f9c3d90d6b',   -- <-- must match your auth user's UUID exactly
  'Elinart',
  'admin',
  (select id from branches where is_main limit 1)
);

-- Verify it landed and is linked to a branch:
-- select u.id, u.name, u.role, b.name as branch
-- from app_users u left join branches b on b.id = u.branch_id;
