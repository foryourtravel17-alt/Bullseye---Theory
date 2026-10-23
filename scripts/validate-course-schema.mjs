import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const fail = [];
const check = (condition, message) => {
  if (!condition) fail.push(message);
};
const read = (relative) => {
  const path = resolve(root, relative);
  if (!existsSync(path)) {
    fail.push("required course file missing: " + relative);
    return "";
  }
  return readFileSync(path, "utf8");
};

const adminSql = read("supabase/admin-production.sql");
const authSql = read("supabase/auth-foundation.sql");

for (let lesson = 1; lesson <= 11; lesson += 1) {
  const page = read("lesson-" + lesson + ".html");
  const usesNumberLiteral = page.includes("lesson_number:" + lesson);
  const usesPageConstant = page.includes("lesson_number:lesson") && page.includes(",lesson=" + lesson + ";");
  check(usesNumberLiteral || usesPageConstant, "Lesson " + lesson + " must persist its own lesson number");
  check(page.includes("quiz_attempts"), "Lesson " + lesson + " must record quiz attempts");
  check(page.includes("lesson_progress"), "Lesson " + lesson + " must persist progress");
  check(page.includes("onConflict:"), "Lesson " + lesson + " must use a progress upsert conflict key");

  if (lesson >= 3 && lesson <= 10) {
    check(
      page.includes("score:score*20,passed:pass"),
      "Lesson " + lesson + " must store quiz score as a percentage (0–100)",
    );
    check(
      page.includes("LESSON " + lesson + " / 11"),
      "Lesson " + lesson + " must display the 11-lesson curriculum count",
    );
  }
}

check(
  adminSql.includes("alter table public.lesson_progress add column if not exists lesson_id bigint"),
  "SQL must add/retain the normalized lesson_id key",
);
check(
  adminSql.includes("alter table public.lesson_progress add column if not exists lesson_number integer"),
  "SQL must retain the lesson_number compatibility key used by the course pages",
);
check(
  adminSql.includes("alter table public.quiz_attempts add column if not exists quiz_id bigint"),
  "SQL must add/retain the normalized quiz_id key",
);
check(
  adminSql.includes("alter table public.quiz_attempts add column if not exists lesson_number integer"),
  "SQL must retain the lesson_number compatibility key for quiz attempts",
);
check(
  adminSql.includes("create unique index if not exists lesson_progress_user_lesson_number_uidx"),
  "SQL must support the course pages' user_id + lesson_number upsert conflict target",
);
check(
  adminSql.includes("create or replace function public.sync_lesson_progress_legacy_number()")
    && adminSql.includes("create trigger sync_lesson_progress_legacy_number"),
  "SQL must map lesson_number to lesson_id on writes",
);
check(
  adminSql.includes("create or replace function public.sync_quiz_attempt_legacy_number()")
    && adminSql.includes("create trigger sync_quiz_attempt_legacy_number"),
  "SQL must map lesson_number to quiz_id on writes",
);
check(
  adminSql.includes("set lesson_id = l.id") && adminSql.includes("set quiz_id = q.id"),
  "SQL must backfill the normalized foreign keys from existing numbered records",
);
check(
  adminSql.includes("'Complete Course Revision'") && adminSql.includes("where l.lesson_number between 1 and 11"),
  "SQL must seed missing Lesson 11 and quiz metadata for the 11-lesson curriculum",
);
check(
  adminSql.includes("select count(distinct l.lesson_number)") && adminSql.includes("public.issue_certificate(target_user uuid)"),
  "Certificate issuance must validate all lesson numbers against the lesson catalog",
);
check(
  adminSql.includes("as $function$") && (adminSql.match(/^\$function\$;$/gm) || []).length >= 4,
  "SQL function bodies must use balanced named dollar-quote delimiters",
);
check(
  !/^\s*as \$$/m.test(adminSql) && !/^\s*\$;$/m.test(adminSql),
  "SQL must not contain truncated dollar-quote delimiters",
);
check(
  authSql.includes("revoke all on function public.handle_new_student() from public, anon, authenticated"),
  "Signup trigger function must not be exposed as a callable RPC",
);
check(
  adminSql.includes("revoke all on function public.rls_auto_enable() from public, anon, authenticated"),
  "RLS event-trigger function must not be exposed as a callable RPC",
);
const normalizedAdminSql = adminSql.replace(/\s+/g, " ").toLowerCase();
check(
  normalizedAdminSql.includes(
    "revoke all on table public.profiles, public.course_access, public.lesson_progress, public.quiz_attempts, public.certificates from anon",
  )
    && normalizedAdminSql.includes("execute 'revoke all on table public.practical_submissions from anon'")
    && normalizedAdminSql.includes("execute 'revoke all on table public.trading_journal from anon'"),
  "SQL must revoke direct anon table grants on core and optional student-owned data",
);

if (fail.length) {
  console.error("Course schema validation failed:");
  for (const message of fail) console.error("- " + message);
  process.exit(1);
}

console.log("Course schema compatibility checks passed: 11 lessons, normalized write keys, quiz-score scale, certificate gate, and function-grant safeguards.");
