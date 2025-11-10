-- migration_metadata:
--   purpose: add theme column to user_preferences table for storing user theme preferences
--   affected_tables: public.user_preferences
--   author: ai-assistant
--   timestamp: 20251110090541
--
-- this migration adds the theme column to the user_preferences table to store
-- user theme preferences (light or dark mode). designed to work alongside
-- the existing language preference column.

-- ==== table modification ====

-- add theme column to user_preferences table
alter table "public"."user_preferences"
add column "theme" text not null default 'light' 
check ("theme" in ('light', 'dark'));

-- ==== notes ====
-- existing records will automatically get 'light' as their theme preference
-- due to the default value. the check constraint ensures only valid theme
-- values can be stored.

