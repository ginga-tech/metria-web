# Goals and Sub-Goals

## Domain Behavior (Frontend)

- Goal periods: `weekly`, `monthly`, `quarterly`, `semiannual`, `annual`, `custom`.
- Free plan: limit of 5 active goals.
- Premium plan: unlimited goals.
- Sub-goal must belong to one goal and stay within parent goal period.

## Current UI Flow

In `src/pages/Goals.tsx`:

- User creates goal with period and category.
- User can expand a goal to manage sub-goals.
- Sub-goal draft includes:
  - name (`sub-meta`)
  - start date (datepicker)
  - end date (datepicker)
- Goal deletion is blocked if active sub-goals exist.

## Service Layer

`src/services/goalsService.ts`:

- Goals:
  - `POST /api/goals`
  - `GET /api/goals`
  - `PUT /api/goals/{id}`
  - `DELETE /api/goals/{id}`
- Sub-goals:
  - `GET /api/goals/{goalId}/subgoals`
  - `POST /api/goals/{goalId}/subgoals`
  - `PUT /api/goals/{goalId}/subgoals/{subGoalId}`
  - `DELETE /api/goals/{goalId}/subgoals/{subGoalId}`

## Constraints

- Date ranges are validated before sending.
- UI performs optimistic updates with rollback on API failure.
- Status and counts are reflected per goal card.
