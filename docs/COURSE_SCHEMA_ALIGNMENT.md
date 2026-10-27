# Course schema alignment and release gates

## What the repository code expects

The student pages submit `lesson_number` to `lesson_progress` and `quiz_attempts`, and the dashboard reads progress by lesson number. Lesson pages 3–10 store quiz scores on the same 0–100 scale used by lessons 1, 2, and 11.

The read-only live Supabase inspection on 2026-10-27 confirms 11 rows in `public.lessons`, zero rows in `public.quizzes`, zero rows in `public.quiz_questions`, zero rows in `public.lesson_progress`, and two rows in `public.quiz_attempts`. The live schema is normalized around `lesson_id` / `quiz_id`, but the lesson pages still submit `lesson_number`. `lesson_progress` currently has no primary key; the live policy inventory also shows duplicate permissive policies for lesson progress and quiz-attempt inserts. The compatibility SQL in this PR must be reviewed against these current facts before anyone applies it.

## Before applying the SQL

- This script has **not** been applied to the live Supabase project.
- Back up the database and review the diff against the current schema before running it in Supabase SQL Editor.
- Do not apply this PR's SQL and PR #27's primary-key migration together without resolving the schema conflict. PR #14 retains normalized `(user_id, lesson_id)` as the canonical key and adds a compatibility uniqueness key for `(user_id, lesson_number)`; PR #27 instead promotes `(user_id, lesson_number)` to the primary key. Choose one canonical model after checking every deployed client and existing row.
- The live project reports no migration history in the linked project's migration listing. This file is a setup/hardening script, not proof that a migration ran. Green GitHub checks do not execute SQL in Supabase.
- The script assumes the catalogue tables (`lessons`, `quizzes`, `quiz_questions`, and `reels_queue`) already exist. It seeds quiz metadata only; it does not create actual question rows because questions currently live in static HTML.
- The live `course_access` table has a student/admin SELECT policy and admin UPDATE policy; confirm the full admin access-management path in staging before applying changes. Never test using a preview until its Supabase write target is verified.

## Remaining production security blockers

1. **Client-side quiz grading is not trusted.** Static pages contain answer keys and send `passed`, `quiz_passed`, `completed`, and score fields from the browser. Ownership-only RLS checks do not validate these values. Move question banks and grading to a protected server-side function, validate the user's JWT and active course entitlement, and write attempts/progress only through that trusted path. Only then remove direct student write grants and policies; doing it first would break current pages.
2. **Static files are not an entitlement boundary.** Lesson HTML, PDFs, and presentation files in a public static site/repository are directly retrievable. Client-side redirects do not protect the underlying assets. Keep paid checkout disabled until paid content is served from private storage or authenticated server-side routes.
3. **Content quality review remains.** Lessons 3–10 contain generic placeholder explanations and overly predictable quiz answers. Review and rewrite the material and questions before selling the course.
4. **No payment provider is enabled by this change.** Checkout, access duration, refunds, and support terms require their own implementation and tests.

## Checks

`npm test` includes a static course compatibility validator. It verifies repository contracts, not database execution or production browser behaviour.