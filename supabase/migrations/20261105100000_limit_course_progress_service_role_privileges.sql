-- Keep the trusted course functions on least-privilege table grants.
-- grade-quiz needs SELECT/INSERT on quiz_attempts and SELECT/INSERT/UPDATE on lesson_progress.
-- complete-lesson needs SELECT/INSERT/UPDATE on lesson_progress and SELECT on quiz_attempts.

revoke delete, truncate, references, trigger
  on table public.lesson_progress
  from service_role;

revoke update, delete, truncate, references, trigger
  on table public.quiz_attempts
  from service_role;

grant select, insert, update
  on table public.lesson_progress
  to service_role;

grant select, insert
  on table public.quiz_attempts
  to service_role;
