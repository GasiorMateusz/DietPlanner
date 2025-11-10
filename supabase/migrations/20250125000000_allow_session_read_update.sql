-- migration_metadata:
--   purpose: Allow authenticated users to read and update their own AI chat sessions
--   affected_tables: public.ai_chat_sessions
--   affected_policies: ai_chat_sessions RLS policies
--   author: assistant
--   timestamp: 20250125000000
--
-- This migration updates RLS policies to allow authenticated users to:
-- 1. SELECT their own sessions (needed to read message history for follow-up messages)
-- 2. UPDATE their own sessions (needed to save new messages and update prompt count)
--
-- The original design was "write-only telemetry", but the application needs to
-- maintain conversation state by reading and updating sessions.

-- ==== Drop existing deny policies ====

drop policy if exists "deny authenticated select on ai_chat_sessions" on "public"."ai_chat_sessions";
drop policy if exists "deny authenticated update on ai_chat_sessions" on "public"."ai_chat_sessions";

-- ==== Create allow policies for authenticated users ====

-- Allow authenticated users to SELECT their own sessions
create policy "allow authenticated select on own ai_chat_sessions"
on "public"."ai_chat_sessions" for select
to "authenticated"
using (auth.uid() = user_id);

-- Allow authenticated users to UPDATE their own sessions
create policy "allow authenticated update on own ai_chat_sessions"
on "public"."ai_chat_sessions" for update
to "authenticated"
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

