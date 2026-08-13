# Supabase Edge Functions — Wholesale Clearance UK

## Overview

Payment secrets **must never** appear in frontend JavaScript or GitHub. They belong in Supabase Edge Function secrets only.

## Functions

| Function | Purpose |
|----------|---------|
| `create-checkout-session` | Creates a payment session with your provider (Stripe-compatible interface) |
| `payment-webhook` | Receives payment confirmation webhooks and marks orders paid |

## Setup

1. Install [Supabase CLI](https://supabase.com/docs/guides/cli)
2. Link your project: `supabase link --project-ref YOUR_PROJECT_REF`
3. Set secrets (example for Stripe):

```bash
supabase secrets set PAYMENT_PROVIDER=stripe
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set SITE_URL=https://www.wholesaleclearance.co.uk
supabase secrets set ALLOWED_ORIGINS=http://localhost:3000,https://www.wholesaleclearance.co.uk
```

4. Deploy functions:

```bash
supabase functions deploy create-checkout-session
supabase functions deploy payment-webhook
```

5. Configure webhook URL in your payment provider dashboard:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/payment-webhook
```

6. Enable `PAYMENT_ENABLED: true` in `js/env.js` after deployment.

## CORS

Edge functions validate the `Origin` header against `ALLOWED_ORIGINS`. Do not use `*` for authenticated checkout endpoints.

## Database migrations

Run migrations from the project root:

```bash
supabase db push
```

Or paste `supabase/migrations/001_initial_schema.sql` into the Supabase SQL Editor.

## Importing products

Use the Supabase dashboard or a CSV import to populate the `products` table. Development sample data can be exported from `data/products.js` using your own import script once authorised product data is available.

Set `DATA_SOURCE: 'supabase'` in `js/env.js` when the database is populated.
