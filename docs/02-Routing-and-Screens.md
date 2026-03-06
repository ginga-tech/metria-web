# Routing and Screens

## Router

Defined in `src/App.tsx` using `createBrowserRouter`.

## Public Routes

- `/` -> `MetriaAuth`
- `/oauth/callback` -> `OAuthCallback`
- `/forgot-password` -> `ForgotPassword`
- `/reset-password` -> `ResetPassword`

## Protected Routes

- `/assessment` -> `Assessment`
- `/dashboard` -> `DashboardReordered`
- `/preferences` -> `Preferences`
- `/subscriptions` -> `Subscriptions`
- `/goals` -> `Goals`

## Layout

Global layout wraps routes with:

- `CheckoutAutoClose` handler
- `Footer`
- `GlobalLoader`
