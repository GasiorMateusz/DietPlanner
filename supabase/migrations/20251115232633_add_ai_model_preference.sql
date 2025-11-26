-- migration_metadata:
--   purpose: add ai_model column to user_preferences table for storing user AI model preference
--   affected_tables: public.user_preferences
--   author: ai-assistant
--   timestamp: 20251115232633
--
-- this migration adds the ai_model column to the user_preferences table to store
-- user AI model preference for OpenRouter model identifier. default value is
-- set for existing users to 'openai/gpt-4.1-nano'.

-- ==== table modification ====

-- add ai_model column to user_preferences table
alter table "public"."user_preferences"
add column "ai_model" text;

-- set default for existing users
update "public"."user_preferences"
set "ai_model" = 'openai/gpt-4.1-nano'
where "ai_model" is null;

-- add comment for documentation
comment on column "public"."user_preferences"."ai_model" is 'OpenRouter model identifier for AI conversations (e.g., openai/gpt-4.1-nano)';

