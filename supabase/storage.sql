-- ============================================================================
--  STORAGE — product images bucket. Run in the Supabase SQL editor after
--  schema.sql, OR create the bucket in Dashboard → Storage and add the policies.
-- ============================================================================

-- Public bucket so storefront <img> tags can load images directly.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Anyone can READ product images (they're public product photos).
create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Only staff (rows in app_users) can upload / replace / delete them.
create policy "product_images_staff_write"
  on storage.objects for all
  using (bucket_id = 'product-images' and public.is_staff())
  with check (bucket_id = 'product-images' and public.is_staff());
