# Diet Planner - Project Summary

This document provides a comprehensive overview of the Diet Planner MVP project for fresh starts with new agents. It includes project structure, tech stack, key documentation, rules, patterns, and implementation details.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Key Documentation Files](#key-documentation-files)
5. [Cursor Rules (.mdc files)](#cursor-rules-mdc-files)
6. [Database Schema](#database-schema)
7. [API Structure](#api-structure)
8. [Authentication & Authorization](#authentication--authorization)
9. [Internationalization (i18n)](#internationalization-i18n)
10. [Key Patterns & Conventions](#key-patterns--conventions)
11. [Testing Structure](#testing-structure)
12. [Deployment](#deployment)

---

## Project Overview

Diet Planner is a Minimum Viable Product (MVP) web application designed to streamline the work of dietitians by automating and accelerating the creation of personalized meal plans (1-day and multi-day) using AI.

### Core Workflow

1. **Form Input**: The dietitian fills out a structured form with patient parameters, caloric goals, macronutrients, and exclusions. For multi-day plans, the form includes options for number of days and meal variety.
2. **AI Generation & Save**: The AI generates a meal plan in a conversational interface, allowing for iterative corrections. Once accepted, the plan is saved directly and can be exported to a .doc file.
3. **Plan Editing**: Saved plans can be edited through the AI chat interface, allowing modifications while preserving the original plan structure. Users can choose to overwrite the existing plan or create a new one.

### Key Features

- User Authentication (email/password with Supabase Auth)
- Dashboard (view, search, delete meal plans)
- Meal Plan Creation (Startup Form → AI Chat → Save & Export)
- Multi-Day Meal Plans (support for 1-7 day plans)
- Plan Editing (edit existing plans via AI chat with overwrite/new plan options)
- Plan Viewing (view saved plans with day-by-day breakdown)
- Export to .doc file
- Terms and Privacy Policy (bilingual: English/Polish)
- Language Switching (English/Polish)
- Theme Switching (Light/Dark)
- Account Management (view account, delete account)

### Out of Scope (MVP)

- External recipe database integration
- Mobile application
- Social features
- Patient entity management

---

## Tech Stack

### Frontend

- **Astro 5** - Fast, performant static site generation with minimal JavaScript
- **React 19** - Interactive components (chat, forms)
- **TypeScript 5** - Static type checking
- **Tailwind 4** - Utility-first CSS styling
- **Shadcn/ui** - Accessible React component library (New York style, neutral color)
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **react-markdown** - Markdown rendering for terms content

### Backend

- **Supabase** - Backend-as-a-Service (BaaS)
  - PostgreSQL Database
  - User Authentication (email/password)
  - Row Level Security (RLS)
  - Server-side SDK and Admin client

### AI

- **OpenRouter.ai** - Access to multiple AI models (OpenAI, Anthropic, Google, etc.)

### Testing

- **Vitest** - Unit and integration test runner
- **React Testing Library** - Component testing
- **Playwright** - End-to-end testing
- **MSW (Mock Service Worker)** - API mocking

### CI/CD & Hosting

- **GitHub Actions** - CI/CD pipelines
- **DigitalOcean** - Hosting via Docker image
- **Node.js Adapter** - Astro server output (also supports Cloudflare adapter)

---

## Project Structure

```
DietPlanner/
├── .ai/                          # Implementation plans and documentation
│   ├── prd.md                    # Product Requirements Document
│   ├── ui-plan.md                # UI Architecture Plan
│   ├── auth-spec.md              # Authentication Specification
│   ├── db-plan.md                # Database Schema Plan
│   ├── terms-privacy-policy-implementation-plan.md
│   └── [other implementation plans]
├── .cursor/                      # Cursor IDE rules
│   ├── rules/                    # .mdc rule files
│   └── commands/                 # Command documentation
├── supabase/                     # Supabase configuration and migrations
│   ├── migrations/               # Database migration files
│   └── config.toml               # Supabase CLI configuration
├── public/                       # Public static assets
│   ├── terms-privacy-policy.en.json  # Terms content (English)
│   ├── terms-privacy-policy.pl.json  # Terms content (Polish)
│   └── favicon.png
├── src/
│   ├── components/               # React and Astro components
│   │   ├── account/              # Account management components
│   │   │   └── AccountProfile.tsx
│   │   ├── auth/                 # Authentication components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   ├── ResetPasswordForm.tsx
│   │   │   ├── DeleteAccountConfirmationDialog.tsx
│   │   │   └── AuthPageWrapper.astro
│   │   ├── terms/                # Terms and Privacy Policy
│   │   │   └── TermsAndPrivacyModal.tsx
│   │   ├── ui/                   # Shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   └── [other UI components]
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useDebounce.ts
│   │   │   ├── useAIChatForm.ts
│   │   │   ├── useMealPlansList.ts
│   │   │   ├── useSessionConfirmation.ts
│   │   │   └── useStartupForm.ts
│   │   ├── AIChatInterface.tsx   # AI chat component
│   │   ├── DashboardView.tsx     # Dashboard component
│   │   ├── LanguageSelector.tsx  # Language toggle
│   │   ├── ThemeToggle.tsx       # Theme toggle
│   │   ├── NavBar.tsx            # Navigation bar
│   │   └── AppWithTranslations.tsx  # Translation provider wrapper
│   ├── db/                       # Database clients and types
│   │   ├── database.types.ts     # Generated Supabase types
│   │   ├── supabase.client.ts    # Client-side Supabase client
│   │   ├── supabase.server.ts    # Server-side Supabase client
│   │   └── supabase.admin.ts     # Admin Supabase client
│   ├── layouts/                  # Astro layouts
│   │   ├── Layout.astro          # Public layout (auth pages)
│   │   ├── PrivateLayout.astro   # Private layout (app pages)
│   │   └── LandingLayout.astro   # Landing page layout
│   ├── lib/                      # Services and utilities
│   │   ├── account/              # Account service
│   │   │   └── account.service.ts
│   │   ├── ai/                   # AI services
│   │   │   ├── openrouter.service.ts
│   │   │   └── session.service.ts
│   │   ├── api/                  # API client utilities
│   │   │   ├── base.client.ts
│   │   │   ├── meal-plans.client.ts
│   │   │   ├── multi-day-plans.client.ts
│   │   │   ├── user-preferences.client.ts
│   │   │   └── ai-chat.client.ts
│   │   ├── auth/                 # Authentication utilities
│   │   │   ├── auth-state.server.ts
│   │   │   ├── get-auth-token.ts
│   │   │   ├── session.service.ts
│   │   │   ├── auth-error.utils.ts
│   │   │   └── password-reset.utils.ts
│   │   ├── i18n/                 # Internationalization
│   │   │   ├── TranslationProvider.tsx
│   │   │   ├── useTranslation.ts
│   │   │   ├── types.ts
│   │   │   └── translations/
│   │   │       ├── en.json
│   │   │       └── pl.json
│   │   ├── meal-plans/           # Meal plan services
│   │   │   ├── meal-plan.service.ts
│   │   │   └── doc-generator.service.ts
│   │   ├── multi-day-plans/      # Multi-day meal plan services
│   │   │   └── multi-day-plan.service.ts
│   │   ├── terms/                # Terms and Privacy Policy
│   │   │   ├── terms.config.ts   # Required section IDs
│   │   │   ├── terms.types.ts    # TypeScript types
│   │   │   └── terms-loader.ts   # JSON content loader
│   │   ├── theme/                # Theme management
│   │   │   ├── ThemeProvider.tsx
│   │   │   └── useTheme.ts
│   │   ├── user-preferences/     # User preferences service
│   │   │   └── user-preference.service.ts
│   │   ├── utils/                # Utility functions
│   │   │   ├── date.ts           # Date formatting
│   │   │   ├── meal-plan-parser.ts
│   │   │   ├── meal-plan-calculations.ts
│   │   │   ├── chat-helpers.ts
│   │   │   └── get-app-url.ts
│   │   ├── validation/           # Zod validation schemas
│   │   │   ├── auth.schemas.ts
│   │   │   ├── meal-plans.schemas.ts
│   │   │   ├── user-preferences.schemas.ts
│   │   │   └── ai.schemas.ts
│   │   ├── errors.ts             # Custom error classes
│   │   └── utils.ts              # General utilities
│   ├── middleware/               # Astro middleware
│   │   └── index.ts              # Authentication middleware
│   ├── pages/                    # Astro pages
│   │   ├── api/                  # API endpoints
│   │   │   ├── account/
│   │   │   │   └── index.ts      # DELETE /api/account
│   │   │   ├── ai/
│   │   │   │   └── sessions/
│   │   │   │       ├── [id]/
│   │   │   │       │   └── message.ts  # POST /api/ai/sessions/[id]/message
│   │   │   │       └── index.ts        # POST /api/ai/sessions
│   │   │   ├── meal-plans/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── export.ts      # GET /api/meal-plans/[id]/export
│   │   │   │   │   └── index.ts       # GET, PUT, DELETE /api/meal-plans/[id]
│   │   │   │   └── index.ts           # GET, POST /api/meal-plans
│   │   │   ├── multi-day-plans/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── export.ts      # GET /api/multi-day-plans/[id]/export
│   │   │   │   │   └── index.ts       # GET, PUT, DELETE /api/multi-day-plans/[id]
│   │   │   │   └── index.ts           # GET, POST /api/multi-day-plans
│   │   │   └── user-preferences/
│   │   │       └── index.ts           # GET, PUT /api/user-preferences
│   │   ├── app/                  # Private pages (require auth)
│   │   │   ├── account.astro     # Account profile page
│   │   │   ├── dashboard.astro   # Dashboard page
│   │   │   ├── create.astro      # AI chat page (create mode)
│   │   │   ├── edit/
│   │   │   │   └── [id].astro    # AI chat page (edit mode)
│   │   │   └── view/
│   │   │       └── [id].astro    # View meal plan page
│   │   ├── auth/                 # Public auth pages
│   │   │   ├── login.astro
│   │   │   ├── register.astro
│   │   │   ├── forgot-password.astro
│   │   │   └── reset-password.astro
│   │   └── index.astro           # Landing page (redirects)
│   ├── styles/
│   │   └── global.css            # Global styles and Tailwind imports
│   ├── test/                     # Test files
│   │   ├── e2e/                  # End-to-end tests (Playwright)
│   │   ├── integration/          # Integration tests
│   │   ├── unit/                 # Unit tests (Vitest)
│   │   ├── mocks/                # MSW handlers
│   │   └── utils/                # Test utilities
│   ├── types.ts                  # Shared TypeScript types (DTOs, entities)
│   └── env.d.ts                  # TypeScript environment definitions
├── .github/
│   └── workflows/
│       └── master.yml            # GitHub Actions CI/CD
├── .nvmrc                        # Node.js version (22.14.0)
├── astro.config.mjs              # Astro configuration
├── components.json               # Shadcn/ui configuration
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project README
```

---

## Key Documentation Files

### `.ai/prd.md`
**Product Requirements Document** - Comprehensive product specification including:
- User problem statement
- Functional requirements (user account management, dashboard, meal plan creation, export)
- Product boundaries (MVP scope)
- User stories
- Technical decisions

### `.ai/ui-plan.md`
**UI Architecture Plan** - Detailed UI structure including:
- Hybrid model (Astro for static, React for interactive)
- Public and Private layouts
- View list and routing
- Component structure
- User journey maps
- Key components description

### `.ai/auth-spec.md`
**Authentication Specification** - Complete auth implementation plan:
- User interface architecture
- Authentication flow
- Component structure
- API integration
- Error handling
- Security considerations

### `.ai/db-plan.md`
**Database Plan** - Database schema design:
- Table definitions (meal_plans, ai_chat_sessions, user_preferences)
- Custom types and enums
- Indexes
- Row Level Security (RLS) policies
- Triggers and functions

### `.ai/terms-privacy-policy-implementation-plan.md`
**Terms and Privacy Policy Implementation** - Complete feature implementation:
- Bilingual support (English/Polish)
- JSON-based content structure
- Registration flow integration
- Account profile integration
- Database schema (terms_accepted, terms_accepted_at)
- API endpoints
- Component structure

### `.ai/meal-plans-implementation-plan.md`
**Meal Plans Implementation** - Meal plan management feature:
- Dashboard view
- Meal plan creation flow
- Export functionality
- API endpoints

### `.ai/dashboard-view-implementation-plan.md`
**Dashboard Implementation** - Dashboard view details:
- Meal plan list
- Search functionality
- Create new plan flow
- Delete confirmation
- Empty state handling

### `.ai/chat-view-implementation-plan.md`
**AI Chat Implementation** - AI chat interface:
- Conversation flow
- Message history
- AI integration (OpenRouter)
- Session management
- Error handling


### `.ai/export-implementation-plan.md` & `.ai/export-feature-extension-implementation-plan.md`
**Export Implementation** - Document export functionality:
- .doc file generation
- Export template
- Options modal (extended feature)
- Download handling

### `.ai/language-implementation-plan.md`
**Language Implementation** - Internationalization (i18n):
- Translation system
- Language switching
- Translation files structure
- Language preference storage

### `.ai/dark-mode-implementation-plan.md`
**Dark Mode Implementation** - Theme switching:
- Theme provider
- Theme toggle component
- Theme preference storage
- CSS variable management

### `.ai/account-removal-plan.md`
**Account Removal Implementation** - Account deletion:
- Delete account flow
- Data cleanup
- Confirmation dialog
- API endpoint

---

## Cursor Rules (.mdc files)

### `.cursor/rules/shared.mdc` (Always Applied)
**Shared Rules** - Core project rules:
- Tech stack (Astro 5, TypeScript 5, React 19, Tailwind 4, Shadcn/ui)
- Project structure guidelines
- Coding practices (error handling, early returns, guard clauses)
- Clean code principles

### `.cursor/rules/frontend.mdc`
**Frontend Guidelines**:
- Astro for static content, React for interactivity
- Tailwind styling guidelines (@layer, arbitrary values, dark mode)
- ARIA best practices for accessibility
- Responsive design patterns

### `.cursor/rules/backend.mdc`
**Backend Guidelines**:
- Supabase for backend services
- Zod schemas for validation
- Use `context.locals.supabase` in Astro routes
- Use `SupabaseClient` type from `src/db/supabase.client.ts`

### `.cursor/rules/react.mdc`
**React Guidelines**:
- Functional components with hooks
- Never use "use client" (Next.js directive)
- Extract logic into custom hooks in `src/components/hooks`
- Use React.memo(), useCallback(), useMemo() for optimization
- Use useId() for accessibility

### `.cursor/rules/astro.mdc`
**Astro Guidelines**:
- View Transitions API for smooth page transitions
- Server Endpoints for API routes
- Use POST, GET (uppercase) for endpoint handlers
- Use `export const prerender = false` for API routes
- Zod for input validation
- Extract logic into services in `src/lib/services`
- Use `Astro.cookies` for server-side cookie management

### `.cursor/rules/db-supabase-migrations.mdc`
**Database Migration Guidelines**:
- Migration file naming: `YYYYMMDDHHmmss_short_description.sql`
- Include header comments with metadata
- Write SQL in lowercase
- Always enable RLS on new tables
- Create granular RLS policies (one per operation and role)
- Include thorough comments

### `.cursor/rules/ui-shadcn-helper.mdc`
**Shadcn/ui Guidelines**:
- Components in `src/components/ui`
- Use `@/` alias for imports
- Install new components: `npx shadcn@latest add [component-name]`
- Style: "new-york" with "neutral" color
- Use CSS variables for theming

### `.cursor/rules/api-supabase-astro-init.mdc`
**Supabase Astro Integration**:
- Supabase client initialization
- Middleware setup
- TypeScript environment definitions
- Context locals setup

### `.cursor/rules/vitest-unit-testing.mdc`
**Unit Testing Guidelines**:
- Vitest for unit tests
- React Testing Library for components
- Test file structure
- Mocking patterns

### `.cursor/rules/playwright-e2e-itesting.mdc`
**E2E Testing Guidelines**:
- Playwright for end-to-end tests
- Page object model
- Test structure
- Best practices

### `.cursor/rules/docker.mdc`
**Docker Guidelines**:
- Dockerfile structure
- Multi-stage builds
- Environment variables
- Production deployment

### `.cursor/rules/github-action.mdc`
**GitHub Actions Guidelines**:
- CI/CD pipeline structure
- Test execution
- Build process
- Deployment workflow

---

## Database Schema

### Tables

#### `meal_plans`
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to auth.users)
- `name` (text)
- `plan_content` (jsonb) - Structured meal plan data
- `target_kcal` (numeric)
- `target_macro_distribution` (jsonb)
- `patient_age`, `patient_weight`, `patient_height` (numeric)
- `activity_level` (activity_level_enum)
- `meal_names` (text)
- `exclusions_guidelines` (text)
- `source_chat_session_id` (uuid, foreign key to ai_chat_sessions)
- `is_day_plan` (boolean) - Indicates if this meal plan is part of a multi-day plan
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Indexes:**
- `idx_meal_plans_user_id` (btree on user_id)
- `idx_meal_plans_name_trgm` (gin trigram on name) - for search

**RLS Policies:**
- Authenticated users can SELECT, INSERT, UPDATE, DELETE their own meal plans
- Anonymous users have no access

#### `multi_day_plans`
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to auth.users)
- `name` (text)
- `number_of_days` (integer) - Number of days in the plan (1-7, constraint enforced)
- `average_kcal` (numeric) - Average calories per day (calculated automatically)
- `average_proteins` (numeric) - Average proteins per day (calculated automatically)
- `average_fats` (numeric) - Average fats per day (calculated automatically)
- `average_carbs` (numeric) - Average carbs per day (calculated automatically)
- `common_exclusions_guidelines` (text, nullable) - Common dietary exclusions across all days
- `common_allergens` (jsonb, nullable) - Common allergens array
- `source_chat_session_id` (uuid, nullable, foreign key to ai_chat_sessions)
- `is_draft` (boolean, default false) - Status tracking flag
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Indexes:**
- `idx_multi_day_plans_user_id` (btree on user_id)
- `idx_multi_day_plans_source_chat_session_id` (btree on source_chat_session_id)
- `idx_multi_day_plans_is_draft` (btree on is_draft)
- `idx_multi_day_plans_name_trgm` (gin trigram on name) - for search

**RLS Policies:**
- Authenticated users can SELECT, INSERT, UPDATE, DELETE their own multi-day plans
- Anonymous users have no access

**Triggers:**
- `on_multi_day_plan_update` - Updates `updated_at` timestamp
- `on_multi_day_plan_days_change` - Recalculates summary when day plans are added/removed/updated
- `on_day_plan_update_recalculate_multi_day` - Recalculates summary when day plan content is updated

**Functions:**
- `recalculate_multi_day_plan_summary()` - Calculates averages from linked day plans
- `trigger_recalculate_multi_day_plan_summary()` - Trigger function for junction table changes
- `trigger_recalculate_on_day_plan_update()` - Trigger function for day plan content updates

#### `multi_day_plan_days`
- `id` (uuid, primary key)
- `multi_day_plan_id` (uuid, foreign key to multi_day_plans, on delete cascade)
- `day_plan_id` (uuid, foreign key to meal_plans, on delete cascade)
- `day_number` (integer) - Day number (1-7, constraint enforced)
- `created_at` (timestamptz)

**Constraints:**
- Unique constraint on (`multi_day_plan_id`, `day_number`) - Ensures one day per number per plan
- Unique constraint on `day_plan_id` - Ensures each day plan belongs to only one multi-day plan

**Indexes:**
- `idx_multi_day_plan_days_multi_day_plan_id` (btree on multi_day_plan_id)
- `idx_multi_day_plan_days_day_plan_id` (btree on day_plan_id)
- `idx_multi_day_plan_days_day_number` (btree on multi_day_plan_id, day_number)

**RLS Policies:**
- Authenticated users can SELECT, INSERT, UPDATE, DELETE their own day plan links (via multi-day plan ownership)
- Anonymous users have no access

**Triggers:**
- `on_multi_day_plan_days_change` - Automatically recalculates summary in `multi_day_plans` when day links are added/removed/updated

#### `ai_chat_sessions`
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to auth.users)
- `message_history` (jsonb)
- `final_prompt_count` (integer)
- `created_at` (timestamptz)

**RLS Policies:**
- Authenticated users can INSERT their own sessions
- No SELECT, UPDATE, DELETE access (telemetry data, not user-accessible)

#### `user_preferences`
- `user_id` (uuid, primary key, foreign key to auth.users)
- `language` (text, default 'en', check: 'en' or 'pl')
- `theme` (text, default 'light', check: 'light' or 'dark')
- `terms_accepted` (boolean, default false)
- `terms_accepted_at` (timestamptz, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Indexes:**
- `idx_user_preferences_user_id` (btree on user_id)

**RLS Policies:**
- Authenticated users can SELECT, INSERT, UPDATE their own preferences
- Anonymous users have no access

**Triggers:**
- `on_user_preferences_update` - Updates `updated_at` timestamp
- `on_user_preferences_terms_accepted` - Sets `terms_accepted_at` when `terms_accepted` changes to true

### Custom Types

#### `activity_level_enum`
- `sedentary`
- `light`
- `moderate`
- `high`

### Functions

#### `handle_updated_at()`
- Updates `updated_at` timestamp on table updates
- Used by triggers on `meal_plans`, `user_preferences`, and `multi_day_plans`

#### `handle_terms_accepted_at()`
- Sets `terms_accepted_at` timestamp when `terms_accepted` changes to true
- Clears `terms_accepted_at` when `terms_accepted` changes to false
- Used by trigger on `user_preferences`

#### `recalculate_multi_day_plan_summary(p_multi_day_plan_id uuid)`
- Calculates average macros (kcal, proteins, fats, carbs) from all linked day plans
- Updates `number_of_days`, `average_kcal`, `average_proteins`, `average_fats`, `average_carbs` in `multi_day_plans`
- Called automatically by triggers when day plans are added/removed/updated
- Security definer function for RLS bypass

#### `trigger_recalculate_multi_day_plan_summary()`
- Trigger function that calls `recalculate_multi_day_plan_summary()` when junction table changes
- Handles INSERT, UPDATE, DELETE operations on `multi_day_plan_days`

#### `trigger_recalculate_on_day_plan_update()`
- Trigger function that recalculates summary when day plan content is updated
- Only triggers when `is_day_plan = true` and `plan_content` changes

---

## API Structure

### Authentication Endpoints

**Note:** Authentication is handled directly by Supabase Auth SDK on the client side. No custom API endpoints for login/register.

### Meal Plans Endpoints

#### `GET /api/meal-plans`
- **Description**: Get all meal plans for authenticated user
- **Query Params**: `search` (optional) - Search by name
- **Response**: `200 OK` with array of meal plans
- **Auth**: Required

#### `POST /api/meal-plans`
- **Description**: Create a new meal plan
- **Request Body**: Meal plan data (name, plan_content, etc.)
- **Response**: `201 Created` with created meal plan
- **Auth**: Required

#### `GET /api/meal-plans/[id]`
- **Description**: Get a specific meal plan
- **Response**: `200 OK` with meal plan data
- **Auth**: Required (own plans only)

#### `PUT /api/meal-plans/[id]`
- **Description**: Update a meal plan
- **Request Body**: Updated meal plan data
- **Response**: `200 OK` with updated meal plan
- **Auth**: Required (own plans only)

#### `DELETE /api/meal-plans/[id]`
- **Description**: Delete a meal plan
- **Response**: `204 No Content`
- **Auth**: Required (own plans only)

#### `GET /api/meal-plans/[id]/export`
- **Description**: Export meal plan to .doc file
- **Response**: `200 OK` with .doc file (Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document)
- **Auth**: Required (own plans only)

### Multi-Day Plans Endpoints

#### `GET /api/multi-day-plans`
- **Description**: Get all multi-day plans for authenticated user
- **Query Params**: 
  - `search` (optional) - Search by name (case-insensitive partial match)
  - `sort` (optional) - Sort field: `created_at`, `updated_at`, or `name` (default: `updated_at`)
  - `order` (optional) - Sort order: `asc` or `desc` (default: `desc`)
- **Response**: `200 OK` with array of `MultiDayPlanListItemDto`
- **Auth**: Required

#### `POST /api/multi-day-plans`
- **Description**: Create a new multi-day plan with all day plans
- **Request Body**: `CreateMultiDayPlanCommand` (name, number_of_days, source_chat_session_id, common_exclusions_guidelines, common_allergens, day_plans array)
- **Response**: `201 Created` with `CreateMultiDayPlanResponseDto` (includes all day plans)
- **Auth**: Required
- **Note**: Creates the main plan record, individual day plans (with `is_day_plan = true`), and junction table links. Automatically calculates summary averages.

#### `GET /api/multi-day-plans/[id]`
- **Description**: Get a specific multi-day plan with all day plans
- **Response**: `200 OK` with `GetMultiDayPlanByIdResponseDto` (includes all day plans with full meal plan data)
- **Auth**: Required (own plans only)

#### `PUT /api/multi-day-plans/[id]`
- **Description**: Update a multi-day plan (supports updating day plans, name, and other fields)
- **Request Body**: `UpdateMultiDayPlanCommand` (partial update, all fields optional)
- **Response**: `200 OK` with `GetMultiDayPlanByIdResponseDto`
- **Auth**: Required (own plans only)
- **Note**: When updating `day_plans`, all existing day plans are deleted and new ones are created. Summary is automatically recalculated.

#### `DELETE /api/multi-day-plans/[id]`
- **Description**: Delete a multi-day plan and all associated day plans
- **Response**: `204 No Content`
- **Auth**: Required (own plans only)
- **Note**: Cascade deletes all linked day plans via foreign key constraints

#### `GET /api/multi-day-plans/[id]/export`
- **Description**: Export multi-day plan to .doc or HTML file
- **Query Params**:
  - `format` (required) - `doc` or `html`
  - `dailySummary` (optional, default: `true`) - Include daily summary
  - `mealsSummary` (optional, default: `true`) - Include meals summary
  - `ingredients` (optional, default: `true`) - Include ingredients
  - `preparation` (optional, default: `true`) - Include preparation instructions
- **Response**: `200 OK` with file (Content-Type: `application/vnd.openxmlformats-officedocument.wordprocessingml.document` for DOC or `text/html` for HTML)
- **Auth**: Required (own plans only)

### AI Chat Endpoints

#### `POST /api/ai/sessions`
- **Description**: Create a new AI chat session
- **Request Body**: Startup form data (patient data, goals, exclusions)
- **Response**: `201 Created` with session ID and first AI message
- **Auth**: Required

#### `POST /api/ai/sessions/[id]/message`
- **Description**: Send a message to AI chat session
- **Request Body**: `{ message: string }`
- **Response**: `200 OK` with AI response
- **Auth**: Required (own sessions only)

### User Preferences Endpoints

#### `GET /api/user-preferences`
- **Description**: Get user preferences (language, theme, terms acceptance)
- **Response**: `200 OK` with preferences
- **Auth**: Required
- **Response Includes**: `language`, `theme`, `terms_accepted`, `terms_accepted_at`

#### `PUT /api/user-preferences`
- **Description**: Update user preferences
- **Request Body**: Partial preferences (`language?`, `theme?`, `terms_accepted?`)
- **Response**: `200 OK` with updated preferences
- **Auth**: Required
- **Note**: At least one field must be provided

### Account Endpoints

#### `DELETE /api/account`
- **Description**: Delete user account and all associated data
- **Response**: `204 No Content`
- **Auth**: Required
- **Note**: Deletes meal plans, preserves ai_chat_sessions, deletes auth user

---

## Authentication & Authorization

### Authentication Flow

1. **Registration**: User fills registration form → Supabase `auth.signUp()` → Email confirmation (if enabled) → Auto-login or redirect to login
2. **Login**: User fills login form → Supabase `auth.signInWithPassword()` → Session created → Redirect to dashboard
3. **Password Reset**: User requests reset → Supabase `auth.resetPasswordForEmail()` → Email sent → User clicks link → Reset password form → Supabase `auth.updateUser()`

### Authorization

- **Middleware**: `src/middleware/index.ts` protects `/app/*` routes
- **Unauthenticated users**: Redirected to `/auth/login`
- **Authenticated users on auth pages**: Redirected to `/app/dashboard`
- **API Routes**: Use `getUserFromRequest()` from `src/lib/auth/session.service.ts`
- **401 Unauthorized**: Automatically redirects to `/auth/login`

### Session Management

- **Client-side**: Supabase client SDK manages session in cookies
- **Server-side**: Middleware extracts session from cookies
- **Session Verification**: `supabase.auth.getUser()` validates JWT token
- **Session Confirmation**: `useSessionConfirmation` hook waits for cookies to be set after registration

### Account Deletion

- **Endpoint**: `DELETE /api/account`
- **Process**: 
  1. Delete all user's meal plans
  2. Preserve ai_chat_sessions (telemetry)
  3. Delete auth user via Supabase Admin client
  4. Sign out user
  5. Redirect to home page

---

## Internationalization (i18n)

### Translation System

- **Provider**: `TranslationProvider` (React context)
- **Hook**: `useTranslation()` - Returns `{ t, language, setLanguage }`
- **Translation Files**: `src/lib/i18n/translations/en.json`, `pl.json`
- **Language Storage**: 
  - Database: `user_preferences.language` (for authenticated users)
  - localStorage: `app-language` (for unauthenticated users and cross-island sync)

### Language Switching

- **Authenticated Users**: Language preference saved to database via API
- **Unauthenticated Users**: Language stored in localStorage only (no API call on 401)
- **Language Selector**: `LanguageSelector` component (button group with EN/PL)
- **Available Languages**: English (en), Polish (pl)

### Translation Keys Structure

```typescript
// Translation keys are organized by feature:
- "auth.*" - Authentication related
- "common.*" - Common UI elements
- "nav.*" - Navigation
- "terms.*" - Terms and Privacy Policy
- "account.*" - Account management
- "time.*" - Time formatting
- "summary.*" - Meal plan summary
- "dialog.*" - Dialog messages
```

### Terms and Privacy Policy Content

- **Format**: JSON files (`public/terms-privacy-policy.en.json`, `pl.json`)
- **Structure**: 
  ```json
  {
    "terms": {
      "title": "Terms of Service",
      "sections": [
        {
          "id": "section-id",
          "heading": "Section Title",
          "content": "Markdown content"
        }
      ]
    },
    "privacy": {
      "title": "Privacy Policy",
      "sections": [...]
    }
  }
  ```
- **Loading**: `loadTermsContent(language)` function loads and validates JSON
- **Rendering**: `react-markdown` renders markdown content in sections

---

## Key Patterns & Conventions

### Component Patterns

#### React Components
- **Functional components** with hooks
- **Client-side interactivity** only (use `client:load` directive in Astro)
- **Custom hooks** for reusable logic (`src/components/hooks`)
- **Props interfaces** defined above component
- **Early returns** for error conditions
- **Memoization** for expensive calculations (`useMemo`, `useCallback`)

#### Astro Components
- **Static content** and layouts
- **Server-side rendering** for initial page load
- **Props** defined in frontmatter (`---`)
- **Slots** for content projection
- **Client directives** for React components (`client:load`, `client:visible`, etc.)

### State Management

- **Local state**: `useState` for component-specific state
- **Form state**: React Hook Form with Zod validation
- **Global state**: React Context (TranslationProvider, ThemeProvider)
- **No global state manager**: Redux, Zustand, etc. not used

### Error Handling

- **API Errors**: 
  - 401 Unauthorized → Redirect to `/auth/login`
  - 400 Bad Request → Display validation errors
  - 500 Internal Server Error → Display generic error message
- **Form Errors**: Inline validation errors via Zod
- **Network Errors**: Retry buttons or error messages
- **Custom Error Classes**: `DatabaseError`, `UnauthorizedError`, `ValidationError` in `src/lib/errors.ts`

### Validation

- **Client-side**: Zod schemas with React Hook Form
- **Server-side**: Zod schemas in API routes
- **Schema Files**: `src/lib/validation/*.schemas.ts`
- **Validation Timing**: `onBlur` for forms (immediate feedback)

### API Client Pattern

```typescript
// API client functions follow this pattern:
export const apiClient = {
  async getResource(): Promise<ResponseDto> {
    const headers = await getAuthHeaders();
    const response = await fetch("/api/resource", {
      method: "GET",
      headers,
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      throw new Error("Failed to fetch resource");
    }
    
    return handleApiResponse<ResponseDto>(response);
  },
};
```

### Service Layer Pattern

```typescript
// Services follow this pattern:
export async function serviceFunction(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<ReturnType> {
  const { data, error } = await supabase
    .from("table")
    .select("*")
    .eq("user_id", userId);
  
  if (error) {
    throw new DatabaseError({
      message: "Failed to fetch data",
      originalError: error,
    });
  }
  
  return data;
}
```

### Type Safety

- **Database Types**: `src/db/database.types.ts` (generated from Supabase)
- **Shared Types**: `src/types.ts` (DTOs, entities, interfaces)
- **Zod Schemas**: Runtime validation with TypeScript inference
- **Type Exports**: All types exported from `src/types.ts`

### Styling Conventions

- **Tailwind CSS**: Utility-first approach
- **Dark Mode**: `dark:` variant for dark mode styles
- **Responsive**: `sm:`, `md:`, `lg:` variants
- **Shadcn/ui**: Components use CSS variables for theming
- **Custom Styles**: `@layer` directive in `src/styles/global.css`

### File Naming Conventions

- **Components**: PascalCase (e.g., `MealPlanEditor.tsx`)
- **Utilities**: camelCase (e.g., `meal-plan-parser.ts`)
- **Services**: camelCase (e.g., `meal-plan.service.ts`)
- **Types**: camelCase (e.g., `types.ts`)
- **Pages**: kebab-case (e.g., `meal-plans.ts`)
- **API Routes**: kebab-case (e.g., `meal-plans.ts`)

---

## Testing Structure

### Unit Tests (`src/test/unit/`)

- **Framework**: Vitest
- **Components**: React Testing Library
- **Location**: `src/test/unit/components/`, `src/test/unit/lib/`
- **Pattern**: `*.test.tsx` or `*.test.ts`
- **Mocking**: MSW for API mocking

### Integration Tests (`src/test/integration/`)

- **Framework**: Vitest
- **API Testing**: Supertest for API endpoints
- **Location**: `src/test/integration/`
- **Pattern**: Test API endpoints with mocked database

### E2E Tests (`src/test/e2e/`)

- **Framework**: Playwright
- **Page Objects**: `src/test/e2e/pages/`
- **Test Files**: `*.spec.ts`
- **Utilities**: `src/test/e2e/utils/`
- **Pattern**: Test complete user flows

### Test Commands

```bash
npm run test          # Run all tests in watch mode
npm run test:unit     # Run unit tests
npm run test:integration  # Run integration tests
npm run test:e2e      # Run E2E tests
npm run test:coverage # Run tests with coverage
npm run test:all      # Run all test suites
```

---

## Deployment

### Environment Variables

**Required:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)
- `PUBLIC_SUPABASE_URL` - Supabase project URL (client-side)
- `PUBLIC_SUPABASE_KEY` - Supabase anon key (client-side)
- `PUBLIC_APP_URL` - Application URL (for auth redirects)
- `OPENROUTER_API_KEY` - OpenRouter API key

### Build Process

1. **Development**: `npm run dev` - Starts dev server on port 3000
2. **Build**: `npm run build` - Builds for production (Node adapter)
3. **Preview**: `npm run preview` - Serves production build locally

### Docker Deployment

- **Dockerfile**: Multi-stage build
- **Platform**: DigitalOcean
- **Adapter**: Node.js adapter (standalone mode)
- **Port**: Configured in Dockerfile

### CI/CD

- **GitHub Actions**: `.github/workflows/master.yml`
- **Tests**: Run unit, integration, and E2E tests
- **Build**: Build application
- **Deploy**: Deploy to DigitalOcean (if tests pass)

---

## Key Implementation Details

### Terms and Privacy Policy

- **Content Format**: JSON files in `public/` directory
- **Sections**: Structured with `id`, `heading`, and `content` (markdown)
- **Required Sections**: Defined in `src/lib/terms/terms.config.ts`
- **Checkboxes**: UX-only (not stored in database)
- **Storage**: Only `terms_accepted` (boolean) and `terms_accepted_at` (timestamp) stored
- **Modal**: `TermsAndPrivacyModal` component with two modes (registration, view)
- **Language**: Content loaded based on current language preference

### Language Switching

- **Translation Provider**: `TranslationProvider` manages language state
- **Language Selector**: `LanguageSelector` component (EN/PL buttons)
- **Storage Priority**: localStorage > API > default
- **Unauthenticated Users**: Language stored in localStorage only (no API call on 401)
- **Authenticated Users**: Language saved to database via API
- **Cross-island Sync**: localStorage events and custom events for same-tab sync
- **Edit Mode Initial Message**: Language preference read directly from localStorage to ensure correct language in edit mode initial message

### Plan Editing

- **Edit Mode**: Plans can be edited via `/app/edit/[id]` route
- **Initial Message**: Existing plan is loaded and displayed as initial assistant message in the chat
- **Save Options**: When saving edited plan, users can choose to:
  - **Overwrite existing plan** (default): Updates the existing plan with new name and content
  - **Create new plan**: Creates a new plan with the modified content, leaving the original unchanged
- **Checkbox UI**: "Create as new plan" checkbox appears in save modal when in edit mode
- **Day Plan Updates**: When updating day plans (e.g., changing from 4 days to 2), all existing day plans are deleted and new ones are created

### Theme Switching

- **Theme Provider**: `ThemeProvider` manages theme state
- **Theme Toggle**: `ThemeToggle` component (light/dark buttons)
- **Storage**: Database for authenticated users, localStorage for unauthenticated
- **CSS Variables**: Shadcn/ui components use CSS variables for theming
- **Dark Mode**: `dark:` Tailwind variant

### Meal Plan Data Structure

**Single-Day Plan:**
```typescript
interface MealPlanContent {
  daily_summary: {
    kcal: number;
    proteins: number;
    fats: number;
    carbs: number;
  };
  meals: Array<{
    name: string;
    ingredients: string;
    preparation: string;
    summary: {
      kcal: number;
      p: number;
      f: number;
      c: number;
    };
  }>;
}
```

**Multi-Day Plan:**
```typescript
interface MultiDayPlanContent {
  multi_day_plan: {
    days: Array<{
      day_number: number;
      name?: string;
      meal_plan: {
        daily_summary: {
          kcal: number;
          proteins: number;
          fats: number;
          carbs: number;
        };
        meals: Array<{
          name: string;
          ingredients: string;
          preparation: string;
          summary: {
            kcal: number;
            protein: number;
            fat: number;
            carb: number;
          };
        }>;
      };
    }>;
    summary: {
      number_of_days: number;
      average_kcal: number;
      average_proteins: number;
      average_fats: number;
      average_carbs: number;
    };
  };
  comments?: string; // Optional AI comments
}
```

### AI Chat Flow

**Create Mode:**
1. User fills startup form → `POST /api/ai/sessions`
2. API creates session, calls OpenRouter API
3. First AI message returned → Navigate to `/app/create`
4. User sends follow-up messages → `POST /api/ai/sessions/[id]/message`
5. User accepts plan → Modal opens for plan name → Save directly → Navigate to `/app/view/[id]`

**Edit Mode:**
1. User clicks edit on existing plan → Navigate to `/app/edit/[id]`
2. Existing plan loaded and displayed in chat as initial assistant message
3. User sends modification requests → `POST /api/ai/sessions/[id]/message`
4. User accepts changes → Modal opens with plan name and "Create as new plan" checkbox
5. User saves → Either updates existing plan or creates new one → Navigate to `/app/view/[id]`

### Export Flow

**Single-Day Plans:**
1. User clicks "Export" → `GET /api/meal-plans/[id]/export`
2. API generates .doc file using `docx` library
3. File downloaded via `Content-Disposition: attachment` header
4. Browser downloads file automatically

**Multi-Day Plans:**
1. User clicks "Export" from view page → `GET /api/multi-day-plans/[id]/export?format=doc&...`
2. API generates .doc or HTML file with all days using `docx` library
3. File downloaded via `Content-Disposition: attachment` header
4. Browser downloads file automatically
5. Export options modal allows customization of content sections (daily summary, meals summary, ingredients, preparation)

### Error Handling Patterns

```typescript
// API Route Error Handling
try {
  // Business logic
} catch (error) {
  if (error instanceof UnauthorizedError) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  if (error instanceof ValidationError) {
    return new Response(JSON.stringify({ error: "Validation failed" }), {
      status: 400,
    });
  }
  if (error instanceof DatabaseError) {
    console.error("Database error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
    });
  }
  // Unexpected error
  console.error("Unexpected error:", error);
  return new Response(JSON.stringify({ error: "Internal error" }), {
    status: 500,
  });
}
```

### Authentication Patterns

```typescript
// Server-side (API routes)
const user = await getUserFromRequest(context);
// Returns user or throws UnauthorizedError

// Client-side (React components)
const token = await getAuthToken();
// Returns JWT token or null

// Supabase Auth
await supabase.auth.signUp({ email, password });
await supabase.auth.signInWithPassword({ email, password });
await supabase.auth.signOut();
```

---

## Important Notes

### Code Formatting

- **ESLint**: Configured with TypeScript, React, Astro, Prettier plugins
- **Prettier**: Auto-formatting on save
- **Line Endings**: LF (Unix) for all files
- **Lint Command**: `npm run lint` (with `--fix` for auto-fix)

### Type Safety

- **Strict TypeScript**: Enabled in `tsconfig.json`
- **Zod Validation**: Runtime validation with TypeScript inference
- **Database Types**: Generated from Supabase schema
- **Type Exports**: Centralized in `src/types.ts`

### Security

- **Row Level Security**: Enabled on all tables
- **API Authentication**: JWT tokens in Authorization header
- **Password Requirements**: Minimum 8 characters, letters and numbers
- **Service Role Key**: Only used server-side for admin operations
- **Environment Variables**: Never expose service role key to client

### Performance

- **Code Splitting**: React components loaded with `client:load` directive
- **Lazy Loading**: React.lazy() for code splitting
- **Memoization**: useMemo, useCallback for expensive operations
- **Debouncing**: Search input debounced (useDebounce hook)
- **Image Optimization**: Astro Image integration (when used)

### Accessibility

- **ARIA Attributes**: Proper labels, describedby, invalid attributes
- **Keyboard Navigation**: All interactive elements keyboard accessible
- **Screen Readers**: Semantic HTML and ARIA landmarks
- **Focus Management**: Proper focus handling in modals and dialogs

### Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **No IE Support**: Internet Explorer not supported
- **Progressive Enhancement**: Core functionality works without JavaScript

---

## Quick Reference

### Common Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run lint             # Lint codebase
npm run lint:fix         # Lint and auto-fix
npm run test             # Run tests
npm run test:e2e         # Run E2E tests
```

### Key Files

- **Project Config**: `astro.config.mjs`, `package.json`, `tsconfig.json`
- **Database Types**: `src/db/database.types.ts`
- **Shared Types**: `src/types.ts`
- **Middleware**: `src/middleware/index.ts`
- **Translation Provider**: `src/lib/i18n/TranslationProvider.tsx`
- **Theme Provider**: `src/lib/theme/ThemeProvider.tsx`

### Key Components

- **Auth Forms**: `src/components/auth/*.tsx`
- **Dashboard**: `src/components/DashboardView.tsx` (displays multi-day plans)
- **AI Chat**: `src/components/AIChatInterface.tsx` (supports both create and edit modes for single-day and multi-day plans)
- **Multi-Day Plan View**: `src/components/MultiDayPlanView.tsx` (read-only view with all days)
- **Multi-Day Plan Display**: `src/components/MultiDayMealPlanDisplay.tsx` (display in AI chat interface)
- **Day Plan Components**: 
  - `src/components/DayPlanView.tsx` (individual day display)
  - `src/components/DayPlanCard.tsx` (day card for chat interface)
  - `src/components/DaysList.tsx` (scrollable list of days)
  - `src/components/PlanSummary.tsx` (plan summary with averages)
- **Export**: `src/components/ExportButton.tsx`, `src/components/ExportOptionsModal.tsx`
- **Edit**: `src/components/EditButton.tsx` (navigation to edit mode)
- **Terms Modal**: `src/components/terms/TermsAndPrivacyModal.tsx`
- **Account Profile**: `src/components/account/AccountProfile.tsx`

### Key Services

- **Meal Plans**: `src/lib/meal-plans/meal-plan.service.ts`
- **Multi-Day Plans**: `src/lib/multi-day-plans/multi-day-plan.service.ts` (CRUD operations, summary calculation)
- **AI Chat**: `src/lib/ai/openrouter.service.ts`, `session.service.ts`
- **User Preferences**: `src/lib/user-preferences/user-preference.service.ts`
- **Account**: `src/lib/account/account.service.ts`
- **Export**: `src/lib/meal-plans/doc-generator.service.ts` (includes `generateMultiDayDoc` function)

### API Endpoints

- **Meal Plans**: `/api/meal-plans`, `/api/meal-plans/[id]`, `/api/meal-plans/[id]/export`
- **Multi-Day Plans**: 
  - `/api/multi-day-plans` (GET list, POST create)
  - `/api/multi-day-plans/[id]` (GET, PUT, DELETE)
  - `/api/multi-day-plans/[id]/export` (GET with format and content options)
- **AI Chat**: `/api/ai/sessions`, `/api/ai/sessions/[id]/message` (supports both single-day and multi-day plans)
- **User Preferences**: `/api/user-preferences`
- **Account**: `/api/account` (DELETE)

### Database Tables

- **meal_plans**: User meal plans (can be standalone or part of multi-day plans via `is_day_plan` flag)
- **multi_day_plans**: User multi-day meal plans with summary statistics (automatically calculated)
- **multi_day_plan_days**: Junction table linking multi-day plans to day plans with day ordering
- **ai_chat_sessions**: AI conversation history (telemetry)
- **user_preferences**: User preferences (language, theme, terms acceptance)

---

## Migration History

### Key Migrations

1. **20250109221435_add_user_preferences.sql** - Created user_preferences table
2. **20251110090541_add_theme_to_user_preferences.sql** - Added theme column
3. **20250125200000_add_terms_acceptance_to_preferences.sql** - Added terms_accepted and terms_accepted_at columns
4. **20250123192000_create_diet_planner_schema.sql** - Created meal_plans and ai_chat_sessions tables
5. **20250124120000_production_security_fixes.sql** - Security fixes for triggers and functions
6. **20251115203543_create_multi_day_plans_schema.sql** - Created multi_day_plans and multi_day_plan_days tables, added is_day_plan column to meal_plans, created triggers and functions for automatic summary calculation
7. **20251115205411_fix_recalculate_multi_day_plan_summary.sql** - Fixed summary recalculation function
8. **20251115211342_fix_recalculate_trigger_constraint.sql** - Fixed trigger constraint issues

### Running Migrations

```bash
# Local development (Supabase CLI)
supabase migration up

# Or apply manually to database
psql -f supabase/migrations/YYYYMMDDHHmmss_migration_name.sql
```

---

## Future Enhancements

### Planned Features

- Change password functionality
- Email notifications for terms updates
- Terms version tracking
- Recipe database integration
- Mobile application
- Automatic nutrition recalculation

### Technical Debt

- Consider adding rate limiting for API endpoints
- Consider adding request logging
- Consider adding analytics
- Consider adding error tracking (Sentry, etc.)
- Consider adding performance monitoring

---

## Getting Started for New Agents

1. **Read this summary** - Understand project structure and patterns
2. **Review PRD** - Understand product requirements (`.ai/prd.md`)
3. **Review UI Plan** - Understand UI architecture (`.ai/ui-plan.md`)
4. **Review relevant implementation plans** - For specific features
5. **Check cursor rules** - Understand coding conventions
6. **Review existing code** - Understand patterns and structure
7. **Test locally** - Run `npm run dev` and test features
8. **Run tests** - Ensure all tests pass (`npm run test:all`)

---

## Additional Resources

### Documentation Files

- `.ai/prd.md` - Product Requirements Document
- `.ai/ui-plan.md` - UI Architecture Plan
- `.ai/auth-spec.md` - Authentication Specification
- `.ai/db-plan.md` - Database Schema Plan
- `.ai/terms-privacy-policy-implementation-plan.md` - Terms Implementation
- `.ai/meal-plans-implementation-plan.md` - Meal Plans Implementation
- `.ai/dashboard-view-implementation-plan.md` - Dashboard Implementation
- `.ai/chat-view-implementation-plan.md` - AI Chat Implementation
- `.ai/export-implementation-plan.md` - Export Implementation
- `.ai/language-implementation-plan.md` - Language Implementation
- `.ai/dark-mode-implementation-plan.md` - Dark Mode Implementation
- `.ai/account-removal-plan.md` - Account Removal Implementation

### Rule Files

- `.cursor/rules/shared.mdc` - Shared rules (always applied)
- `.cursor/rules/frontend.mdc` - Frontend guidelines
- `.cursor/rules/backend.mdc` - Backend guidelines
- `.cursor/rules/react.mdc` - React guidelines
- `.cursor/rules/astro.mdc` - Astro guidelines
- `.cursor/rules/db-supabase-migrations.mdc` - Database migration guidelines
- `.cursor/rules/ui-shadcn-helper.mdc` - Shadcn/ui guidelines
- `.cursor/rules/api-supabase-astro-init.mdc` - Supabase integration
- `.cursor/rules/vitest-unit-testing.mdc` - Unit testing guidelines
- `.cursor/rules/playwright-e2e-itesting.mdc` - E2E testing guidelines
- `.cursor/rules/docker.mdc` - Docker guidelines
- `.cursor/rules/github-action.mdc` - GitHub Actions guidelines

---

**Last Updated**: 2025-01-26
**Version**: MVP
**Status**: In Development

