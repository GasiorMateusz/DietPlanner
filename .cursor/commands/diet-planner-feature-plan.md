# Diet Planner Feature Implementation Plan Generator

Your task is to create a comprehensive implementation plan for a new feature in the Diet Planner application. This plan should follow the same structure and level of detail as the existing implementation plans (e.g., `register-view-implementation-plan.md`).

## Project Context

### About Diet Planner

Diet Planner is a Minimum Viable Product (MVP) web application designed to streamline the work of dietitians by automating and accelerating the creation of personalized, 1-day meal plans using AI. The application integrates with AI language models (via OpenRouter) to generate initial meal plans based on detailed guidelines entered by dietitians.

**Core Workflow:**
1. Dietitian fills out a structured form with patient parameters, caloric goals, macronutrients, and exclusions
2. AI generates a 1-day meal plan in a conversational interface, allowing for iterative corrections
3. After acceptance, the plan is transferred to a text editor for final manual modifications, saving, and exporting to a .doc file

The application is intended exclusively for professional dietitians and requires account creation for storing and managing created meal plans.

### Tech Stack

**Frontend:**
- **Astro 5** - Fast, performant static site generation with minimal JavaScript
- **React 19** - Interactive components (e.g., chat, editor)
- **React Hook Form** - Efficient form state management and validation
- **TypeScript 5** - Static type checking
- **Tailwind 4** - Utility-first CSS styling
- **Shadcn/ui** - Base library of accessible React components

**Backend:**
- **Supabase** - Comprehensive BaaS (Backend-as-a-Service) solution providing:
  - PostgreSQL Database
  - User Authentication
  - SDKs for backend operations

**AI:**
- **Openrouter.ai** - Access to a wide range of AI models (OpenAI, Anthropic, Google, etc.) to power meal plan generation

**Testing:**
- **Vitest** - Primary test runner for unit and integration tests
- **React Testing Library** - Component testing utilities
- **MSW (Mock Service Worker)** - API mocking for unit tests
- **Playwright** - Cross-browser end-to-end (E2E) testing framework

### Project Structure

When creating implementation plans, always follow this directory structure:

- `./src` - source code
- `./src/layouts` - Astro layouts
- `./src/pages` - Astro pages
- `./src/pages/api` - API endpoints
- `./src/middleware/index.ts` - Astro middleware
- `./src/db` - Supabase clients and types
- `./src/types.ts` - Shared types for backend and frontend (Entities, DTOs)
- `./src/components` - Client-side components written in Astro (static) and React (dynamic)
- `./src/components/ui` - Client-side components from Shadcn/ui
- `./src/lib` - Services and helpers
- `./src/assets` - static internal assets
- `./public` - public assets

### UI Architecture Principles

The UI architecture is built on a "hybrid" model using Astro for static layouts and React for dynamic, interactive "islands":

- **Public Layout (Astro)**: Manages all public-facing authentication pages. Minimal layout with no persistent navigation.
- **Private Layout (Astro)**: Secure container for the main application, accessible only to authenticated users. Includes main navigation (header with logo, "My Account" access).

**State Management:**
- State is localized. React components manage their own state using `useState`. There is no global state manager.
- Simple client-side variables can be used to bridge state transfer between components when needed.

**Error Handling:**
- A 401 Unauthorized response from any API triggers a redirect to `/auth/login`
- Non-blocking errors (like 502 from AI) are handled with toasts or inline messages
- Validation errors are displayed inline via Zod

### Coding Practices

- Use feedback from linters to improve the code when making changes
- Prioritize error handling and edge cases
- Handle errors and edge cases at the beginning of functions
- Use early returns for error conditions to avoid deeply nested if statements
- Place the happy path last in the function for improved readability
- Avoid unnecessary else statements; use if-return pattern instead
- Use guard clauses to handle preconditions and invalid states early
- Implement proper error logging and user-friendly error messages
- Consider using custom error types or error factories for consistent error handling

### Frontend Guidelines

- Use Astro components (.astro) for static content and layout
- Implement framework components in React only when interactivity is needed
- Use Tailwind 4 for styling with proper layer organization
- Implement dark mode with the `dark:` variant
- Follow ARIA best practices for accessibility

### Type Definitions

All shared types, DTOs, and command models are defined in `src/types.ts`. When creating implementation plans, reference these types:

- **Meal Plan Types**: `TypedMealPlanRow`, `TypedMealPlanInsert`, `TypedMealPlanUpdate`, `MealPlanContent`, `MealPlanStartupData`
- **AI Chat Types**: `TypedAiChatSessionRow`, `ChatMessage`, `UserChatMessage`, `AssistantChatMessage`
- **API DTOs**: `MealPlanListItemDto`, `GetMealPlansResponseDto`, `CreateMealPlanCommand`, `CreateMealPlanResponseDto`, `GetMealPlanByIdResponseDto`, `UpdateMealPlanCommand`, `UpdateMealPlanResponseDto`
- **AI Session DTOs**: `CreateAiSessionCommand`, `CreateAiSessionResponseDto`, `SendAiMessageCommand`, `SendAiMessageResponseDto`

Always use these types when defining API contracts, component props, and data structures in your implementation plan.

### API Architecture

The application uses REST API endpoints defined in `src/pages/api`. Key principles:

- **Authentication**: All API requests (except Supabase's built-in auth endpoints) must include a valid `Authorization: Bearer <SUPABASE_JWT>` header
- **Authorization**: Implemented at the database level using PostgreSQL Row-Level Security (RLS)
- **Validation**: Input validation performed by the API for all POST/PUT requests before hitting the database
- **Error Codes**: 
  - `400 Bad Request`: Validation failed
  - `401 Unauthorized`: User is not authenticated
  - `404 Not Found`: Resource not found
  - `500 Internal Server Error`: Server error
  - `502 Bad Gateway`: Error communicating with external services (e.g., OpenRouter)

### Authentication

The application uses Supabase Auth for authentication:

- Registration/Login/Password Reset: Handled by Supabase client SDK (BaaS approach)
- Session Management: JWT tokens stored and sent via `Authorization` header
- Account Management: Change password and delete account functionality available

## Implementation Plan Template

When creating an implementation plan, structure it as follows:

### 1. Overview

Provide a high-level description of the feature:
- What is the feature?
- Which user story or requirement does it address?
- What is the main purpose and functionality?
- How does it fit into the overall application workflow?

### 2. View Routing (if applicable)

If the feature involves a new page or view:
- **Path**: The URL path (e.g., `/app/settings`)
- **Layout**: Which layout is used (Public Layout or Private Layout)
- **Access Control**: Authentication requirements and redirects
- **Navigation**: How users access this view

### 3. Component Structure

Create a hierarchical tree showing all components:
```
Page/View (Astro or React)
└── Component (React)
    ├── Sub-component
    └── UI Primitive (shadcn/ui)
```

### 4. Component Details

For each component, provide:
- **Component description**: What the component does and its responsibilities
- **Main elements**: List of all UI elements (form fields, buttons, alerts, etc.)
- **Handled interactions**: All user interactions and their outcomes
- **Handled validation**: Client-side validation rules and triggers
- **Types**: TypeScript types used (reference `src/types.ts` or define new ones)
- **Props**: Component props interface

### 5. Types

Document all TypeScript types used:
- Form input types
- Component prop types
- API request/response types (reference `src/types.ts` DTOs)
- State types
- Include field details for each type

### 6. State Management

Describe how state is managed:
- Local component state (React `useState`)
- Form state (React Hook Form)
- Custom hooks (if any)
- State flow and lifecycle
- No global state manager (keep state localized)

### 7. API Integration

If the feature requires API endpoints:
- List all API endpoints used
- Request/response payloads (reference DTOs from `src/types.ts`)
- Success and error codes
- Authentication requirements
- Client configuration (how to call the API)

### 8. User Interactions

Document all user interactions:
- For each interaction, describe:
  - **Interaction**: What the user does
  - **Expected Outcome**: What should happen
  - **Implementation**: How it's implemented

### 9. Conditions and Validation

Document all validation rules and conditions:
- Client-side validation (Zod schemas)
- Server-side validation
- Form submission conditions
- Access control conditions
- Business logic conditions

### 10. Error Handling

Document error handling for:
- Validation errors
- API errors
- Network errors
- Edge cases
- User-friendly error messages
- Error display priority

### 11. Implementation Steps

Provide a step-by-step implementation guide:
1. Create validation schemas (if needed)
2. Create React components
3. Create Astro pages (if needed)
4. Create API endpoints (if needed)
5. Test client-side validation
6. Test user flows
7. Test error handling
8. Test accessibility
9. Test responsive design
10. Integration testing

## Feature Description

{{feature-description}}

Replace `{{feature-description}}` with a concise description of the feature you want to implement. For example:

- "Add option to select application language between Polish and English. This should also take into account the language of the AI conversation."
- "Add option to select dark and bright mode of the application."
- "Add more features related to AI initial conversation."

## Instructions

Based on the feature description above, create a comprehensive implementation plan following the template structure. Ensure that:

1. **All sections are completed** with appropriate detail
2. **Types are properly referenced** from `src/types.ts` or new types are defined
3. **Component structure is clear** with proper hierarchy
4. **API integration** follows the existing patterns (if applicable)
5. **Error handling** is comprehensive
6. **Validation** is properly documented
7. **User interactions** are thoroughly described
8. **Implementation steps** are actionable and sequential

Consider:
- How the feature integrates with existing functionality
- Whether new API endpoints are needed
- Whether database schema changes are required
- How the feature affects existing components
- Accessibility requirements
- Responsive design considerations
- Testing requirements

Use the existing implementation plans (e.g., `register-view-implementation-plan.md`) as reference for the level of detail and structure expected.

