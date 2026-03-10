# Deployment (Railway)

## Services

- Frontend service: `metria-web`
- Backend service: `metria-project`

## Separation Rule

`metria-web` should only publish `VITE_API_BASE_URL` and other browser-safe configuration.

Sensitive Stripe runtime variables must be configured only in the `metria-project` Railway service, never in the frontend repository or browser bundle.

## Frontend Checklist

- `VITE_API_BASE_URL` points to active backend domain.
- Deploy succeeds (`npm run build` as part of pipeline).
- Public domain active and HTTPS issued.

## Backend Checklist

- OAuth vars configured (`BACKEND_BASE_URL`, `FRONTEND_ORIGIN`, callback vars).
- Stripe vars configured (`STRIPE_*`).
- Google OAuth redirect URI matches backend callback domain.
- Webhook endpoint reachable and signature valid.

## Custom Domain Checklist

For each Railway custom domain:

1. Add CNAME record in DNS provider.
2. Add TXT verification record (`_railway-verify...`) when requested.
3. Wait for Railway status from `Waiting for DNS update` to `Active`.
4. Validate with `nslookup` and `curl -I`.

## Post-Deploy Smoke

1. Open frontend domain.
2. Perform Google login.
3. Verify protected route access.
4. Trigger checkout and confirm subscription refresh.
