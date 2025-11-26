-- migration_metadata:
--   purpose: fix recalculate function to prevent setting number_of_days to 0 during updates
--   affected_functions: public.recalculate_multi_day_plan_summary
--   author: assistant
--   timestamp: 20251115211342
--
-- this migration fixes the recalculate function to ensure number_of_days never goes below 1
-- which prevents constraint violations during the update process when all days are deleted

-- Fix function to recalculate multi-day plan summary
-- Ensure number_of_days never goes below 1 to prevent constraint violations
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
  v_current_number_of_days integer;
begin
  -- Get current number_of_days to preserve it if count is 0
  select number_of_days into v_current_number_of_days
  from "public"."multi_day_plans"
  where "id" = p_multi_day_plan_id;

  -- Calculate averages from day plans
  select 
    count(*)::integer,
    avg((mp.plan_content->'daily_summary'->>'kcal')::numeric),
    avg((mp.plan_content->'daily_summary'->>'proteins')::numeric),
    avg((mp.plan_content->'daily_summary'->>'fats')::numeric),
    avg((mp.plan_content->'daily_summary'->>'carbs')::numeric)
  into 
    v_day_count,
    v_avg_kcal,
    v_avg_proteins,
    v_avg_fats,
    v_avg_carbs
  from "public"."multi_day_plan_days" mdpd
  join "public"."meal_plans" mp on mp.id = mdpd.day_plan_id
  where mdpd.multi_day_plan_id = p_multi_day_plan_id;

  -- If count is 0, keep the current number_of_days (don't set to 0)
  -- This prevents constraint violations during update operations
  -- The application code will set the correct value after inserting new days
  if v_day_count = 0 then
    -- Don't update number_of_days if count is 0 - keep existing value
    -- This allows the update process to temporarily have 0 days without violating constraints
    update "public"."multi_day_plans"
    set
      "average_kcal" = v_avg_kcal,
      "average_proteins" = v_avg_proteins,
      "average_fats" = v_avg_fats,
      "average_carbs" = v_avg_carbs,
      "updated_at" = now()
    where "id" = p_multi_day_plan_id;
  else
    -- Update with the actual count
    update "public"."multi_day_plans"
    set
      "number_of_days" = v_day_count,
      "average_kcal" = v_avg_kcal,
      "average_proteins" = v_avg_proteins,
      "average_fats" = v_avg_fats,
      "average_carbs" = v_avg_carbs,
      "updated_at" = now()
    where "id" = p_multi_day_plan_id;
  end if;
end;
$$ language plpgsql security definer;

