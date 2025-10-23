# Database Plan

## Required Extensions and Custom Types

### Extensions
```sql
-- Enable trigram search extension (for US-006)
-- Enables fast partial search in plan names.
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### Custom Types
```sql
-- Custom ENUM type for activity level (PRD 3.3.1, Decision 6)
-- Ensures data consistency for activity level input.
CREATE TYPE "public"."activity_level_enum" AS ENUM (
  'sedentary',
  'light',
  'moderate',
  'high'
);
```

## Table Definitions

### AI Chat Sessions Table
```sql
-- Table for storing AI telemetry data (PRD 3.5, Decision 2)
-- Stores conversation history for analytical purposes, not accessible to users.
CREATE TABLE "public"."ai_chat_sessions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "message_history" jsonb,
  "final_prompt_count" integer NOT NULL DEFAULT 1,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "ai_chat_sessions_pkey" PRIMARY KEY ("id"),
  -- Relation to Supabase user (Decision 4)
  CONSTRAINT "ai_chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);
```

### Meal Plans Table
```sql
-- Table storing saved meal plans (PRD 3.2, Decision 1)
-- Main working table for dietitians.
CREATE TABLE "public"."meal_plans" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "source_chat_session_id" uuid,
  "name" text NOT NULL,
  "plan_content" jsonb NOT NULL,
  -- Columns from startup form (PRD 3.3.1, Decision 8)
  "patient_age" integer,
  "patient_weight" numeric(5, 2), -- Example precision: 0.00 to 999.99
  "patient_height" numeric(5, 1), -- Example precision: 0.0 to 999.9
  "activity_level" public.activity_level_enum,
  "target_kcal" integer,
  "target_macro_distribution" jsonb,
  "meal_names" text, -- Stores list of meal names, e.g. "Breakfast, Second Breakfast..."
  "exclusions_guidelines" text,
  -- Columns for sorting and tracking (Decision 9, US-011)
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("id"),
  -- Relation to Supabase user (Decision 4)
  CONSTRAINT "meal_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  -- Relation to AI session (Decision 3)
  CONSTRAINT "meal_plans_source_chat_session_id_fkey" FOREIGN KEY ("source_chat_session_id") REFERENCES "public"."ai_chat_sessions"("id") ON DELETE SET NULL
);
```

## Table Relationships

### auth.users (1) -> (N) public.meal_plans (One-to-Many)
- **Description**: One user (dietitian) can have multiple meal plans.
- **Implementation**: Foreign key `user_id` in `meal_plans` table.
- **Delete Behavior**: `ON DELETE CASCADE` (Decision 4) – deleting a user removes all their meal plans (according to US-004).

### auth.users (1) -> (N) public.ai_chat_sessions (One-to-Many)
- **Description**: One user can have multiple AI chat sessions.
- **Implementation**: Foreign key `user_id` in `ai_chat_sessions` table.
- **Delete Behavior**: `ON DELETE CASCADE` (Decision 4) – deleting a user removes all their telemetry data.

### public.ai_chat_sessions (1) -> (N) public.meal_plans (One-to-Many)
- **Description**: One AI chat session can be the source for multiple meal plans (although in MVP logic this will usually be a 1:1 relationship, the schema allows for 1:N).
- **Implementation**: Foreign key `source_chat_session_id` in `meal_plans` table.
- **Delete Behavior**: `ON DELETE SET NULL` (Decision 3) – deleting a chat session (e.g., for administrative purposes or anonymization) doesn't delete the meal plan; the plan simply loses reference to its source.

## Indexes

```sql
-- Indexes for foreign keys (improves performance of joins and filtering queries)
CREATE INDEX "idx_meal_plans_user_id" ON "public"."meal_plans" USING btree ("user_id");
CREATE INDEX "idx_meal_plans_source_chat_session_id" ON "public"."meal_plans" USING btree ("source_chat_session_id");
CREATE INDEX "idx_ai_chat_sessions_user_id" ON "public"."ai_chat_sessions" USING btree ("user_id");

-- GIN index with pg_trgm for "live" search (US-006, Decision 7)
-- Essential for efficient ILIKE '%query%' queries on the 'name' column.
CREATE INDEX "idx_meal_plans_name_trgm" ON "public"."meal_plans" USING gin ("name" public.gin_trgm_ops);
```

## Row-Level Security (RLS) Policies

### Enable RLS
```sql
-- Enable RLS on both tables
ALTER TABLE "public"."meal_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_chat_sessions" ENABLE ROW LEVEL SECURITY;
```

### Meal Plans Policies
```sql
-- Policies for 'meal_plans' table (Decision 5)
-- User has full access (CRUD) only to their own resources.
CREATE POLICY "Dietitians can manage their own meal plans"
ON "public"."meal_plans" FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### AI Chat Sessions Policies
```sql
-- Policies for 'ai_chat_sessions' table (Decision 5, PRD 3.5)
-- User can only create new sessions (telemetry recording).
CREATE POLICY "Dietitians can create new chat sessions"
ON "public"."ai_chat_sessions" FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- User cannot read, modify, or delete any sessions (neither their own nor others').
CREATE POLICY "Chat sessions are private and cannot be read or modified"
ON "public"."ai_chat_sessions" FOR SELECT, UPDATE, DELETE
USING (false);
```

## Additional Features

### Automatic updated_at Trigger
**Purpose**: Automatic `updated_at` update (Decision 9 / US-011)

For the `updated_at` column in the `meal_plans` table to be automatically updated with every change (which is needed for Dashboard sorting, US-011), a trigger function is required.

```sql
-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION "public"."handle_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger called on every row update in 'meal_plans'
CREATE TRIGGER "on_meal_plan_update"
BEFORE UPDATE ON "public"."meal_plans"
FOR EACH ROW
EXECUTE PROCEDURE "public"."handle_updated_at"();
```
