# Development Standards

## Code Changes

- Keep patches small and focused.
- Prefer composition over large refactors.
- Preserve existing UI and service patterns unless there is explicit migration scope.

## TypeScript and React

- Avoid `any` when practical.
- Keep screen-level orchestration in `src/pages`.
- Keep API logic in `src/services`.

## Styling

- Use Tailwind consistently with current project conventions.
- Avoid introducing a parallel styling system.

## Error Handling

- Parse API error response when available.
- Provide user-facing messages that are actionable.
- Roll back optimistic updates on failure.

## Logging

- Add logs only where they support troubleshooting.
- Remove temporary verbose logs after validation.

## Documentation Rule

- Any environment, billing, or flow change must update docs in `docs/`.
