# Code Review Checklist for Diet Planner MVP

This checklist should be used when reviewing code changes to ensure compliance with project standards, tech stack requirements, and best practices.

## Tech Stack Compliance

### Core Technologies
- [ ] **Astro 5** - Used for static content and layouts, not React
- [ ] **TypeScript 5** - All code is properly typed, no `any` types without justification
- [ ] **React 19** - Used only for interactive components, not static content
- [ ] **Tailwind 4** - Styling uses Tailwind utilities, not custom CSS unless necessary
- [ ] **Shadcn/ui** - UI components come from Shadcn/ui library (New York style, neutral color)
- [ ] **Zod** - All API inputs validated with Zod schemas
- [ ] **React Hook Form** - Forms use React Hook Form for state management

### Version Compatibility
- [ ] No deprecated APIs or patterns are used
- [ ] All dependencies are compatible with the tech stack versions
- [ ] Node.js version matches `.nvmrc` (22.14.0)

## Project Structure

### Directory Structure
- [ ] Files are placed in correct directories according to project structure:
  - `src/layouts/` - Astro layouts
  - `src/pages/` - Astro pages
  - `src/pages/api/` - API endpoints
  - `src/components/` - React and Astro components
  - `src/components/ui/` - Shadcn/ui components
  - `src/components/hooks/` - Custom React hooks
  - `src/lib/` - Services and utilities
  - `src/db/` - Supabase clients and types
  - `src/types.ts` - Shared types (DTOs, entities)
  - `src/middleware/` - Astro middleware

### File Naming Conventions
- [ ] Components: PascalCase (e.g., `MealPlanEditor.tsx`)
- [ ] Utilities: camelCase (e.g., `meal-plan-parser.ts`)
- [ ] Services: camelCase (e.g., `meal-plan.service.ts`)
- [ ] Pages: kebab-case (e.g., `meal-plans.ts`)
- [ ] API Routes: kebab-case (e.g., `meal-plans.ts`)
- [ ] Migration files: `YYYYMMDDHHmmss_short_description.sql`

## Coding Practices

### Clean Code Principles
- [ ] **Early returns** - Error conditions handled at the beginning of functions
- [ ] **Guard clauses** - Preconditions and invalid states handled early
- [ ] **No unnecessary else** - Uses if-return pattern instead
- [ ] **Happy path last** - Main logic appears at the end of functions
- [ ] **Error handling** - All errors handled with appropriate error types
- [ ] **Error logging** - Errors logged with proper context
- [ ] **User-friendly messages** - Error messages are user-friendly and actionable

### Code Quality
- [ ] **Linter compliance** - Code passes ESLint checks
- [ ] **Type safety** - No TypeScript errors, proper type annotations
- [ ] **No console.log** - Debugging statements removed (use proper logging)
- [ ] **Comments** - Complex logic is commented appropriately
- [ ] **DRY principle** - No code duplication without justification

## Frontend Guidelines

### Astro Components
- [ ] Used for static content and layouts only
- [ ] Server-side rendering where appropriate
- [ ] Props defined in frontmatter (`---`)
- [ ] Slots used for content projection
- [ ] Client directives (`client:load`, `client:visible`) used appropriately for React components
- [ ] View Transitions API used for smooth page transitions
- [ ] `export const prerender = false` for API routes
- [ ] Environment variables accessed via `import.meta.env`

### React Components
- [ ] **Functional components** - No class components
- [ ] **No Next.js directives** - Never uses `"use client"` (Next.js specific)
- [ ] **Custom hooks** - Complex logic extracted to hooks in `src/components/hooks/`
- [ ] **Performance optimization**:
  - [ ] `React.memo()` for expensive components with same props
  - [ ] `useCallback()` for event handlers passed to children
  - [ ] `useMemo()` for expensive calculations
  - [ ] `useId()` for accessibility attributes
- [ ] **Code splitting** - `React.lazy()` and `Suspense` used where appropriate
- [ ] **Props interfaces** - Defined above component

### Styling (Tailwind)
- [ ] **@layer directive** - Custom styles organized into layers
- [ ] **Arbitrary values** - Used with square brackets (e.g., `w-[123px]`)
- [ ] **Dark mode** - Uses `dark:` variant for dark mode styles
- [ ] **Responsive** - Uses responsive variants (`sm:`, `md:`, `lg:`)
- [ ] **State variants** - Uses interactive variants (`hover:`, `focus-visible:`, `active:`)
- [ ] **No inline styles** - Tailwind utilities used instead (unless dynamic values)
- [ ] **CSS variables** - Shadcn/ui components use CSS variables for theming

### Accessibility (ARIA)
- [ ] **ARIA landmarks** - Used to identify page regions (main, navigation, search)
- [ ] **ARIA roles** - Applied to custom elements without semantic HTML
- [ ] **ARIA states** - `aria-expanded`, `aria-controls` for expandable content
- [ ] **ARIA live regions** - Used for dynamic content updates with appropriate politeness
- [ ] **ARIA labels** - `aria-label` or `aria-labelledby` for elements without visible text
- [ ] **ARIA descriptions** - `aria-describedby` for form inputs and complex elements
- [ ] **ARIA current** - Used for indicating current item in sets/navigation
- [ ] **No redundant ARIA** - Doesn't duplicate native HTML semantics
- [ ] **Keyboard navigation** - All interactive elements keyboard accessible
- [ ] **Focus management** - Proper focus handling in modals and dialogs

### Forms
- [ ] **React Hook Form** - Used for form state management
- [ ] **Zod validation** - Schemas defined in `src/lib/validation/*.schemas.ts`
- [ ] **Validation timing** - `onBlur` for immediate feedback
- [ ] **Error display** - Inline validation errors shown to users
- [ ] **Accessibility** - Form inputs have proper labels and error associations

## Backend Guidelines

### Supabase Integration
- [ ] **Context locals** - Uses `context.locals.supabase` in Astro routes
- [ ] **Client types** - Uses `SupabaseClient` from `src/db/supabase.client.ts`, not `@supabase/supabase-js`
- [ ] **Server client** - Uses `supabase.server.ts` for server-side operations
- [ ] **Admin client** - Uses `supabase.admin.ts` only for admin operations (account deletion)

### API Routes (Astro Server Endpoints)
- [ ] **Uppercase methods** - Uses `POST`, `GET` (uppercase) for endpoint handlers
- [ ] **Prerender disabled** - `export const prerender = false` for API routes
- [ ] **Zod validation** - All inputs validated with Zod schemas
- [ ] **Authentication** - Uses `getUserFromRequest()` from `src/lib/auth/session.service.ts`
- [ ] **Error handling** - Proper error responses (401, 400, 500)
- [ ] **Response types** - Proper Content-Type headers set
- [ ] **Service layer** - Business logic extracted to services in `src/lib/`

### API Client Pattern
- [ ] **Auth headers** - Uses `getAuthHeaders()` from `src/lib/api/base.client.ts`
- [ ] **Error handling** - Handles 401 (redirects to login), 400, 500 errors
- [ ] **Response parsing** - Uses `handleApiResponse<T>()` for type-safe responses
- [ ] **Type safety** - Response types match DTOs from `src/types.ts`

### Service Layer
- [ ] **Service functions** - Business logic in services, not in API routes
- [ ] **Error types** - Uses custom error classes (`DatabaseError`, `UnauthorizedError`, `ValidationError`)
- [ ] **Database operations** - Uses Supabase client with proper error handling
- [ ] **Type safety** - Functions properly typed with TypeScript

## Database Guidelines

### Migrations
- [ ] **Naming convention** - `YYYYMMDDHHmmss_short_description.sql` format
- [ ] **Header comments** - Includes metadata (purpose, affected tables, considerations)
- [ ] **SQL style** - All SQL written in lowercase
- [ ] **Comments** - Thorough comments explaining each migration step
- [ ] **Destructive operations** - Copious comments for DROP, TRUNCATE, ALTER operations

### Row Level Security (RLS)
- [ ] **RLS enabled** - All tables have RLS enabled (even for public access)
- [ ] **Granular policies** - One policy per operation (SELECT, INSERT, UPDATE, DELETE)
- [ ] **Role-based policies** - Separate policies for `anon` and `authenticated` roles
- [ ] **Policy comments** - Comments explain rationale and intended behavior
- [ ] **User isolation** - Users can only access their own data (where applicable)

### Database Operations
- [ ] **Indexes** - Appropriate indexes created for search and filtering
- [ ] **Triggers** - Triggers properly defined for `updated_at` timestamps
- [ ] **Functions** - Database functions are secure and well-documented
- [ ] **Foreign keys** - Proper foreign key constraints defined
- [ ] **Data types** - Appropriate data types used (uuid, timestamptz, jsonb, etc.)

## Type Safety

### TypeScript
- [ ] **Strict mode** - Code complies with strict TypeScript settings
- [ ] **No any types** - No `any` types without justification
- [ ] **Type exports** - Types exported from `src/types.ts` (shared types)
- [ ] **Database types** - Uses types from `src/db/database.types.ts` (generated from Supabase)
- [ ] **Zod inference** - Uses Zod schema inference for runtime validation with TypeScript types

### Type Definitions
- [ ] **DTOs** - Data Transfer Objects defined in `src/types.ts`
- [ ] **Entities** - Entity types match database schema
- [ ] **Interfaces** - Proper interfaces for component props and function parameters
- [ ] **Type guards** - Type guards used where appropriate for runtime type checking

## Error Handling

### Error Types
- [ ] **Custom errors** - Uses custom error classes from `src/lib/errors.ts`:
  - `DatabaseError` - Database operation failures
  - `UnauthorizedError` - Authentication/authorization failures
  - `ValidationError` - Input validation failures
- [ ] **Error context** - Errors include proper context and original error information

### Error Responses
- [ ] **401 Unauthorized** - Redirects to `/auth/login` (client-side) or returns 401 (API)
- [ ] **400 Bad Request** - Returns validation errors with details
- [ ] **500 Internal Server Error** - Returns generic error message (doesn't leak implementation details)
- [ ] **Error logging** - Server errors logged with proper context
- [ ] **User messages** - Error messages are user-friendly and actionable

## Security

### Authentication & Authorization
- [ ] **Middleware protection** - Protected routes use middleware (`src/middleware/index.ts`)
- [ ] **API authentication** - API routes verify user authentication
- [ ] **User isolation** - Users can only access their own data (RLS policies)
- [ ] **JWT tokens** - Authentication uses JWT tokens in Authorization header
- [ ] **Password requirements** - Password validation (minimum 8 characters, letters and numbers)

### Data Security
- [ ] **Service role key** - Service role key only used server-side, never exposed to client
- [ ] **Environment variables** - Sensitive data in environment variables, not hardcoded
- [ ] **Input validation** - All user inputs validated (client and server-side)
- [ ] **SQL injection** - Uses parameterized queries (Supabase handles this)
- [ ] **XSS prevention** - User-generated content properly sanitized

### API Security
- [ ] **CORS** - CORS properly configured (if needed)
- [ ] **Rate limiting** - Consider rate limiting for API endpoints (future enhancement)
- [ ] **Request validation** - All API requests validated with Zod schemas

## Testing

### Unit Tests
- [ ] **Test coverage** - New code has unit tests (Vitest)
- [ ] **Test location** - Tests in `src/test/unit/` directory
- [ ] **Test naming** - Test files follow `*.test.tsx` or `*.test.ts` pattern
- [ ] **React Testing Library** - Component tests use React Testing Library
- [ ] **MSW mocking** - API calls mocked with MSW (Mock Service Worker)

### Integration Tests
- [ ] **API tests** - API endpoints have integration tests (Supertest)
- [ ] **Test location** - Tests in `src/test/integration/` directory
- [ ] **Database mocking** - Database operations properly mocked

### E2E Tests
- [ ] **Playwright tests** - Critical user flows have E2E tests
- [ ] **Test location** - Tests in `src/test/e2e/` directory
- [ ] **Page objects** - Uses page object model pattern
- [ ] **Test naming** - Test files follow `*.spec.ts` pattern

## Internationalization (i18n)

### Translation System
- [ ] **Translation provider** - Uses `TranslationProvider` for language management
- [ ] **Translation hook** - Uses `useTranslation()` hook for translations
- [ ] **Translation files** - Translations in `src/lib/i18n/translations/en.json` and `pl.json`
- [ ] **Translation keys** - Keys organized by feature (auth.*, common.*, nav.*, etc.)
- [ ] **Language storage** - Language preference stored in database (authenticated) or localStorage (unauthenticated)

### Language Support
- [ ] **Language selector** - Language can be switched (EN/PL)
- [ ] **Default language** - Default language is English (en)
- [ ] **Language persistence** - Language preference persists across sessions
- [ ] **Terms content** - Terms and Privacy Policy content loaded based on current language

## Theme Management

### Theme System
- [ ] **Theme provider** - Uses `ThemeProvider` for theme management
- [ ] **Theme hook** - Uses `useTheme()` hook for theme access
- [ ] **Theme storage** - Theme preference stored in database (authenticated) or localStorage (unauthenticated)
- [ ] **Theme toggle** - Theme can be switched (light/dark)
- [ ] **CSS variables** - Shadcn/ui components use CSS variables for theming
- [ ] **Dark mode styles** - Dark mode styles use `dark:` Tailwind variant

## Performance

### Optimization
- [ ] **Code splitting** - React components loaded with `client:load` directive
- [ ] **Lazy loading** - `React.lazy()` used for code splitting where appropriate
- [ ] **Memoization** - `useMemo`, `useCallback` used for expensive operations
- [ ] **Debouncing** - Search inputs debounced (use `useDebounce` hook)
- [ ] **Image optimization** - Images optimized (Astro Image integration when used)

### Bundle Size
- [ ] **No unnecessary imports** - Only necessary imports included
- [ ] **Tree shaking** - Code is tree-shakeable
- [ ] **Bundle analysis** - Consider bundle size impact for large dependencies

## Documentation

### Code Documentation
- [ ] **Function comments** - Complex functions have JSDoc comments
- [ ] **Type comments** - Complex types have comments explaining purpose
- [ ] **README updates** - README updated if project structure changes
- [ ] **Migration comments** - Database migrations have thorough comments

### Implementation Plans
- [ ] **Documentation files** - New features have implementation plans in `.ai/` directory (if applicable)
- [ ] **PRD updates** - Product Requirements Document updated if scope changes

## Specific Feature Compliance

### Meal Plans
- [ ] **Data structure** - Meal plan data matches `MealPlanContent` interface
- [ ] **API endpoints** - Uses correct API endpoints (`/api/meal-plans`)
- [ ] **Export functionality** - Export generates .doc file correctly
- [ ] **Editor functionality** - Editor supports create and edit modes

### AI Chat
- [ ] **Session management** - AI chat sessions properly created and managed
- [ ] **Message history** - Message history stored in database
- [ ] **OpenRouter integration** - OpenRouter API calls properly handled
- [ ] **Error handling** - AI API errors properly handled and displayed

### Authentication
- [ ] **Supabase Auth** - Uses Supabase Auth SDK for authentication
- [ ] **Session management** - Session properly managed (cookies, JWT tokens)
- [ ] **Password reset** - Password reset flow works correctly
- [ ] **Account deletion** - Account deletion properly cleans up data

### User Preferences
- [ ] **Language preference** - Language preference stored and retrieved correctly
- [ ] **Theme preference** - Theme preference stored and retrieved correctly
- [ ] **Terms acceptance** - Terms acceptance stored with timestamp

## Checklist Summary

### Critical (Must Fix)
- [ ] Security vulnerabilities
- [ ] TypeScript errors
- [ ] Authentication/authorization issues
- [ ] Database RLS policy issues
- [ ] Breaking changes to API contracts

### Important (Should Fix)
- [ ] Error handling gaps
- [ ] Missing type annotations
- [ ] Accessibility issues
- [ ] Performance issues
- [ ] Missing tests for critical paths

### Nice to Have (Consider Fixing)
- [ ] Code style improvements
- [ ] Additional test coverage
- [ ] Documentation improvements
- [ ] Performance optimizations
- [ ] UX improvements

---

## Usage

This checklist can be used:
1. **Before submitting PR** - Self-review your changes
2. **During code review** - Reviewers can use this to ensure completeness
3. **As a command** - Reference this file in Cursor with `@code-review-checklist.md` when reviewing code

## Notes

- Not all items may be applicable to every change
- Focus on items relevant to the specific change being reviewed
- Use this as a guide, not a strict requirement for every single item
- Prioritize security, type safety, and error handling

---

**Last Updated**: 2025-01-25
**Version**: 1.0
**Project**: Diet Planner MVP

