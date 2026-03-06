# ADR Decisions

## ADR-001: Single docs folder

- Decision: use `docs/` as the single documentation folder.
- Rationale: avoid drift between `MemoryBank` and `docs`.
- Consequence: all knowledge updates must be done in `docs/`.

## ADR-002: Numbered naming convention

- Decision: default format `NN-Topic.md`.
- Rationale: stable reading order and easier onboarding.
- Consequence: new docs should be appended with next available number.

## ADR-003: Checkout orchestration on frontend

- Decision: checkout orchestration handled by `Goals.tsx` + `CheckoutAutoClose`.
- Rationale: keep paywall interaction and popup handling close to UI flow.
- Consequence: changes to checkout UX must update both places.

## ADR-004: Keep integration compatibility helpers

- Decision: keep legacy payment-link helper accessors in billing service.
- Rationale: reduce migration risk while checkout-session flow is active.
- Consequence: docs must clearly state active vs legacy path.
