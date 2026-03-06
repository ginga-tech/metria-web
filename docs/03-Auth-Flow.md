# Auth Flow

## Token Model

- JWT is stored in `localStorage` under `lb_token`.
- Protected pages are gated by `ProtectedRoute`.

## Email/Password

- Login: `POST /api/auth/login`
- Signup: `POST /api/auth/signup`
- Forgot password: `POST /api/auth/forgot-password`
- Validate reset token: `POST /api/auth/validate-reset-token`
- Reset password: `POST /api/auth/reset-password`

Frontend entrypoints:

- `src/services/authService.ts`
- `src/pages/MetriaAuth.tsx`
- `src/pages/ForgotPassword.tsx`
- `src/pages/ResetPassword.tsx`

## Google OAuth (Popup)

Primary flow:

1. Front opens `${VITE_API_BASE_URL}/api/auth/google/start?redirectUri=<front>/oauth/callback`.
2. Backend redirects to Google auth endpoint.
3. Google returns to backend callback (`/api/auth/google/callback`).
4. Backend redirects to frontend callback with token.
5. `OAuthCallback` page normalizes token and stores `lb_token`.
6. Parent window receives result via `postMessage` when popup mode is used.

Relevant files:

- `src/hooks/useGoogleOAuth.ts`
- `src/pages/OAuthCallback.tsx`
- `src/services/authService.ts`

## Production Notes

- Frontend origin must match deployed domain.
- Backend callback URL must match Google Console redirect URI.
- Keep `FRONTEND_ORIGIN` and `FrontendCallback` aligned with the frontend domain.
