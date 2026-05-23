-- ============================================================================
--  BRANDING — run ONCE in the Supabase SQL editor.
--  Registers a `business_logo_url` setting. After running, a "Logo URL" field
--  appears in admin Settings → Business. Paste your uploaded logo's public URL
--  there, save, and it shows everywhere (sidebar, login, storefront, footer).
-- ============================================================================
insert into settings (key, value, label, category, type, is_public)
values ('business_logo_url', '', 'Logo URL', 'business', 'text', true)
on conflict (key) do nothing;
