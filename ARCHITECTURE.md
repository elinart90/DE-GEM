# Auto Parts E-Commerce — Architecture & Build Plan

## The stack (and the one thing we are NOT doing)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | Server-renders product pages so Google indexes them. Same stack as your existing apps. |
| Backend | **Supabase** (Postgres + Auth + Storage + RLS) | It *is* the backend. No separate server. |
| Styling | **Tailwind CSS** | Already your default. |
| Payments | **Paystack** | MoMo + card + bank, built for Ghana. |
| Hosting | **Vercel** | One deploy, same as before. |

**Not using Express.js.** Supabase already gives you the API, auth, and security an
Express server would. Two backends for one job = wasted weeks. **Not using a Vite SPA**
for the storefront — SPAs are bad at SEO, and an e-commerce store that can't be found
on Google is a brochure.

---

## Folder structure

```
auto-supply/
├─ app/
│  ├─ (storefront)/                 # public, server-rendered
│  │  ├─ page.tsx                   # home
│  │  ├─ products/page.tsx          # listing + category/brand filters
│  │  ├─ products/[sku]/page.tsx    # product detail
│  │  ├─ cart/page.tsx
│  │  └─ checkout/page.tsx
│  ├─ dashboard/                    # private admin (auth-guarded)
│  │  ├─ layout.tsx                 # auth check + sidebar
│  │  ├─ page.tsx                   # overview
│  │  ├─ products/                  # product / category / brand CRUD
│  │  ├─ inventory/                 # per-branch stock entry + low-stock alerts
│  │  ├─ orders/                    # fulfilment (phone-friendly)
│  │  ├─ branches/                  # branch CRUD — ready for region routing
│  │  └─ settings/                  # the settings admin you asked for
│  ├─ api/
│  │  └─ paystack/verify/route.ts   # server-side payment verification
│  └─ layout.tsx                    # wraps app in <SettingsProvider>
├─ components/
│  ├─ SettingsProvider.tsx          # loads public settings once, exposes useSetting()
│  ├─ storefront/…
│  └─ admin/…
├─ lib/
│  ├─ supabase.ts                   # anon client (browser) + service-role (server only)
│  ├─ settings.ts                   # getAllSettings, updateSettings, getDeliveryFee
│  ├─ queries.ts                    # typed data access (products, orders, stock)
│  └─ types.ts
└─ schema.sql                       # the foundation (already built)
```

---

## How data flows

**Storefront (read).** Server components fetch active, non-deleted products straight
from Supabase (public read is allowed by RLS). Cart lives in React state only — nothing
hits the database until checkout.

**Checkout (the one transaction that matters).** On "Pay":
1. Match or create the customer (by phone).
2. Create the order — status `pending`, `fulfilling_branch_id = resolve_fulfilling_branch(region)`.
3. Insert `order_items` with **snapshot** name + price.
4. Initialise Paystack.
5. On verified payment (server route): set `payment_status = paid`, `status = paid`,
   **decrement `branch_stock`, and write an `inventory_log` (sale) — in ONE database
   transaction** so stock can never half-update. Do this as a Postgres function (RPC),
   not three separate client calls.

**Admin (write).** Supabase Auth. Role checked from `app_users`. Sensitive writes go
through server routes using the service-role key — never expose that key to the browser.

---

## The settings module (your no-hardcode discipline)

- `settings` table holds every editable value (`key`, `value`, `label`, `category`, `type`, `is_public`).
- `lib/settings.ts`: `getAllSettings()` (cached), `updateSettings()` (`upsert` on conflict `key`), `getDeliveryFee(region)`.
- `SettingsProvider.tsx`: loads all `is_public` rows once on mount, caches in localStorage
  with a TTL, falls back to a `DEFAULTS` map, exposes `useSetting('business_phone', fallback)`.
- `/dashboard/settings`: category tabs, tracks a "dirty" set of changed fields, shows the
  floating "N unsaved changes / Save now" bar, saves with one `upsert`, invalidates cache.
- **The rule:** every displayed value (footer, contact, delivery fee, currency) reads
  through `useSetting`. If you hardcode it, saving in the admin does nothing — that was
  the exact Chico Water bug. Don't repeat it.

---

## Build order — ship between each phase, don't build it all at once

**Phase 0 — done.** `schema.sql` run in Supabase + project + Auth set up.

**Phase 1 — Admin shell + Settings + auth guard.**
Login, sidebar, role check, the settings page. (~half a day, mostly forked.)

**Phase 2 — Products / Categories / Brands CRUD + branch-stock entry.**
Now you can load real parts and real quantities. Soft delete, image upload, SKU search.

**Phase 3 — Storefront.**
Product listing with category/brand/vehicle filters, pagination (never load 5,000 at once),
product detail, cart.

**Phase 4 — Checkout + Paystack + order creation.**
The transaction above. First time a real order can exist.

**Phase 5 — Order fulfilment view (phone-friendly).**
See paid orders, mark processing → shipped → delivered. This is the screen *you* live in.

**— SHIP HERE. Get one real order through end to end before building anything below. —**

**Phase 6+ — later, only when earned by real volume.**
Riders & deliveries + cash-on-delivery reconciliation, inventory-log UI, audit-log UI,
analytics, and flipping on multi-branch region routing when a second branch actually exists.

---

## Two things not in the schema that will bite if ignored

1. **RLS on private tables.** `orders`, `customers`, `branch_stock`, and the logs are NOT
   world-readable yet. Write admin/authenticated policies before going public, or you leak
   customer phone numbers and addresses to anyone with the anon key.
2. **You are the bottleneck.** Developer + admin + main-branch fulfiller + final-year
   student. Every admin screen must be fast on a phone. Optimise for your own time, not
   feature count.
