-- migration_metadata:
--   purpose: add user_preferences table for storing user language preferences
--   affected_tables: public.user_preferences
--   author: ai-assistant
--   timestamp: 20250109221435
--
-- this migration creates the user_preferences table to store user language preferences
-- and other future user preferences. designed to be extensible for additional preference types.

-- ==== table definition ====

--
-- table: public.user_preferences
-- purpose: stores user preferences (language, and extensible for future preferences)
-- details: one row per user, with language preference as the initial implementation
--
create table "public"."user_preferences" (
  "user_id" uuid not null,
  "language" text not null default 'en' check ("language" in ('en', 'pl')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "user_preferences_pkey" primary key ("user_id"),
  -- relation to supabase user
  constraint "user_preferences_user_id_fkey" foreign key ("user_id") references "auth"."users"("id") on delete cascade
);

-- ==== indexes ====
-- index for foreign key (improves performance of joins and filtering queries)
create index "idx_user_preferences_user_id" on "public"."user_preferences" using btree ("user_id");

-- ==== automatic timestamp triggers ====

--
-- trigger: on_user_preferences_update
-- purpose: called on every row update in 'user_preferences'
--
create trigger "on_user_preferences_update"
before update on "public"."user_preferences"
for each row
execute procedure "public"."handle_updated_at"();

-- ==== row-level security (rls) ====

-- enable rls on user_preferences table
alter table "public"."user_preferences" enable row level security;

--
-- policy: allow authenticated select own preferences
-- purpose: users can only read their own preferences
--
create policy "allow authenticated select own preferences"
on "public"."user_preferences" for select
to "authenticated"
using (auth.uid() = user_id);

--
-- policy: allow authenticated insert own preferences
-- purpose: users can only insert their own preferences
--
create policy "allow authenticated insert own preferences"
on "public"."user_preferences" for insert
to "authenticated"
with check (auth.uid() = user_id);

--
-- policy: allow authenticated update own preferences
-- purpose: users can only update their own preferences
--
create policy "allow authenticated update own preferences"
on "public"."user_preferences" for update
to "authenticated"
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

