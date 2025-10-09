#!/usr/bin/env markdown

# Stripe Integration Notes (Web)

Flows
- Payment Links (current default): open Stripe-hosted link in popup. On success redirect, app closes popup and polls backend.
- Checkout Sessions (optional): front requests `/api/billing/checkout` (backend creates session). Useful to tie `client_reference_id = userId`.

Frontend hooks
- `CheckoutAutoClose` in `src/App.tsx` handles `?checkout=success|cancel` and triggers polling in same-tab fallback.
- `Goals.tsx` opens popup and polls subscription status.

Env (Payment Links)
- `VITE_STRIPE_PAYMENT_LINK_URL`
- `VITE_STRIPE_PAYMENT_LINK_URL_MONTHLY`
- `VITE_STRIPE_PAYMENT_LINK_URL_ANNUAL`

Env (Checkout Sessions)
- `VITE_STRIPE_PRICE_MONTHLY`, `VITE_STRIPE_PRICE_ANNUAL` (price IDs `price_...`).

Backend expectations
- Webhook at `/api/billing/webhook` handles:
  - `checkout.session.completed` (fetches `Subscription` by ID and upserts)
  - `customer.subscription.created|updated|deleted`
- Status endpoint: `/api/billing/subscription` → `{ active, plan, renewsAtUtc }`

Testing
- Dev (Payment Links live): `stripe listen --live --forward-to http://localhost:5104/api/billing/webhook`
- Ensure redirect in Payment Link → `http://localhost:5173/dashboard?checkout=success`

Common pitfalls
- Mismatched modes (live link with test keys).
- Webhook not reaching local backend (CLI not running).
- Different email used at checkout; prefer Checkout Sessions to rely on `client_reference_id` if this becomes an issue.

