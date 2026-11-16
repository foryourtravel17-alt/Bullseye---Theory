# SDD ledger — plan: docs/superpowers/plans/2026-11-16-manual-membership-launch-hardening.md

Branch: `release/bullseye-india-course-indicator-integration`
Base: `main` (release PR #47; do not merge or deploy)
Execution mode: GitHub feature branch via repository connector; no local worktree/native worktree tool is available.

## Setup and pre-flight

- Read the design spec and implementation plan.
- Pre-flight shared interfaces:
  - Task 1 produces `GET /api/access` and the server-side entitlement guard; Task 2 consumes both and sends the same Supabase JWT to access and CSV analysis.
  - Task 3 consumes `admin_list_indicator_members()` and `admin_set_indicator_access(...)` from the additive migration; the migration remains unapplied in production.
  - Task 4 is independent; it closes all browser-side payment paths and does not change payment Edge Functions or production data.
  - Task 5 quiz validator is already present from reviewed PR #53 and is included in `npm run build`.
- Ruling: use the existing isolated release-candidate branch instead of creating a local Git worktree — repository changes are available through GitHub connector tools only, and this branch is already isolated from `main`; cost if wrong is concurrent branch movement, mitigated by re-reading the branch head and file SHA before each write.
- Baseline evidence: previous release-candidate CI ran `npm test`, 37 indicator tests, YAML/site checks and the course validator. The new analyzer access integration tests still need a fresh explicit run before Task 1 implementation.

## Task status

- Task 1: pending — fail-closed analyzer entitlement API.
- Task 2: pending — member sign-in and analyzer UI.
- Task 3: pending — owner-only manual indicator entitlement controls.
- Task 4: pending — payment page and checkout script remain manual-only.
- Task 5: complete — `scripts/validate-course-quizzes.mjs` exists, `package.json` wires it into `npm run build`, and CI output confirms all 11 lesson quizzes / 55 correct-answer mappings match the server grading contract.

## Safety boundary

No production schema migration, Edge Function deployment, Cloudflare production deployment, payment activation, PR merge, or customer entitlement changes are authorized by this plan.
