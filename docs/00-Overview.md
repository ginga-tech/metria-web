# Metria Web - Overview

## Purpose

Metria Web is the user-facing application for:

- Authentication (email/password and Google OAuth)
- Life balance assessment
- Dashboard visualization
- Goals and sub-goals management
- Subscription and billing lifecycle

## Scope

- Render product UI and route orchestration
- Call backend APIs using JWT auth
- Drive checkout popup flows
- Poll subscription status after checkout

## Out of Scope

- Payment provider logic (backend responsibility)
- Webhook processing (backend responsibility)
- Worker/queue processing

## Tech Stack

- Vite + React + TypeScript
- React Router
- Tailwind CSS
- Recharts
- Fetch API for service layer
