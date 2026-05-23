-- ============================================================================
--  PHASE 5 — run ONCE in the Supabase SQL editor.
--  Enables Realtime on the orders table so the admin gets a live notification
--  the moment a customer places an order. Realtime respects RLS, so only
--  signed-in staff receive these events.
-- ============================================================================
alter publication supabase_realtime add table orders;

-- If you ever get "table is already member of publication", it's already on —
-- safe to ignore.
