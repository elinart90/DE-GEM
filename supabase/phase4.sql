-- ============================================================================
--  PHASE 4 — run in the Supabase SQL editor after the schema is in place.
--  Atomic stock decrement + sale logging when an order is paid (or COD placed).
--  Called server-side via the service role from /api/paystack/verify and
--  /api/checkout. Looping in one function keeps the writes consistent.
-- ============================================================================
create or replace function decrement_order_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  it record;
  b  uuid;
begin
  select fulfilling_branch_id into b from orders where id = p_order_id;
  if b is null then
    return;  -- no branch resolved; nothing to decrement
  end if;

  for it in
    select product_id, quantity
    from order_items
    where order_id = p_order_id and product_id is not null
  loop
    update branch_stock
      set quantity = greatest(0, quantity - it.quantity)
      where product_id = it.product_id and branch_id = b;

    insert into inventory_logs (product_id, branch_id, change_type, qty_change, reason)
      values (it.product_id, b, 'sale', -it.quantity, 'Order fulfilment');
  end loop;
end $$;
