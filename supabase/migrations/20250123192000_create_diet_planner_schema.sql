-- migration_metadata:
--   purpose: set up the initial database schema based on db-plan.md
--   affected_tables: public.ai_chat_sessions, public.meal_plans
--   author: gemini
--   timestamp: 20251023172500
--
-- this migration creates the core tables, custom types, extensions,
-- indexes, and row-level security policies for the meal planning application.

-- ==== extensions ====
-- enable trigram search extension (for us-006)
-- enables fast partial search in plan names.
create extension if not exists "pg_trgm" with schema "public";

-- ==== custom types ====
-- custom enum type for activity level (prd 3.3.1, decision 6)
-- ensures data consistency for activity level input.
create type "public"."activity_level_enum" as enum (
  'sedentary',
  'light',
  'moderate',
  'high'
);

-- ==== table definitions ====

--
-- table: public.ai_chat_sessions
-- purpose: stores ai telemetry data (prd 3.5, decision 2).
-- details: stores conversation history for analytical purposes.
--
create table "public"."ai_chat_sessions" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "message_history" jsonb,
  "final_prompt_count" integer not null default 1,
  "created_at" timestamptz not null default now(),
  constraint "ai_chat_sessions_pkey" primary key ("id"),
  -- relation to supabase user (decision 4)
  constraint "ai_chat_sessions_user_id_fkey" foreign key ("user_id") references "auth"."users"("id") on delete cascade
);

--
-- table: public.meal_plans
-- purpose: stores saved meal plans (prd 3.2, decision 1).
-- details: main working table for dietitians.
--
create table "public"."meal_plans" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "source_chat_session_id" uuid,
  "name" text not null,
  "plan_content" jsonb not null,
  -- columns from startup form (prd 3.3.1, decision 8)
  "patient_age" integer,
  "patient_weight" numeric(5, 2), -- example precision: 0.00 to 999.99
  "patient_height" numeric(5, 1), -- example precision: 0.0 to 999.9
  "activity_level" public.activity_level_enum,
  "target_kcal" integer,
  "target_macro_distribution" jsonb,
  "meal_names" text, -- stores list of meal names, e.g. "breakfast, second breakfast..."
  "exclusions_guidelines" text,
  -- columns for sorting and tracking (decision 9, us-011)
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "meal_plans_pkey" primary key ("id"),
  -- relation to supabase user (decision 4)
  constraint "meal_plans_user_id_fkey" foreign key ("user_id") references "auth"."users"("id") on delete cascade,
  -- relation to ai session (decision 3)
  -- on delete set null: deleting a chat session doesn't delete the plan.
  constraint "meal_plans_source_chat_session_id_fkey" foreign key ("source_chat_session_id") references "public"."ai_chat_sessions"("id") on delete set null
);

-- ==== indexes ====
-- indexes for foreign keys (improves performance of joins and filtering queries)
create index "idx_meal_plans_user_id" on "public"."meal_plans" using btree ("user_id");
create index "idx_meal_plans_source_chat_session_id" on "public"."meal_plans" using btree ("source_chat_session_id");
create index "idx_ai_chat_sessions_user_id" on "public"."ai_chat_sessions" using btree ("user_id");

-- gin index with pg_trgm for "live" search (us-006, decision 7)
-- essential for efficient ilike '%query%' queries on the 'name' column.
create index "idx_meal_plans_name_trgm" on "public"."meal_plans" using gin ("name" public.gin_trgm_ops);

-- ==== automatic timestamp triggers ====

--
-- function: public.handle_updated_at()
-- purpose: automatic 'updated_at' update (decision 9 / us-011)
--
create or replace function "public"."handle_updated_at"()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

--
-- trigger: on_meal_plan_update
-- purpose: called on every row update in 'meal_plans'
--
create trigger "on_meal_plan_update"
before update on "public"."meal_plans"
for each row
execute procedure "public"."handle_updated_at"();


-- ==== row-level security (rls) ====

-- enable rls on both tables
alter table "public"."meal_plans" enable row level security;
alter table "public"."ai_chat_sessions" enable row level security;

--
-- rls policies for: public.meal_plans
-- goal: authenticated users (dietitians) have full crud access to *only* their own plans.
-- goal: anonymous users have no access.
--

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

--
-- rls policies for: public.ai_chat_sessions
-- goal: authenticated users (dietitians) can only create (insert) sessions.
-- goal: all other access (select, update, delete) is denied for everyone, including the owner.
--       this table is for write-only telemetry (prd 3.5).
--

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
