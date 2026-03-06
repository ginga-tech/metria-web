# Testing Strategy

## Current Baseline

- Build validation:
  - `npm run build`
- Manual smoke tests on core flows:
  - auth (email/password + Google OAuth)
  - goals/sub-goals CRUD
  - checkout and subscription refresh

## Recommended Regression Checklist

1. Login and protected navigation.
2. Create/update/delete goal.
3. Create/update/delete sub-goal.
4. Verify block when deleting goal with sub-goals.
5. Start checkout (monthly and annual).
6. Confirm subscription status update after payment success.
7. Validate fallback behavior on canceled/failed checkout.

## Billing-Specific Validation

- Webhook delivery success in Stripe dashboard.
- `/api/billing/subscription` reflects expected state after sync.
- Redirect URLs and callback domains match deployed environment.

## Suggested Next Steps

- Add API contract tests for services layer.
- Add e2e workflow for Goals + Stripe mock webhook sync.
- Add deploy-time smoke test for domain and auth callback.
