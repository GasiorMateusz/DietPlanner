-- migration_metadata:
--   purpose: fix JSON operator usage in recalculate_multi_day_plan_summary function
--   affected_functions: public.recalculate_multi_day_plan_summary
--   author: assistant
--   timestamp: 20251115205411
--
-- this migration fixes the SQL function that was using ->>'daily_summary'->>'kcal'
-- which is invalid because ->> returns text, not JSONB. The correct syntax is
-- ->'daily_summary'->>'kcal' where -> returns JSONB and ->> returns text.

-- Fix function to recalculate multi-day plan summary
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
  -- Fixed: use -> for JSONB access, then ->> for text extraction
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

