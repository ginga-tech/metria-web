# Metria Web — MemoryBank

Purpose
- Centralize project knowledge so humans/AI can quickly ramp up.
- Capture decisions, env, integration notes, and future work.

Project Snapshot
- Stack: Vite + React + TS + Tailwind.
- Auth: JWT stored in localStorage (`lb_token`).
- Key screens: `DashboardReordered.tsx`, `Goals.tsx`, `Assessment.tsx`.
- Paywall: Free plan up to 5 goals; premium unlocks unlimited goals.

Stripe Integration (current)
- Flow: Stripe Payment Links opened in popup; redirect back to `.../dashboard?checkout=success`.
- Auto-close + polling:
  - `src/App.tsx` adds `CheckoutAutoClose` to close popup and, in same-tab case, poll `/api/billing/subscription`.
  - `src/pages/Goals.tsx` opens popup and polls until backend marks subscription active.
- Env (Payment Links):
  - `VITE_STRIPE_PAYMENT_LINK_URL` (fallback single link)
  - `VITE_STRIPE_PAYMENT_LINK_URL_MONTHLY` (preferred for monthly)
  - `VITE_STRIPE_PAYMENT_LINK_URL_ANNUAL` (preferred for annual)
- Optional (alternate flow – Checkout Sessions via backend):
  - `VITE_STRIPE_PRICE_MONTHLY`, `VITE_STRIPE_PRICE_ANNUAL` (IDs `price_...`).
  - When set and code path enabled in `Goals.tsx`, frontend calls `/api/billing/checkout`.

Environment
- Required: `VITE_API_BASE_URL` (e.g., `http://localhost:5104`).
- Optional: Stripe Payment Links listed above.
- Example: see `.env.local` in repo root.

Run
- Dev: `npm i` then `npm run dev`
- Build: `npm run build` → `dist/`

Key Files
- App shell: `src/App.tsx`
- Goals/paywall UI + Stripe triggers: `src/pages/Goals.tsx`
- Dashboard banner when subscription turns active: `src/pages/DashboardReordered.tsx`
- Billing service helpers: `src/services/billingService.ts`

Troubleshooting
- Popup fecha mas não ativa:
  - Verifique webhook do backend (CLI: `stripe listen` no modo correto) e chaves live/test compatíveis.
  - Confirme redirect do Payment Link para `.../dashboard?checkout=success`.
- “Preço não configurado”: configure Payment Links (preferido) ou `VITE_STRIPE_PRICE_*` se optar por Checkout Sessions.

Conventions (for AI/humans)
- Keep patches small and focused; match existing style.
- Prefer composition over large refactors.
- Add logs only where high value; remove verbose debug after validation.

