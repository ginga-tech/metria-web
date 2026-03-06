# AI Guidelines

## Objective

Keep AI-assisted changes aligned with project standards and delivery speed.

## Working Rules

- Prefer surgical edits.
- Respect existing architecture boundaries.
- Update docs whenever behavior or env expectations change.

## High-Signal Files

- Routing/app shell: `src/App.tsx`
- Billing/paywall UX: `src/pages/Goals.tsx`
- Billing API integration: `src/services/billingService.ts`
- Auth integration: `src/services/authService.ts`, `src/hooks/useGoogleOAuth.ts`

## Mandatory Validation

- Run build after relevant changes: `npm run build`.
- Verify impacted flow manually when changing auth, billing, or goals.
