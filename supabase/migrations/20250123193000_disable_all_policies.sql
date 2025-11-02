-- migration_metadata:
--   purpose: disable all row-level security policies defined in previous migrations
--   affected_tables: public.ai_chat_sessions, public.meal_plans
--   author: assistant
--   timestamp: 20250123193000
--
-- this migration disables all RLS policies by dropping them from both tables.
-- this effectively disables row-level security for these tables.

-- ==== drop policies for public.meal_plans ====

-- drop authenticated policies
drop policy if exists "allow authenticated select on own meal_plans" on "public"."meal_plans";
drop policy if exists "allow authenticated insert on own meal_plans" on "public"."meal_plans";
drop policy if exists "allow authenticated update on own meal_plans" on "public"."meal_plans";
drop policy if exists "allow authenticated delete on own meal_plans" on "public"."meal_plans";

-- drop anon policies
drop policy if exists "deny anon select on meal_plans" on "public"."meal_plans";
drop policy if exists "deny anon insert on meal_plans" on "public"."meal_plans";
drop policy if exists "deny anon update on meal_plans" on "public"."meal_plans";
drop policy if exists "deny anon delete on meal_plans" on "public"."meal_plans";

-- ==== drop policies for public.ai_chat_sessions ====

-- drop authenticated policies
drop policy if exists "allow authenticated insert on ai_chat_sessions" on "public"."ai_chat_sessions";
drop policy if exists "deny authenticated select on ai_chat_sessions" on "public"."ai_chat_sessions";
drop policy if exists "deny authenticated update on ai_chat_sessions" on "public"."ai_chat_sessions";
drop policy if exists "deny authenticated delete on ai_chat_sessions" on "public"."ai_chat_sessions";

-- drop anon policies
drop policy if exists "deny anon insert on ai_chat_sessions" on "public"."ai_chat_sessions";
drop policy if exists "deny anon select on ai_chat_sessions" on "public"."ai_chat_sessions";
drop policy if exists "deny anon update on ai_chat_sessions" on "public"."ai_chat_sessions";
drop policy if exists "deny anon delete on ai_chat_sessions" on "public"."ai_chat_sessions";

-- ==== disable row-level security ====
-- note: this disables RLS entirely on both tables
-- all policies are now removed and RLS is disabled

alter table "public"."meal_plans" disable row level security;
alter table "public"."ai_chat_sessions" disable row level security;
