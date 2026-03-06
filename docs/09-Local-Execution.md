# Local Execution

## Prerequisites

- Node.js LTS
- npm
- Backend API running locally (default `http://localhost:5104`)

## Setup

1. Install dependencies:
   - `npm i`
2. Configure `.env.local`:
   - `VITE_API_BASE_URL=http://localhost:5104`
3. Start dev server:
   - `npm run dev`

## Build

- `npm run build`
- output: `dist/`

## Common Local Issues

- `API nao configurada`:
  - check `VITE_API_BASE_URL` in `.env.local`
- OAuth callback mismatch:
  - check backend OAuth env and Google redirect URI
- Checkout not activating:
  - check webhook forwarding and backend sync endpoint
