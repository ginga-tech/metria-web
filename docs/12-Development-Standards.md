# Development Standards

## Code Changes

- Keep patches small and focused.
- Prefer composition over large refactors.
- Preserve existing UI and service patterns unless there is explicit migration scope.
- Keep one logical change per commit whenever possible.

## TypeScript and React

- Avoid `any` when practical.
- Keep screen-level orchestration in `src/pages`.
- Keep API logic in `src/services`.

## Language Convention

- Code identifiers (`variables`, `functions`, `types`, file names) must be in English.
- Code comments must be in English.
- Commit messages must be in English.
- User-facing UI text should follow product language (currently pt-BR), unless the screen explicitly requires English.

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

## Semantic Commits (Conventional Commits)

Use this format:

- `type(scope): short description`
- Breaking changes: `type(scope)!: short description`

Supported `type` values:

- `feat`: new behavior or capability
- `fix`: bug fix or regression fix
- `docs`: documentation only
- `refactor`: internal restructure without behavior change
- `test`: tests added/updated
- `chore`: maintenance tasks (deps, scripts, housekeeping)
- `style`: formatting-only changes (no logic changes)
- `perf`: performance improvement
- `build`: build tooling or dependency pipeline changes
- `ci`: CI/CD workflow changes
- `revert`: revert a previous commit

Scope guidance (recommended):

- Use feature/module scope, e.g. `goals`, `billing`, `auth`, `docs`, `preferences`, `dashboard`.
- Keep scope short and stable.

Message rules:

- Subject in imperative mood, lower-case preferred.
- Max ~72 chars in subject.
- No trailing period.
- Avoid generic subjects like `update`, `adjustments`, `fix stuff`.

Examples:

- `feat(goals): add sub-goal creation with period validation`
- `fix(goals): stabilize sub-goal row when datepicker opens`
- `fix(auth): normalize invalid credentials message on login`
- `docs(readme): add railway custom domain checklist`
- `refactor(billing): isolate checkout popup orchestration`

Optional body (recommended for non-trivial commits):

- `what` changed
- `why` it changed
- `how` it was validated (build/test/manual flow)
