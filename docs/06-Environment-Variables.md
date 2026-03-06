# Environment Variables

## Frontend (`metria-web`)

Required:

- `VITE_API_BASE_URL`

Examples:

- Local: `http://localhost:5104`
- Production: `https://api.metria-app.com`

Optional (legacy helpers):

- `VITE_STRIPE_PAYMENT_LINK_URL`
- `VITE_STRIPE_PAYMENT_LINK_URL_MONTHLY`
- `VITE_STRIPE_PAYMENT_LINK_URL_ANNUAL`

Optional (checkout price ids when needed by feature flags/flows):

- `VITE_STRIPE_PRICE_MONTHLY`
- `VITE_STRIPE_PRICE_ANNUAL`

## Backend (`metria-project`) - integration-critical

OAuth:

- `BACKEND_BASE_URL`
- `FRONTEND_ORIGIN`
- `FrontendCallback` (or `FRONTEND_CALLBACK`)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Auth/JWT:

- `Jwt__Audience`
- `Jwt__Issuer`
- `Jwt__ExpiresInSeconds`
- `Jwt__Key`

Stripe:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_MONTHLY_PRICE_ID`
- `STRIPE_ANNUAL_PRICE_ID`

## Rules

- Keep domain values aligned across Google Console, Stripe, backend, and frontend.
- For Vite, only variables prefixed with `VITE_` are exposed to browser code.
- After env changes:
  - Frontend: redeploy if `VITE_*` changed.
  - Backend: redeploy if server vars changed.
