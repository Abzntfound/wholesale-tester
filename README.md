# Wholesale Clearance UK — Modern Wholesale Ecommerce

Modern HTML/CSS/JavaScript wholesale catalogue with Supabase backend integration.

**Live catalogue:** `joblots.html` (maps to `/joblots` with URL rewrite)

---

## Architecture

```text
UI (HTML pages + js/)
  ↓
Repositories (repositories/)
  ↓
Adapters: local | supabase | remote
  ↓
Data: data/products.js | Supabase PostgreSQL | authorised API
```

| Layer | Purpose |
|-------|---------|
| `joblots.html` | Main catalogue — search, filters, sort, pagination |
| `product.html` | Product detail — slug or SKU lookup |
| `repositories/productRepository.js` | Unified product access |
| `repositories/searchRepository.js` | Case-insensitive partial search |
| `repositories/basketRepository.js` | Basket — Supabase + localStorage |
| `repositories/wishlistRepository.js` | Wishlist — Supabase + localStorage |
| `repositories/accountRepository.js` | Supabase Auth + local demo fallback |
| `repositories/orderRepository.js` | Orders in Supabase |
| `js/payment.js` | Payment abstraction → Edge Functions |

### Existing problems fixed

1. **Search (`?q=pallets`)** — URL state now drives the catalogue on load; multi-word search uses AND logic; overly broad partial matching tightened; hero/featured sections hide when filtered so results are visible immediately.
2. **`file://` CORS** — ES modules require a local HTTP server (documented below).
3. **Insecure auth** — Replaced with Supabase Auth when configured; local demo mode remains for offline development only.
4. **No database layer** — Supabase migrations, RLS policies, and adapter added.

---

## Quick start (local development)

**Do not open HTML files directly.** Use a local web server:

### Option 1 — VS Code Live Server

1. Install [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. Right-click `joblots.html` → **Open with Live Server**
3. Browse to `http://127.0.0.1:5500/joblots.html`

### Option 2 — npx serve

```powershell
npm start
```

Open `http://localhost:3000/joblots.html`

### Option 3 — Python

```powershell
python -m http.server 8080
```

Open `http://localhost:8080/joblots.html`

---

## Test search

| URL | Expected |
|-----|----------|
| `joblots.html?q=pallets` | Pallet products |
| `joblots.html?q=clothing` | Clothing lots |
| `joblots.html?q=shoes` | Footwear |
| `joblots.html?q=electronics` | Electronics |
| `joblots.html?q=beauty` | Beauty |
| `joblots.html?q=pallet` | Partial match → pallets |
| `joblots.html?category=Clothing` | Category filter |
| `joblots.html?category=Clothing&sort=price-low` | Filter + sort |

---

## Project structure

```text
index.html              Homepage
joblots.html            Main catalogue
product.html            Product detail
checkout.html           Checkout
basket.html / wishlist.html
account/                Sign in, register, orders
css/style.css           All styles
js/                     Application logic
repositories/           Data access layer
data/                   Development product catalogue
supabase/               Migrations & edge functions
```

---

## Supabase setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project
2. Note your **Project URL** and **anon public key** (Settings → API)

### 2. Connect the frontend

Copy `js/env.example.js` to `js/env.js` (or edit the existing `js/env.js`):

```js
export const ENV = {
  SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key',
  DATA_SOURCE: 'local',  // change to 'supabase' when DB is populated
  PAYMENT_ENABLED: false
};
```

**Never** put the service-role key or payment secrets in `js/env.js`.

### 3. Run database migrations

Using Supabase CLI:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Or paste `supabase/migrations/001_initial_schema.sql` into the Supabase SQL Editor.

This creates:

- `products`, `product_images`
- `profiles`, `wishlist_items`, `basket_items`, `addresses`
- `orders`, `order_items`
- Row Level Security policies
- `search_products()` RPC

### 4. Enable authentication

In Supabase Dashboard → Authentication → Providers:

- Enable **Email** provider
- Configure site URL: `http://localhost:3000` (dev) and production domain
- Add redirect URLs for password reset

### 5. Configure Storage (optional)

For self-hosted product images:

1. Create a `product-images` bucket
2. Set public read policy for product images
3. Store URLs in `products.image_url` or `product_images`

### 6. Import products

When authorised product data is available, import into the `products` table. Until then, use `DATA_SOURCE: 'local'` with the development catalogue in `data/products.js` (~4,089 sample products + live seed from public listings).

Set `DATA_SOURCE: 'supabase'` in `js/env.js` once the database is populated.

### 7. Deploy Edge Functions

See `supabase/README.md` for payment function deployment.

Set secrets via CLI:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set SITE_URL=https://www.wholesaleclearance.co.uk
supabase secrets set ALLOWED_ORIGINS=http://localhost:3000,https://www.wholesaleclearance.co.uk
```

Then set `PAYMENT_ENABLED: true` in `js/env.js`.

---

## Environment variables

See `.env.example` for all variables. Summary:

| Variable | Where | Purpose |
|----------|-------|---------|
| `SUPABASE_URL` | `js/env.js` | Frontend Supabase URL |
| `SUPABASE_ANON_KEY` | `js/env.js` | Public anon key |
| `DATA_SOURCE` | `js/env.js` | `local` / `supabase` / `remote` |
| `PAYMENT_ENABLED` | `js/env.js` | Enable checkout payment |
| `STRIPE_SECRET_KEY` | Supabase secrets | **Server only** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secrets | **Edge functions only** |

---

## Deploy frontend (GitHub Pages)

1. Push to `main` branch
2. Enable GitHub Pages: Settings → Pages → Source: **GitHub Actions**
3. The `deploy.yml` workflow publishes the static site

For a custom domain (`wholesaleclearance.co.uk`), configure DNS and add the domain in GitHub Pages settings.

---

## Payment architecture

```text
Browser → checkout.html
       → orderRepository.createOrder()
       → payment.createCheckoutSession()
       → Supabase Edge Function (secrets)
       → Payment provider (Stripe)
       → Webhook → payment-webhook function
       → Order marked paid in Supabase
```

Checkout shows a clear message when payment is not yet configured. **No fake payment confirmations.**

---

## Product data sources

| Source | Config | Notes |
|--------|--------|-------|
| Local development | `DATA_SOURCE: 'local'` | Default — sample + live seed |
| Supabase | `DATA_SOURCE: 'supabase'` | Production database |
| Remote API | `DATA_SOURCE: 'remote'` | Authorised feed at `/api/products` |

See `api/README.md` for connecting an authorised WCUK product feed.

---

## Security

- Row Level Security on all user data (wishlist, basket, orders, profiles)
- Payment secrets only in Supabase Edge Function environment
- No card numbers, CVV, or payment passwords stored
- Frontend uses anon key only; service-role key never in browser

---

## Pages

| Page | URL |
|------|-----|
| Home | `/index.html` |
| Catalogue | `/joblots.html` |
| Product | `/product.html?slug=...` |
| Basket | `/basket.html` |
| Checkout | `/checkout.html` |
| Wishlist | `/wishlist.html` |
| Sign in | `/account/sign-in.html` or `/login.html` |
| Account | `/account/index.html` |

---

## Customer journey

```text
Homepage → Browse/search → Filter/sort → Product page
  → Wishlist/basket → Sign in → Checkout → Payment → Order history
```

---

## Licence

Proprietary — Wholesale Clearance UK Ltd.
