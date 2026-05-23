# Auto Supply — Admin

Branch-aware auto parts platform. Next.js 14 (App Router) + Supabase + Tailwind.

- **Phase 1** ✓ — admin shell, auth, settings module
- **Phase 2** ✓ — Products / Categories / Brands CRUD + per-branch inventory
- **Phase 3** ✓ — storefront (home, shop, product pages, cart, WhatsApp order)
- **Phase 4** ✓ — on-site checkout, Paystack (card/MoMo), COD, server-side stock
- **Phase 5** ✓ — orders desk, branches admin, live order notifications

## Setup (in order)

### 1. Database — run these in the Supabase SQL editor
1. `supabase/schema.sql`   — tables, RLS on all 14 tables, policies, seeds the main branch
2. `supabase/phase1.sql`   — seeds your first admin (paste your auth UUID in first)
3. `supabase/storage.sql`  — creates the `product-images` bucket + policies
4. `supabase/phase4.sql`   — stock-decrement function used by checkout
5. `supabase/phase5.sql`   — enables Realtime on orders (live admin notifications)

### 2. Create your first admin
1. Supabase → **Authentication → Users → Add user** (your email + password, tick **Auto Confirm**).
2. **Copy** the new user's UUID (don't type it).
3. Paste it into the insert in `supabase/phase1.sql` and run that file.
   (`app_users.id` is a FK to `auth.users`, so a wrong UUID errors instead of failing silently.)

### 3. Environment
```bash
cp .env.local.example .env.local
```
Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
Leave `SUPABASE_SERVICE_ROLE_KEY` until Phase 4 — server-only, never NEXT_PUBLIC_, never committed.

### 4. Run
```bash
npm install
npm run dev
```
`/login` → sign in → dashboard. **Catalogue** to add parts, **Inventory** to set stock,
**Settings** to edit business/payment/delivery values live.

## Folder map
```
app/
  (storefront)/        Phase 3 — public, guest browsing (stubbed)
  dashboard/           admin: products, inventory, orders, branches, settings
  api/paystack/verify  Phase 4 — payment verification (stubbed)
components/
  admin/               ProductForm, TaxonomyManager, Modal
  SettingsProvider, Sidebar
lib/
  supabase/            client (browser) · server · admin (service role, Phase 4)
  queries.ts           products / taxonomy / stock / image upload
  settings.ts · types.ts
supabase/              schema.sql · phase1.sql · storage.sql
```

## Before going public
RLS is on for every table. Guest checkout (Phase 4) writes stock via the service-role key
server-side — customers never write to your DB directly. Don't expose that key to the browser.
