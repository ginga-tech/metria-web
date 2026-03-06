# Billing and Checkout

## Current Frontend Flow

Current paywall flow uses backend-created Stripe Checkout Sessions.

1. User selects plan in `Goals`.
2. Front calls `createCheckoutSession(plan)`.
3. Backend returns `{ url }` for Stripe-hosted checkout.
4. Front opens popup and waits for confirmation.
5. After success redirect (`?checkout=success`), app syncs and polls subscription status.
6. UI reloads when backend reports `active: true`.

Core files:

- `src/pages/Goals.tsx`
- `src/services/billingService.ts`
- `src/App.tsx` (`CheckoutAutoClose`)

## Backend Endpoints Used by Front

- `POST /api/billing/checkout`
- `POST /api/billing/sync`
- `GET /api/billing/subscription`
- `POST /api/billing/portal`
- `GET /api/billing/subscriptions/history`

## Legacy Compatibility

Payment Link env helpers remain in `billingService.ts` as legacy compatibility, but active paywall path uses `/api/billing/checkout`.

## Webhook Dependency

Subscription activation depends on backend webhook processing:

- `/api/billing/webhook`
- Typical events:
  - `checkout.session.completed`
  - `customer.subscription.created|updated|deleted`
  - `invoice.paid`
  - `invoice.payment_failed`

## Common Failures

- Webhook signature mismatch (`STRIPE_WEBHOOK_SECRET`).
- Wrong price type for selected flow (one-time vs recurring).
- Environment mismatch (live keys + test resources).
- Inconsistent domain/callback URLs between Stripe, frontend, and backend.
