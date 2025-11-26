-- migration_metadata:
--   purpose: create multi-day meal plans schema with tables, indexes, RLS policies, and triggers
--   affected_tables: public.multi_day_plans, public.multi_day_plan_days, public.meal_plans
--   affected_functions: public.recalculate_multi_day_plan_summary, public.trigger_recalculate_multi_day_plan_summary, public.trigger_recalculate_on_day_plan_update
--   author: assistant
--   timestamp: 20251115203543
--
-- this migration creates the complete schema for multi-day meal plans:
-- 1. multi_day_plans table for storing plan summaries and metadata
-- 2. multi_day_plan_days junction table for linking day plans
-- 3. is_day_plan column on meal_plans table
-- 4. indexes for performance
-- 5. row-level security policies
-- 6. triggers for updated_at and summary recalculation

-- ==== table definitions ====

--
-- table: public.multi_day_plans
-- purpose: stores multi-day meal plan summary and metadata
-- details: links multiple day plans together with common guidelines and summary statistics
--
create table "public"."multi_day_plans" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "source_chat_session_id" uuid,
  "name" text not null,
  -- Summary fields (calculated from day plans)
  "number_of_days" integer not null,
  "average_kcal" numeric(10, 2),
  "average_proteins" numeric(10, 2),
  "average_fats" numeric(10, 2),
  "average_carbs" numeric(10, 2),
  -- Common guidelines applied to all days
  "common_exclusions_guidelines" text,
  "common_allergens" jsonb,
  -- Status tracking
  "is_draft" boolean not null default false,
  -- Timestamps
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "multi_day_plans_pkey" primary key ("id"),
  constraint "multi_day_plans_user_id_fkey" foreign key ("user_id") references "auth"."users"("id") on delete cascade,
  constraint "multi_day_plans_source_chat_session_id_fkey" foreign key ("source_chat_session_id") references "public"."ai_chat_sessions"("id") on delete set null,
  constraint "multi_day_plans_number_of_days_check" check ("number_of_days" > 0 and "number_of_days" <= 7)
);

--
-- table: public.multi_day_plan_days
-- purpose: junction table linking day plans to multi-day plans with explicit ordering
-- details: ensures each day plan belongs to only one multi-day plan and maintains day order
--
create table "public"."multi_day_plan_days" (
  "id" uuid not null default gen_random_uuid(),
  "multi_day_plan_id" uuid not null,
  "day_plan_id" uuid not null,
  "day_number" integer not null,
  "created_at" timestamptz not null default now(),
  constraint "multi_day_plan_days_pkey" primary key ("id"),
  constraint "multi_day_plan_days_multi_day_plan_id_fkey" foreign key ("multi_day_plan_id") references "public"."multi_day_plans"("id") on delete cascade,
  constraint "multi_day_plan_days_day_plan_id_fkey" foreign key ("day_plan_id") references "public"."meal_plans"("id") on delete cascade,
  constraint "multi_day_plan_days_unique_day" unique ("multi_day_plan_id", "day_number"),
  constraint "multi_day_plan_days_unique_day_plan" unique ("day_plan_id"),
  constraint "multi_day_plan_days_day_number_check" check ("day_number" > 0 and "day_number" <= 7)
);

-- ==== modify existing table ====

-- Add column to meal_plans to indicate if it's part of a multi-day plan
alter table "public"."meal_plans" 
add column "is_day_plan" boolean not null default false;

-- ==== indexes ====

-- Indexes for multi_day_plans
create index "idx_multi_day_plans_user_id" on "public"."multi_day_plans" using btree ("user_id");
create index "idx_multi_day_plans_source_chat_session_id" on "public"."multi_day_plans" using btree ("source_chat_session_id");
create index "idx_multi_day_plans_is_draft" on "public"."multi_day_plans" using btree ("is_draft");
-- Search index for multi-day plan names (requires pg_trgm extension)
create index "idx_multi_day_plans_name_trgm" on "public"."multi_day_plans" using gin ("name" gin_trgm_ops);

-- Indexes for junction table
create index "idx_multi_day_plan_days_multi_day_plan_id" on "public"."multi_day_plan_days" using btree ("multi_day_plan_id");
create index "idx_multi_day_plan_days_day_plan_id" on "public"."multi_day_plan_days" using btree ("day_plan_id");
create index "idx_multi_day_plan_days_day_number" on "public"."multi_day_plan_days" using btree ("multi_day_plan_id", "day_number");

-- Index for meal_plans is_day_plan flag
create index "idx_meal_plans_is_day_plan" on "public"."meal_plans" using btree ("is_day_plan");

-- ==== row-level security policies ====

-- Enable RLS on new tables
alter table "public"."multi_day_plans" enable row level security;
alter table "public"."multi_day_plan_days" enable row level security;

-- Multi-Day Plans RLS Policies

-- Authenticated users can SELECT their own multi-day plans
create policy "allow authenticated select on own multi_day_plans"
on "public"."multi_day_plans" for select
to "authenticated"
using (auth.uid() = user_id);

-- Authenticated users can INSERT their own multi-day plans
create policy "allow authenticated insert on own multi_day_plans"
on "public"."multi_day_plans" for insert
to "authenticated"
with check (auth.uid() = user_id);

-- Authenticated users can UPDATE their own multi-day plans
create policy "allow authenticated update on own multi_day_plans"
on "public"."multi_day_plans" for update
to "authenticated"
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Authenticated users can DELETE their own multi-day plans
create policy "allow authenticated delete on own multi_day_plans"
on "public"."multi_day_plans" for delete
to "authenticated"
using (auth.uid() = user_id);

-- Deny anonymous access
create policy "deny anon access on multi_day_plans"
on "public"."multi_day_plans"
to "anon"
using (false);

-- Junction Table RLS Policies

-- Authenticated users can SELECT junction records for their own multi-day plans
create policy "allow authenticated select on own multi_day_plan_days"
on "public"."multi_day_plan_days" for select
to "authenticated"
using (
  exists (
    select 1 from "public"."multi_day_plans"
    where "multi_day_plans"."id" = "multi_day_plan_days"."multi_day_plan_id"
    and "multi_day_plans"."user_id" = auth.uid()
  )
);

-- Authenticated users can INSERT junction records for their own multi-day plans
create policy "allow authenticated insert on own multi_day_plan_days"
on "public"."multi_day_plan_days" for insert
to "authenticated"
with check (
  exists (
    select 1 from "public"."multi_day_plans"
    where "multi_day_plans"."id" = "multi_day_plan_days"."multi_day_plan_id"
    and "multi_day_plans"."user_id" = auth.uid()
  )
  and exists (
    select 1 from "public"."meal_plans"
    where "meal_plans"."id" = "multi_day_plan_days"."day_plan_id"
    and "meal_plans"."user_id" = auth.uid()
  )
);

-- Authenticated users can UPDATE junction records for their own multi-day plans
create policy "allow authenticated update on own multi_day_plan_days"
on "public"."multi_day_plan_days" for update
to "authenticated"
using (
  exists (
    select 1 from "public"."multi_day_plans"
    where "multi_day_plans"."id" = "multi_day_plan_days"."multi_day_plan_id"
    and "multi_day_plans"."user_id" = auth.uid()
  )
)
with check (
  exists (
    select 1 from "public"."multi_day_plans"
    where "multi_day_plans"."id" = "multi_day_plan_days"."multi_day_plan_id"
    and "multi_day_plans"."user_id" = auth.uid()
  )
);

-- Authenticated users can DELETE junction records for their own multi-day plans
create policy "allow authenticated delete on own multi_day_plan_days"
on "public"."multi_day_plan_days" for delete
to "authenticated"
using (
  exists (
    select 1 from "public"."multi_day_plans"
    where "multi_day_plans"."id" = "multi_day_plan_days"."multi_day_plan_id"
    and "multi_day_plans"."user_id" = auth.uid()
  )
);

-- Deny anonymous access
create policy "deny anon access on multi_day_plan_days"
on "public"."multi_day_plan_days"
to "anon"
using (false);

-- ==== triggers ====

-- Trigger for multi_day_plans updated_at
create trigger "on_multi_day_plan_update"
before update on "public"."multi_day_plans"
for each row
execute procedure "public"."handle_updated_at"();

-- Function to recalculate multi-day plan summary
create or replace function "public"."recalculate_multi_day_plan_summary"(
  p_multi_day_plan_id uuid
)
returns void as $$
declare
  v_avg_kcal numeric;
  v_avg_proteins numeric;
  v_avg_fats numeric;
  v_avg_carbs numeric;
  v_day_count integer;
begin
  -- Calculate averages from day plans
  select 
    count(*)::integer,
    avg((mp.plan_content->>'daily_summary'->>'kcal')::numeric),
    avg((mp.plan_content->>'daily_summary'->>'proteins')::numeric),
    avg((mp.plan_content->>'daily_summary'->>'fats')::numeric),
    avg((mp.plan_content->>'daily_summary'->>'carbs')::numeric)
  into 
    v_day_count,
    v_avg_kcal,
    v_avg_proteins,
    v_avg_fats,
    v_avg_carbs
  from "public"."multi_day_plan_days" mdpd
  join "public"."meal_plans" mp on mp.id = mdpd.day_plan_id
  where mdpd.multi_day_plan_id = p_multi_day_plan_id;

  -- Update multi-day plan summary
  update "public"."multi_day_plans"
  set
    "number_of_days" = v_day_count,
    "average_kcal" = v_avg_kcal,
    "average_proteins" = v_avg_proteins,
    "average_fats" = v_avg_fats,
    "average_carbs" = v_avg_carbs,
    "updated_at" = now()
  where "id" = p_multi_day_plan_id;
end;
$$ language plpgsql security definer;

-- Trigger function to recalculate summary when day plan is added/removed
create or replace function "public"."trigger_recalculate_multi_day_plan_summary"()
returns trigger as $$
begin
  if tg_op = 'INSERT' or tg_op = 'DELETE' then
    perform "public"."recalculate_multi_day_plan_summary"(
      coalesce(new.multi_day_plan_id, old.multi_day_plan_id)
    );
  elsif tg_op = 'UPDATE' then
    if new.multi_day_plan_id != old.multi_day_plan_id then
      perform "public"."recalculate_multi_day_plan_summary"(old.multi_day_plan_id);
      perform "public"."recalculate_multi_day_plan_summary"(new.multi_day_plan_id);
    end if;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql;

-- Trigger to recalculate summary when day plan is added/removed/updated in junction table
create trigger "on_multi_day_plan_days_change"
after insert or update or delete on "public"."multi_day_plan_days"
for each row
execute procedure "public"."trigger_recalculate_multi_day_plan_summary"();

-- Trigger function to recalculate when day plan content is updated
create or replace function "public"."trigger_recalculate_on_day_plan_update"()
returns trigger as $$
begin
  -- Recalculate summary for all multi-day plans containing this day plan
  perform "public"."recalculate_multi_day_plan_summary"(mdpd.multi_day_plan_id)
  from "public"."multi_day_plan_days" mdpd
  where mdpd.day_plan_id = new.id;
  return new;
end;
$$ language plpgsql;

-- Trigger to recalculate summary when day plan content is updated
create trigger "on_day_plan_update_recalculate_multi_day"
after update of "plan_content" on "public"."meal_plans"
for each row
when (new.is_day_plan = true)
execute procedure "public"."trigger_recalculate_on_day_plan_update"();

