# SDD ledger — plan: docs/superpowers/plans/2026-11-16-manual-membership-launch-hardening.md

BASE: 3e07e1fc8f5861e5429d342c9c5a70b2ee9dc9f2
Workspace: isolated GitHub release-candidate branch; no production branch writes.
Execution: native inline execution through GitHub branch/file and Actions tools; no subagent tool is available.

Pre-flight: Task 1 produces the analyzer access API consumed by Task 2's browser UI. Task 3 depends on the existing indicator_access migration and RPC signatures. Task 4 is independent of Tasks 1–3. Task 5 runs final validations after all prior tasks.

Ruling: Use the existing get-indicator-access Edge Function rather than direct service-role database queries from the Render analyzer — this avoids duplicating entitlement policy and avoids placing a second service-role secret in Render; the cost if wrong is that the Edge Function must be deployed before the paid analyzer can work, which remains a deliberate launch gate.

Ruling: Keep all payment methods and checkout closed, including the public QR — the user requested manual verification and has not finalized the official receiving instructions; the cost if wrong is that customers cannot pay online until the owner publishes verified manual instructions.

Task 1: in progress — access API tests committed first (commit d23c2ee); awaiting RED run.
