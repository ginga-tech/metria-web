# API Contracts (Frontend Consumption)

## Auth

- `POST /api/auth/login`
  - request: `{ email, password }`
  - response: `{ token, expiresInSeconds }`
- `POST /api/auth/signup`
  - request: `{ name, email, password }`
  - response: `{ token, expiresInSeconds }`
- `GET|POST /api/auth/google/callback`
- `GET /api/auth/google/start?redirectUri=<url>`

Password recovery:

- `POST /api/auth/forgot-password`
- `POST /api/auth/validate-reset-token`
- `POST /api/auth/reset-password`

## Billing

- `POST /api/billing/checkout`
  - request: `{ plan: "monthly" | "annual", successUrl, cancelUrl }`
  - response: `{ url }`
- `POST /api/billing/sync`
  - request: `{ email?, subscriptionId?, customerId?, checkoutSessionId? }`
  - response: `{ ok, subId?, status?, plan? }`
- `GET /api/billing/subscription`
  - response: `{ active, plan?, renewsAtUtc? }`
- `POST /api/billing/portal`
  - request: `{ returnUrl }`
  - response: `{ url }`
- `GET /api/billing/subscriptions/history`

## Goals

- `POST /api/goals`
- `GET /api/goals?period=<...>&startDate=<...>&endDate=<...>`
- `PUT /api/goals/{id}`
- `DELETE /api/goals/{id}`

## Sub-Goals

- `GET /api/goals/{goalId}/subgoals`
- `POST /api/goals/{goalId}/subgoals`
- `PUT /api/goals/{goalId}/subgoals/{subGoalId}`
- `DELETE /api/goals/{goalId}/subgoals/{subGoalId}`

## Error Handling Pattern

- Service layer throws `Error` with parsed body text/JSON when possible.
- UI surfaces concise alerts/messages and rolls back optimistic state on failure.
