AI Collaboration Guide (Web)

Goals
- Keep patches small, surgical, and aligned with current patterns.
- Prefer configuration and feature flags over large refactors.

Where to look
- Routing/App shell: `src/App.tsx`
- Paywall + Stripe triggers: `src/pages/Goals.tsx`
- Billing requests: `src/services/billingService.ts`

Conventions
- TypeScript strict-ish; avoid `any` when reasonable.
- Minimal inline comments. Describe rationale in PR/commit message or this MemoryBank.
- Use Tailwind classes consistently.

Common tasks
- Update env reading or add helper → update MemoryBank docs.
- Stripe flows → ensure redirect URLs and update troubleshooting.

