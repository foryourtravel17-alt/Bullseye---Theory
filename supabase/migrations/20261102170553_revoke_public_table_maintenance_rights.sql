-- RLS does not protect against table-level TRUNCATE/REFERENCES/TRIGGER privileges.
-- Remove maintenance privileges from public API roles on all exposed public tables.
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

-- Prevent the same unsafe defaults from being reintroduced for future public tables
-- created by the Supabase postgres role.
alter default privileges for role postgres in schema public
  revoke truncate, references, trigger on tables from anon, authenticated;
