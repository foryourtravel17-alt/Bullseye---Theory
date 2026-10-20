# Course schema alignment and release gates

## What the repository code expects

The student pages submit `lesson_number` to `lesson_progress` and `quiz_attempts`, and the dashboard reads progress by lesson number. Lesson pages 3–10 now store quiz scores on the same 0–100 scale used by lessons 1, 2, and 11.

The read-only Supabase audit found a normalized live schema using `lesson_id` and `quiz_id` foreign keys. It also found ten catalog lessons and no quiz metadata/questions, while the course UI expects eleven lessons. `admin-production.sql` adds compatibility keys/triggers, seeds missing Lesson 11 and quiz metadata, adds a matching upsert index, consolidates duplicate progress policies, and removes unnecessary direct browser grants on internal tables/functions.

## Before applying the SQL

- This script has **not** been applied to the live Supabase project.
- Back up the database and review the diff against the current schema before running it in Supabase SQL Editor.
- The Supabase project reported no migrations in its migration-history listing. This file is an idempotent hardening/setup script, not a recorded migration. Do not treat a successful GitHub check as proof that it ran.
- The script assumes the current catalogue tables (`lessons`, `quizzes`, `quiz_questions`, and `reels_queue`) already exist. It seeds quiz metadata only; it does not create actual question rows because questions currently live in static HTML.
- Verify the `course_access` admin flow, a new user signup, one lesson quiz write/read, dashboard progress, and certificate gating with a test account after applying changes. Do not test through the existing Render preview until its write target is confirmed; it is configured to use the linked project.

## Remaining production security blockers

1. **Client-side quiz grading is not trusted.** The static pages contain question answer keys and send `passed`, `quiz_passed`, and `completed` from the browser. A student can alter those requests. Before issuing real certificates, move question banks and grading to a protected server-side function and let the database verify progress.
2. **Static files are not an entitlement boundary.** Lesson HTML, PDFs and presentation files are in the static site/repository. A client-side login redirect does not protect the underlying assets. Keep payments disabled until paid content is served from private storage/protected routes and access is enforced server-side.
3. **Content quality review remains.** Lessons 3–10 contain generic placeholder explanations and overly predictable quiz answers. Review and rewrite the material and questions before selling the course.
4. **No payment provider is enabled by this change.** Checkout, access duration, refunds and support terms require their own implementation and tests.

## Checks

`npm test` now includes a static course compatibility validator. It verifies repository contracts, not database execution or production browser behaviour.
