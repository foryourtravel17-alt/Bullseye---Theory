# Server-side quiz grading foundation

## Status

This PR adds a draft Supabase Edge Function at `supabase/functions/grade-quiz/index.ts`. It is **not deployed**, and the lesson pages have **not** been switched to it. Current lesson pages still write quiz attempts and completion flags directly to Supabase. Do not revoke their grants or policies yet.

## Request contract

Authenticated browser sends `POST /functions/v1/grade-quiz` with its normal Supabase access token and JSON containing `lesson_number` (1–11) and exactly five selected answers. The function obtains the caller from the verified JWT; it never accepts a caller-supplied user ID. It checks that the caller has active, payment-verified, unexpired course access, grades against server-held answer keys, writes the attempt, and on a pass updates progress. The service-role key is read only from Edge Function environment and is never shipped to the browser.

Answer format:
- Lessons 1, 2, 11: object with `q1` through `q5`, values as the page's letter values.
- Lessons 3–10: array of five strings matching the radio option values (currently `"0"`, `"1"`, `"2"`).

## Important limitations / release gates

1. The function uses the inspected live schema contract: `quiz_attempts.lesson_number`, `lesson_progress.lesson_number`, and the unique upsert key `(user_id, lesson_number)`. Confirm this against staging and keep the schema decision aligned with PR #14/#27.
2. The function currently records a passing attempt before writing progress. If progress write fails, the attempt remains recorded; the client receives an error and can retry. Consider a database transaction/RPC if strict atomicity is required.
3. This is a migration foundation, not the complete security fix. Direct browser INSERT/UPDATE grants and permissive policies remain in place until every lesson page uses the function and bypass tests pass.
4. Lesson 3–10 answer keys mirror the currently committed HTML arrays. Content owners should review all questions and keys before sale.
5. Validate preflight/CORS, wrong answers, missing answers, forged client score fields, expired/unverified access, invalid JWT, cross-user attempts, database failures, and all eleven lessons in a staging project.
6. Deploy only with the Supabase CLI or Dashboard after owner review. Do not put a service-role key in GitHub source or client configuration.

## Staging validation checklist

- [ ] Function is deployed to a non-production Supabase project with server-side environment variables.
- [ ] Signed-out call returns 401.
- [ ] Invalid lesson or malformed answers returns 400.
- [ ] Inactive, unpaid, or expired entitlement returns 403.
- [ ] Correct answers produce the expected percentage; 4/5 passes and 3/5 fails.
- [ ] A request containing forged `score`, `passed`, or `user_id` cannot influence stored values or target another user.
- [ ] Attempt and progress rows belong to the authenticated user.
- [ ] Repeat tests across all 11 lesson answer formats.
- [ ] Only after all lesson pages use this path, remove direct student writes in a separate reviewed migration.
