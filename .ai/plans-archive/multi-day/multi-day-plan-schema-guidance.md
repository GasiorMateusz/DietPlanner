# Multi-Day Plan Database Schema Guidance

## Recommended Approach: Junction Table with Explicit Ordering

### Tables Structure

#### 1. `multi_day_plans` Table
Stores the multi-day plan summary and metadata.

```sql
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
  "common_allergens" text, -- comma-separated or JSON array
  -- Status tracking
  "is_draft" boolean not null default false, -- for mid-creation drafts
  -- Timestamps
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "multi_day_plans_pkey" primary key ("id"),
  constraint "multi_day_plans_user_id_fkey" foreign key ("user_id") references "auth"."users"("id") on delete cascade,
  constraint "multi_day_plans_source_chat_session_id_fkey" foreign key ("source_chat_session_id") references "public"."ai_chat_sessions"("id") on delete set null,
  -- Ensure positive number of days
  constraint "multi_day_plans_number_of_days_check" check ("number_of_days" > 0 and "number_of_days" <= 7)
);
```

#### 2. `multi_day_plan_days` Junction Table
Links day plans to multi-day plans with explicit ordering.

```sql
create table "public"."multi_day_plan_days" (
  "id" uuid not null default gen_random_uuid(),
  "multi_day_plan_id" uuid not null,
  "day_plan_id" uuid not null,
  "day_number" integer not null, -- 1, 2, 3, ... up to 7
  "created_at" timestamptz not null default now(),
  constraint "multi_day_plan_days_pkey" primary key ("id"),
  constraint "multi_day_plan_days_multi_day_plan_id_fkey" foreign key ("multi_day_plan_id") references "public"."multi_day_plans"("id") on delete cascade,
  constraint "multi_day_plan_days_day_plan_id_fkey" foreign key ("day_plan_id") references "public"."meal_plans"("id") on delete cascade,
  -- Ensure unique day_number per multi-day plan
  constraint "multi_day_plan_days_unique_day" unique ("multi_day_plan_id", "day_number"),
  -- Ensure each day plan belongs to only one multi-day plan
  constraint "multi_day_plan_days_unique_day_plan" unique ("day_plan_id"),
  -- Ensure day_number is within valid range
  constraint "multi_day_plan_days_day_number_check" check ("day_number" > 0 and "day_number" <= 7)
);
```

#### 3. Modify `meal_plans` Table (Optional)
Add a flag to distinguish single-day plans from day plans that are part of multi-day plans.

```sql
-- Add column to meal_plans to indicate if it's part of a multi-day plan
alter table "public"."meal_plans" 
add column "is_day_plan" boolean not null default false;

-- Add index for filtering
create index "idx_meal_plans_is_day_plan" on "public"."meal_plans" using btree ("is_day_plan");
```

### Indexes

```sql
-- Indexes for multi_day_plans
create index "idx_multi_day_plans_user_id" on "public"."multi_day_plans" using btree ("user_id");
create index "idx_multi_day_plans_source_chat_session_id" on "public"."multi_day_plans" using btree ("source_chat_session_id");
create index "idx_multi_day_plans_is_draft" on "public"."multi_day_plans" using btree ("is_draft");
-- Search index for multi-day plan names
create index "idx_multi_day_plans_name_trgm" on "public"."multi_day_plans" using gin ("name" public.gin_trgm_ops);

-- Indexes for junction table
create index "idx_multi_day_plan_days_multi_day_plan_id" on "public"."multi_day_plan_days" using btree ("multi_day_plan_id");
create index "idx_multi_day_plan_days_day_plan_id" on "public"."multi_day_plan_days" using btree ("day_plan_id");
create index "idx_multi_day_plan_days_day_number" on "public"."multi_day_plan_days" using btree ("multi_day_plan_id", "day_number");
```

### Row-Level Security (RLS) Policies

#### Multi-Day Plans RLS

```sql
-- Enable RLS
alter table "public"."multi_day_plans" enable row level security;

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
```

#### Junction Table RLS

```sql
-- Enable RLS
alter table "public"."multi_day_plan_days" enable row level security;

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
```

### Triggers

#### Update Timestamp Trigger

```sql
-- Trigger for multi_day_plans updated_at
create trigger "on_multi_day_plan_update"
before update on "public"."multi_day_plans"
for each row
execute procedure "public"."handle_updated_at"();
```

#### Auto-Update Summary Trigger (Optional - Can be done in application layer)

```sql
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

-- Trigger to recalculate summary when day plan is added/removed
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

create trigger "on_multi_day_plan_days_change"
after insert or update or delete on "public"."multi_day_plan_days"
for each row
execute procedure "public"."trigger_recalculate_multi_day_plan_summary"();

-- Also recalculate when day plan content is updated
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

create trigger "on_day_plan_update_recalculate_multi_day"
after update of "plan_content" on "public"."meal_plans"
for each row
when (new.is_day_plan = true)
execute procedure "public"."trigger_recalculate_on_day_plan_update"();
```

### Deletion Behavior

#### When Multi-Day Plan is Deleted
- **Cascade Delete**: All junction records in `multi_day_plan_days` are automatically deleted (via `on delete cascade`)
- **Day Plans**: Day plans (`meal_plans` with `is_day_plan = true`) are **NOT automatically deleted** because they might be reused or the user might want to keep them
- **Optional**: Add application logic to delete orphaned day plans, or mark them as available for reuse

#### When Day Plan is Deleted
- **Cascade Delete**: The junction record is automatically deleted (via `on delete cascade`)
- **Multi-Day Plan**: The multi-day plan is **NOT deleted**, but the summary should be recalculated (via trigger)
- **Validation**: Application should prevent deletion if it would leave the multi-day plan incomplete, or automatically delete the multi-day plan if all days are removed

#### Recommended Application Logic

```typescript
// Pseudo-code for deletion logic

// Delete multi-day plan
async function deleteMultiDayPlan(multiDayPlanId: string) {
  // 1. Delete junction records (cascade handles this)
  // 2. Optionally delete orphaned day plans
  // 3. Delete multi-day plan
  await supabase.from("multi_day_plans").delete().eq("id", multiDayPlanId);
  
  // Optional: Clean up orphaned day plans
  // await cleanupOrphanedDayPlans(multiDayPlanId);
}

// Delete day plan (with validation)
async function deleteDayPlan(dayPlanId: string) {
  // 1. Check if day plan is part of a multi-day plan
  const { data: junction } = await supabase
    .from("multi_day_plan_days")
    .select("multi_day_plan_id")
    .eq("day_plan_id", dayPlanId)
    .single();
  
  if (junction) {
    // 2. Check how many days remain in multi-day plan
    const { count } = await supabase
      .from("multi_day_plan_days")
      .select("*", { count: "exact", head: true })
      .eq("multi_day_plan_id", junction.multi_day_plan_id);
    
    if (count === 1) {
      // Last day - delete multi-day plan too
      await deleteMultiDayPlan(junction.multi_day_plan_id);
    } else {
      // Delete day plan (junction record cascades, summary recalculates via trigger)
      await supabase.from("meal_plans").delete().eq("id", dayPlanId);
    }
  } else {
    // Standalone day plan - delete directly
    await supabase.from("meal_plans").delete().eq("id", dayPlanId);
  }
}
```

### Querying Patterns

#### Get Multi-Day Plan with All Day Plans (Ordered)

```sql
-- Get multi-day plan with ordered day plans
select 
  mdp.*,
  json_agg(
    json_build_object(
      'day_number', mdpd.day_number,
      'day_plan', mp.*
    ) order by mdpd.day_number
  ) as day_plans
from "public"."multi_day_plans" mdp
left join "public"."multi_day_plan_days" mdpd on mdpd.multi_day_plan_id = mdp.id
left join "public"."meal_plans" mp on mp.id = mdpd.day_plan_id
where mdp.id = $1
group by mdp.id;
```

#### Get Dashboard List (Multi-Day Plans Only)

```sql
-- Get multi-day plans for dashboard
select 
  mdp.id,
  mdp.name,
  mdp.number_of_days,
  mdp.average_kcal,
  mdp.created_at,
  mdp.updated_at,
  mdp.is_draft
from "public"."multi_day_plans" mdp
where mdp.user_id = $1
  and mdp.is_draft = false
order by mdp.updated_at desc;
```

### Advantages of This Approach

1. **Explicit Ordering**: `day_number` ensures consistent ordering
2. **Data Integrity**: Foreign key constraints prevent orphaned records
3. **Flexibility**: Day plans can be updated independently
4. **Performance**: Indexed queries for fast retrieval
5. **RLS Support**: Proper security policies for multi-tenant access
6. **Cascade Deletes**: Automatic cleanup of junction records
7. **Summary Calculation**: Triggers keep summary in sync
8. **Draft Support**: `is_draft` flag for mid-creation plans

### Considerations

1. **Orphaned Day Plans**: Consider cleanup strategy for day plans not in any multi-day plan
2. **Summary Recalculation**: Triggers can be expensive; consider doing it in application layer instead
3. **Day Plan Reuse**: Current design prevents day plans from being in multiple multi-day plans (unique constraint). If reuse is needed, remove the unique constraint on `day_plan_id`
4. **Migration**: Existing single-day plans remain unchanged; new `is_day_plan` flag distinguishes them

