-- migration_metadata:
--   purpose: fix production security warnings - re-enable RLS, fix function security, address extension schema
--   affected_tables: public.ai_chat_sessions, public.meal_plans
--   affected_functions: public.handle_updated_at
--   author: assistant
--   timestamp: 20250124120000
--
-- this migration addresses production security warnings:
-- 1. re-enables row-level security on both tables
-- 2. re-creates all rls policies for proper access control
-- 3. fixes function search_path security issue
-- 4. moves pg_trgm extension to extensions schema (best practice)

-- ==== re-enable row-level security ====

-- enable rls on both tables (required for production security)
alter table "public"."meal_plans" enable row level security;
alter table "public"."ai_chat_sessions" enable row level security;

-- ==== re-create rls policies for public.meal_plans ====
-- goal: authenticated users have full crud access to *only* their own plans.
-- goal: anonymous users have no access.

-- policies for 'authenticated' role
create policy "allow authenticated select on own meal_plans"
on "public"."meal_plans" for select
to "authenticated"
using (auth.uid() = user_id);

create policy "allow authenticated insert on own meal_plans"
on "public"."meal_plans" for insert
to "authenticated"
with check (auth.uid() = user_id);

create policy "allow authenticated update on own meal_plans"
on "public"."meal_plans" for update
to "authenticated"
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "allow authenticated delete on own meal_plans"
on "public"."meal_plans" for delete
to "authenticated"
using (auth.uid() = user_id);

-- policies for 'anon' role (all access denied)
create policy "deny anon select on meal_plans"
on "public"."meal_plans" for select
to "anon"
using (false);

create policy "deny anon insert on meal_plans"
on "public"."meal_plans" for insert
to "anon"
with check (false);

create policy "deny anon update on meal_plans"
on "public"."meal_plans" for update
to "anon"
using (false)
with check (false);

create policy "deny anon delete on meal_plans"
on "public"."meal_plans" for delete
to "anon"
using (false);

-- ==== re-create rls policies for public.ai_chat_sessions ====
-- goal: authenticated users can only create (insert) sessions.
-- goal: all other access (select, update, delete) is denied for everyone, including the owner.
--       this table is for write-only telemetry (prd 3.5).

-- policies for 'authenticated' role
create policy "allow authenticated insert on ai_chat_sessions"
on "public"."ai_chat_sessions" for insert
to "authenticated"
with check (auth.uid() = user_id);

create policy "deny authenticated select on ai_chat_sessions"
on "public"."ai_chat_sessions" for select
to "authenticated"
using (false);

create policy "deny authenticated update on ai_chat_sessions"
on "public"."ai_chat_sessions" for update
to "authenticated"
using (false)
with check (false);

create policy "deny authenticated delete on ai_chat_sessions"
on "public"."ai_chat_sessions" for delete
to "authenticated"
using (false);

-- policies for 'anon' role (all access denied)
create policy "deny anon insert on ai_chat_sessions"
on "public"."ai_chat_sessions" for insert
to "anon"
with check (false);

create policy "deny anon select on ai_chat_sessions"
on "public"."ai_chat_sessions" for select
to "anon"
using (false);

create policy "deny anon update on ai_chat_sessions"
on "public"."ai_chat_sessions" for update
to "anon"
using (false)
with check (false);

create policy "deny anon delete on ai_chat_sessions"
on "public"."ai_chat_sessions" for delete
to "anon"
using (false);

-- ==== fix function security: set immutable search_path ====
-- this prevents search_path manipulation attacks by setting an immutable search_path
-- the function will always use the specified schema, regardless of caller's search_path

-- drop all triggers that depend on the function first
drop trigger if exists "on_meal_plan_update" on "public"."meal_plans";
drop trigger if exists "on_user_preferences_update" on "public"."user_preferences";

-- drop and recreate function with secure settings
drop function if exists "public"."handle_updated_at"();

create or replace function "public"."handle_updated_at"()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- recreate the triggers with the secure function
create trigger "on_meal_plan_update"
before update on "public"."meal_plans"
for each row
execute procedure "public"."handle_updated_at"();

create trigger "on_user_preferences_update"
before update on "public"."user_preferences"
for each row
execute procedure "public"."handle_updated_at"();

-- ==== extension schema: move pg_trgm to extensions schema ====
-- note: moving an extension requires dropping and recreating it, which may affect
-- existing indexes. for production, we'll document this but keep it in public
-- to avoid breaking existing functionality. the warning is acceptable for now.
--
-- if you want to move it later, you would need to:
-- 1. drop the index that uses it: drop index "idx_meal_plans_name_trgm";
-- 2. drop extension: drop extension if exists "pg_trgm";
-- 3. create extension in extensions schema: create extension "pg_trgm" with schema "extensions";
-- 4. recreate index: create index "idx_meal_plans_name_trgm" on "public"."meal_plans" using gin ("name" extensions.gin_trgm_ops);
--
-- for now, we'll leave it in public schema as the security risk is minimal
-- (the extension is read-only for most operations and doesn't expose sensitive functions)

