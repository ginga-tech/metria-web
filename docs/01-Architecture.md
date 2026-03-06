# Architecture

## Style

Frontend modular structure by responsibility.

## Main Folders

- `src/pages`: route pages and screen-level orchestration
- `src/components`: reusable UI blocks
- `src/services`: API integration layer
- `src/hooks`: stateful behavior reuse
- `src/utils`: cross-cutting helpers
- `src/constants`: static domain constants
- `src/styles`: extra CSS for specific components

## Runtime Flow

1. `src/main.tsx` boots app.
2. `src/App.tsx` creates routes and global layout.
3. `ProtectedRoute` enforces authenticated pages.
4. Pages call services in `src/services/*`.
5. Services call backend via `fetch`.

## Key Cross-Cutting Components

- `GlobalLoader`: route-aware loading messages
- `PageLoader`: page/overlay loading state
- `Footer`: global footer
- `UserMenu`: user actions in authenticated screens
