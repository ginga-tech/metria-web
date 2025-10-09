Backlog / Ideas

- Stripe
  - Optional toggle to switch between Payment Links and Checkout Sessions from env only.
  - Map plan by `priceId` (ensure `Stripe:MonthlyPriceId`, `Stripe:AnnualPriceId` in backend for precise labeling).
  - Add customer→user mapping table for robust matching even with different emails.

- Goals
  - Server-side pagination/history of goals.
  - Fine-grained limits for free plan.

- DX
  - Add e2e test script that simulates Stripe webhook payloads.
  - Add metrics for webhook success/failures.

- UX
  - Post-checkout success page improvements and deep links.

