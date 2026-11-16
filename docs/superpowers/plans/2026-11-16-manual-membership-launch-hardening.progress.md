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
- Baseline evidence: previous release-candidate CI ran `npm test`, 37 indicator tests, YAML/site checks and the course validator. The new analyzer access integration tests are present in `indicator/tests/server.test.mjs`. A targeted local Node integration harness against the actual `server.mjs` (with parser/backtest modules stubbed) passed Supabase Auth validation, 365-day entitlement checks, wrong-product/term rejection, upstream/malformed response handling, and authorization-before-CSV parsing. The full repository test workflows have not yet produced a fresh run on the latest head; run them from GitHub Actions before merging.

## Task status

- Task 1: implemented — `/api/access` and `/api/analyze-csv` validate the bearer token against Supabase Auth, then call the authenticated entitlement Edge Function; the gate fails closed on missing/invalid sessions, inactive/expired access, malformed or wrong-product/term responses, and upstream outages. CSV parsing starts only after a valid 365-day entitlement.
- Task 2: implemented — analyzer page has Supabase sign-in/sign-out, session restoration, access refresh, and sends the same bearer token with every analysis request. Only the public Supabase URL/publishable key are exposed by `/api/config`.
- Task 3: implemented — admin page has a separate indicator membership panel backed by the admin-only RPCs; payment verification starts unchecked and requires explicit confirmation to mark or revoke. An unverified row is labelled pending and does not grant analyzer access. The production migration remains unapplied.
- Task 4: implemented — payment page is a closed notice only; QR/wallet/order UI is removed and the cached checkout script is a no-network defensive stub. A local Node VM smoke test confirmed it disables old order controls, clears/hides wallet UI and makes zero network calls.
- Task 5: complete — `scripts/validate-course-quizzes.mjs` exists, `package.json` wires it into `npm run build`, and CI output confirms all 11 lesson quizzes / 55 correct-answer mappings match the server grading contract.

## Safety boundary

No production schema migration, Edge Function deployment, Cloudflare production deployment, payment activation, PR merge, or customer entitlement changes are authorized by this plan. The release PR is ready for review but must remain unmerged.
