-- migration_metadata:
--   purpose: add terms acceptance columns to user_preferences table for storing user terms and privacy policy acceptance
--   affected_tables: public.user_preferences
--   author: ai-assistant
--   timestamp: 20250125200000
--
-- this migration adds terms_accepted and terms_accepted_at columns to the user_preferences table
-- to store user acceptance of Terms and Privacy Policy. includes a trigger to automatically
-- set terms_accepted_at timestamp when terms_accepted changes to true.

-- ==== table modification ====

-- add terms acceptance columns to user_preferences table
alter table "public"."user_preferences"
add column "terms_accepted" boolean not null default false,
add column "terms_accepted_at" timestamptz;

-- add comments for documentation
comment on column "public"."user_preferences"."terms_accepted" is 'Boolean flag indicating user has accepted Terms and Privacy Policy';
comment on column "public"."user_preferences"."terms_accepted_at" is 'Timestamp when user accepted terms (set automatically when terms_accepted changes to true)';

-- ==== trigger function and trigger ====

--
-- function: public.handle_terms_accepted_at()
-- purpose: automatically set terms_accepted_at when terms_accepted changes to true
-- details: sets timestamp when terms_accepted changes from false/null to true,
--          clears timestamp when terms_accepted changes to false
--
create or replace function "public"."handle_terms_accepted_at"()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- handle insert: set timestamp if terms_accepted is true on insert
  if tg_op = 'INSERT' then
    if new.terms_accepted = true then
      new.terms_accepted_at = now();
    end if;
    return new;
  end if;

  -- handle update: set timestamp when terms_accepted changes from false/null to true
  if new.terms_accepted = true and (old.terms_accepted is null or old.terms_accepted = false) then
    new.terms_accepted_at = now();
  end if;
  
  -- clear timestamp when terms_accepted changes to false
  if new.terms_accepted = false then
    new.terms_accepted_at = null;
  end if;
  
  return new;
end;
$$;

--
-- trigger: on_user_preferences_terms_accepted
-- purpose: called on insert or update when terms_accepted column changes
-- details: automatically sets terms_accepted_at timestamp when terms_accepted becomes true
-- note: the function handles the logic for when to set/clear the timestamp
--
create trigger "on_user_preferences_terms_accepted"
before insert or update on "public"."user_preferences"
for each row
execute function "public"."handle_terms_accepted_at"();

-- ==== notes ====
-- existing records will automatically get terms_accepted = false and terms_accepted_at = null
-- due to the default value and nullable column. the trigger ensures that when a user
-- accepts terms (terms_accepted changes to true), the timestamp is automatically set.
-- no new rls policies are needed - existing policies on user_preferences table already
-- cover these new columns.

