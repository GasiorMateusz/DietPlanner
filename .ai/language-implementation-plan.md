# Feature Implementation Plan: Language Selection

## 1. Overview

The Language Selection feature enables users to choose between English and Polish for both the application interface and AI conversations. This feature implements a user preference system that persists the selected language in the database and applies it across the entire application, including UI text, form labels, error messages, and AI-generated meal plans. The language preference is stored per user and loaded on application initialization, ensuring a consistent multilingual experience throughout the user's session.

**Key Functionality:**
- Users can select between English (en) and Polish (pl) as their preferred language
- Language preference is stored in the database and persists across sessions
- UI elements (buttons, labels, messages) are translated based on the selected language
- AI system prompts and user prompts are generated in the selected language
- AI responses are expected to be in the selected language
- Language selection is accessible from the navigation bar for quick access

**Integration Points:**
- Database: New `user_preferences` table to store language preference (designed to be extensible for future preference types)
- UI: Language selector component in NavBar
- AI Service: Modified prompt formatting functions to use selected language
- Translation System: Simple key-value translation system for UI strings

**Extensibility:**
The `user_preferences` table is designed with future extensibility in mind. While the initial implementation focuses on language preference, the table structure supports adding additional user preferences (e.g., theme/dark mode, notification settings, date formats) through database migrations. See Section 15 for detailed extensibility approaches.

## 2. View Routing

- **Path**: Language selection is accessible via the NavBar component (present on all authenticated pages)
- **Layout**: Private Layout (`src/layouts/PrivateLayout.astro`) - language selector is only visible to authenticated users
- **Access Control**: Language selection requires authentication (users must be logged in)
- **Navigation**: Language selector dropdown/button in the NavBar, visible on all authenticated pages

## 3. Component Structure

```
NavBar (React Component - Existing)
└── LanguageSelector (React Component - New)
    └── Select (Shadcn/ui Select)
        ├── SelectTrigger (Button with current language)
        └── SelectContent
            ├── SelectItem (English option)
            └── SelectItem (Polish option)

All UI Components (Existing)
└── Translation Context/Hook (New)
    └── useTranslation() hook
        └── Translation files (en.json, pl.json)
```

## 4. Component Details

### LanguageSelector (React Component - New)

- **Component description**: A dropdown component that allows users to select their preferred language. It displays the current language and provides options to switch between English and Polish. The component fetches the current language preference from the API on mount, updates the UI immediately when changed, and persists the change to the database. It integrates with the translation system to update all UI text when the language changes.

- **Main elements**:
  - `<Select>`: Shadcn/ui Select component for dropdown functionality
  - `<SelectTrigger>`: Button displaying current language (e.g., "English" or "Polski")
  - `<SelectContent>`: Dropdown menu container
  - `<SelectItem value="en">`: English language option
  - `<SelectItem value="pl">`: Polish language option
  - Loading state indicator (optional, while fetching preference)

- **Handled interactions**:
  - **Language selection**: User clicks on a language option in the dropdown
    - Updates local state immediately for instant UI feedback
    - Calls API to persist the preference to the database
    - Updates translation context to refresh all UI text
    - Handles errors gracefully with user-friendly messages
  - **Component mount**: Fetches current language preference from API
  - **Error handling**: Displays error message if API call fails (non-blocking)

- **Handled validation**:
  - **Language value validation**: Only accepts "en" or "pl" values
  - **API response validation**: Validates that the API returns a valid language code

- **Types**:
  - `LanguageCode`: `"en" | "pl"` - Type for supported language codes
  - `LanguagePreference`: `{ language: LanguageCode }` - Type for language preference data
  - `Props`: Component props interface (optional, may accept className)

- **Props**:
  - `className?: string`: Optional CSS class name for styling

### Translation System (New Infrastructure)

- **Component description**: A simple translation system using React Context and custom hooks. Translation strings are stored in JSON files (`src/lib/i18n/translations/en.json`, `src/lib/i18n/translations/pl.json`). The system provides a `useTranslation()` hook that components can use to access translated strings. The translation context is updated when the language changes, causing all components using the hook to re-render with new translations.

- **Main elements**:
  - `TranslationProvider`: React Context Provider that wraps the application
  - `useTranslation()`: Custom hook that returns translation function and current language
  - Translation JSON files: Key-value pairs for all translatable strings
  - Language loading logic: Fetches user preference on app initialization

- **Handled interactions**:
  - **Language change**: When language is changed, context updates and all consuming components re-render
  - **Initial load**: Fetches user language preference and sets initial language
  - **Fallback**: Falls back to English if translation key is missing or language preference cannot be loaded

- **Types**:
  - `TranslationKey`: String literal union of all translation keys
  - `Translations`: Record type mapping keys to translated strings
  - `TranslationContextValue`: `{ t: (key: TranslationKey) => string, language: LanguageCode }`

### Modified Components (Existing)

All existing UI components that display text will need to be updated to use the `useTranslation()` hook instead of hardcoded strings. This includes but is not limited to:

- `NavBar.tsx`: "Log out", "Delete Account", "Log in" buttons
- `LoginForm.tsx`: Form labels, error messages, button text
- `RegisterForm.tsx`: Form labels, validation messages, button text
- `DashboardView.tsx`: Page titles, empty states, button labels
- `AIChatInterface.tsx`: Chat input placeholder, send button, loading states
- `MealPlanEditor.tsx`: Editor labels, save button, export button
- All other components with user-facing text

**Note**: This is a gradual migration. Components can be updated incrementally, with English as the default fallback.

## 5. Types

### LanguageCode

```typescript
type LanguageCode = "en" | "pl";
```

**Field Details**:
- `"en"`: English language code
- `"pl"`: Polish language code

### LanguagePreference

```typescript
interface LanguagePreference {
  language: LanguageCode;
}
```

**Field Details**:
- `language: LanguageCode`: The user's preferred language code. Must be either "en" or "pl".

### GetLanguagePreferenceResponseDto

```typescript
interface GetLanguagePreferenceResponseDto {
  language: LanguageCode;
}
```

**Field Details**:
- `language: LanguageCode`: The current language preference for the authenticated user.

### UpdateLanguagePreferenceCommand

```typescript
interface UpdateLanguagePreferenceCommand {
  language: LanguageCode;
}
```

**Field Details**:
- `language: LanguageCode`: The new language preference to set. Must be either "en" or "pl".

### UpdateLanguagePreferenceResponseDto

```typescript
interface UpdateLanguagePreferenceResponseDto {
  language: LanguageCode;
}
```

**Field Details**:
- `language: LanguageCode`: The updated language preference, confirming the change was successful.

### TranslationKey

```typescript
type TranslationKey = 
  | "nav.logout"
  | "nav.deleteAccount"
  | "nav.login"
  | "nav.language"
  | "nav.language.english"
  | "nav.language.polish"
  | "auth.email"
  | "auth.password"
  | "auth.confirmPassword"
  | "auth.login"
  | "auth.register"
  | "auth.forgotPassword"
  | "auth.resetPassword"
  | "auth.termsAccept"
  | "auth.createAccount"
  | "auth.loggingOut"
  | "auth.loggingIn"
  | "auth.creatingAccount"
  | "dashboard.title"
  | "dashboard.createPlan"
  | "dashboard.noPlans"
  | "chat.send"
  | "chat.placeholder"
  | "chat.loading"
  | "editor.save"
  | "editor.export"
  | "common.loading"
  | "common.error"
  | "common.success"
  | "common.cancel"
  | "common.confirm"
  | "common.delete"
  | "common.save"
  // ... more keys as needed
```

**Field Details**:
- String literal union type containing all translation keys used throughout the application
- Keys follow a hierarchical naming convention (e.g., `nav.logout`, `auth.email`)
- New keys can be added as components are migrated to use translations

### Translations

```typescript
interface Translations {
  [key: TranslationKey]: string;
}
```

**Field Details**:
- Record type mapping translation keys to their translated string values
- Each language file (en.json, pl.json) implements this interface

### Database Types (New Table)

The following types will be added to `src/db/database.types.ts` after running the migration:

```typescript
// In Database["public"]["Tables"]
user_preferences: {
  Row: {
    user_id: string;
    language: "en" | "pl";
    created_at: string;
    updated_at: string;
  };
  Insert: {
    user_id: string;
    language?: "en" | "pl"; // defaults to "en"
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    language?: "en" | "pl";
    updated_at?: string;
  };
}
```

**Field Details**:
- `user_id: string`: Foreign key to `auth.users.id`. One preference record per user.
- `language: "en" | "pl"`: The user's preferred language. Defaults to "en" if not specified.
- `created_at: string`: Timestamp when the preference record was created.
- `updated_at: string`: Timestamp when the preference was last updated.

## 6. State Management

### Language Preference State

Language preference is managed through multiple layers:

1. **Database State**: Stored in `user_preferences` table, persisted across sessions
2. **API State**: Retrieved via `GET /api/user-preferences` endpoint
3. **React Context State**: Managed by `TranslationProvider` component
4. **Local Component State**: `LanguageSelector` component manages its own loading/error states

### State Flow

1. **Application Initialization**:
   - `TranslationProvider` mounts and checks for existing language in localStorage (optional cache)
   - Fetches language preference from `GET /api/user-preferences`
   - If API call succeeds, sets language in context
   - If API call fails or user has no preference, defaults to "en"
   - All components using `useTranslation()` receive the current language

2. **Language Change**:
   - User selects new language in `LanguageSelector`
   - Component immediately updates local state (optimistic update)
   - Component calls `PUT /api/user-preferences` with new language
   - On success, `TranslationProvider` context is updated with new language
   - All components using `useTranslation()` re-render with new translations
   - On error, component reverts to previous language and displays error message

3. **Session Persistence**:
   - Language preference is stored in database, so it persists across sessions
   - On each app load, preference is fetched from API
   - Optional: Can cache in localStorage for faster initial load (with API as source of truth)

### Translation Context State

The `TranslationProvider` manages:
- `language: LanguageCode`: Current language code ("en" or "pl")
- `translations: Translations`: Current translation object loaded from JSON file
- `isLoading: boolean`: Whether language preference is being fetched (optional)

### Component Local State

`LanguageSelector` component manages:
- `currentLanguage: LanguageCode`: Current language (from context)
- `isUpdating: boolean`: Whether API call is in progress
- `error: string | null`: Error message if update fails

### No Global State Manager

Following the project's architecture principles, no global state manager (Redux, Zustand, etc.) is used. State is managed through:
- React Context for translation system
- Local component state for UI interactions
- Database for persistence

## 7. API Integration

### New API Endpoints

**Note**: The current implementation focuses on language preference only. These endpoints can be extended in the future to handle additional preferences (see Section 15: Future Considerations for extensibility approaches).

#### GET /api/user-preferences

**Description**: Retrieves the authenticated user's language preference.

**Request**:
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Body**: None

**Response**:
- **Success (200 OK)**:
  ```typescript
  {
    language: "en" | "pl"
  }
  ```
- **Success (200 OK) - No preference exists**:
  ```typescript
  {
    language: "en" // Default to English
  }
  ```
- **Error (401 Unauthorized)**: User is not authenticated
- **Error (500 Internal Server Error)**: Database error

**Implementation**: `src/pages/api/user-preferences/index.ts`

**Future Extension**: This endpoint can be extended to return all user preferences:
```typescript
{
  language: "en" | "pl",
  theme?: "light" | "dark" | "auto",
  notifications_enabled?: boolean,
  // ... other preferences
}
```

#### PUT /api/user-preferences

**Description**: Updates the authenticated user's language preference.

**Request**:
- **Method**: `PUT`
- **Headers**: 
  - `Authorization: Bearer <JWT_TOKEN>`
  - `Content-Type: application/json`
- **Body**:
  ```typescript
  {
    language: "en" | "pl"
  }
  ```

**Response**:
- **Success (200 OK)**:
  ```typescript
  {
    language: "en" | "pl"
  }
  ```
- **Error (400 Bad Request)**: Invalid language code (not "en" or "pl")
- **Error (401 Unauthorized)**: User is not authenticated
- **Error (500 Internal Server Error)**: Database error

**Implementation**: `src/pages/api/user-preferences/index.ts`

**Future Extension**: This endpoint can be extended to accept partial updates of any preference:
```typescript
// Request body could accept any preference
{
  language?: "en" | "pl",
  theme?: "light" | "dark" | "auto",
  // ... other preferences
}
```

### API Client Functions

New functions in `src/lib/api/user-preferences.client.ts`:

```typescript
export const userPreferencesApi = {
  /**
   * Gets the current user's language preference.
   * @returns Language preference (defaults to "en" if not set)
   */
  async getLanguagePreference(): Promise<GetLanguagePreferenceResponseDto> {
    const headers = await getAuthHeaders();
    const response = await fetch("/api/user-preferences", {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      throw new Error("Failed to fetch language preference");
    }

    return handleApiResponse<GetLanguagePreferenceResponseDto>(response);
  },

  /**
   * Updates the current user's language preference.
   * @param command - Language preference update command
   * @returns Updated language preference
   */
  async updateLanguagePreference(
    command: UpdateLanguagePreferenceCommand
  ): Promise<UpdateLanguagePreferenceResponseDto> {
    const headers = await getAuthHeaders();
    const response = await fetch("/api/user-preferences", {
      method: "PUT",
      headers,
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Invalid language preference");
      }
      throw new Error("Failed to update language preference");
    }

    return handleApiResponse<UpdateLanguagePreferenceResponseDto>(response);
  },
};
```

### Authentication Requirements

Both endpoints require authentication via `Authorization: Bearer <JWT_TOKEN>` header. The API will use `getUserFromRequest()` from `src/lib/auth/session.service.ts` to extract the authenticated user ID.

### Database Integration

The API endpoints will interact with the `user_preferences` table:
- **GET**: Selects the language preference for the authenticated user, or returns default "en" if no record exists
- **PUT**: Upserts (inserts or updates) the language preference for the authenticated user

## 8. User Interactions

### 8.1. Language Selection

**Interaction**: User clicks on the language selector in the NavBar and selects either "English" or "Polski" from the dropdown.

**Expected Outcome**:
1. Dropdown opens showing current language and available options
2. User clicks on a language option
3. Dropdown closes
4. Language selector button text updates immediately (optimistic update)
5. All UI text throughout the application updates to the selected language
6. Preference is saved to the database
7. Language preference persists for future sessions

**Implementation**: 
- `LanguageSelector` component handles the dropdown interaction
- On selection, calls `userPreferencesApi.updateLanguagePreference()`
- Updates `TranslationProvider` context with new language
- All components using `useTranslation()` automatically re-render

### 8.2. Initial Language Load

**Interaction**: User logs in and the application loads.

**Expected Outcome**:
1. Application checks for stored language preference
2. If preference exists, UI loads in that language
3. If no preference exists, UI loads in English (default)
4. Language selector displays the current language

**Implementation**:
- `TranslationProvider` fetches language preference on mount via `userPreferencesApi.getLanguagePreference()`
- Sets language in context
- All components render with correct translations

### 8.3. Language Update Error Handling

**Interaction**: User selects a new language, but the API call fails.

**Expected Outcome**:
1. Language selector reverts to previous language
2. Error message is displayed (non-blocking, e.g., toast notification)
3. User can retry the language change
4. UI remains functional in the previous language

**Implementation**:
- `LanguageSelector` catches API errors
- Reverts local state to previous language
- Displays error message via toast or inline alert
- User can attempt to change language again

### 8.4. Unauthenticated User

**Interaction**: User is not logged in (public pages).

**Expected Outcome**:
1. Language selector is not visible (only shown for authenticated users)
2. Public pages display in default language (English)
3. After login, user's preferred language is applied

**Implementation**:
- `LanguageSelector` is only rendered in `NavBar` when user is authenticated
- Public pages use default English translations
- After authentication, `TranslationProvider` fetches user preference

## 9. Conditions and Validation

### 9.1. Language Code Validation

**Condition**: Language code must be either "en" or "pl"

**Validation Rules**:
- Client-side: `LanguageSelector` only allows selection of "en" or "pl" options
- Server-side: API endpoint validates language code using Zod schema:
  ```typescript
  const updateLanguageSchema = z.object({
    language: z.enum(["en", "pl"]),
  });
  ```

**Error Handling**:
- If invalid language code is sent to API, returns 400 Bad Request with error message

### 9.2. Authentication Requirement

**Condition**: Language preference endpoints require authentication

**Validation Rules**:
- API endpoints check for valid `Authorization: Bearer <JWT>` header
- Uses `getUserFromRequest()` to extract and validate user
- If authentication fails, returns 401 Unauthorized

**Error Handling**:
- Client redirects to `/auth/login` on 401 response (handled by existing error handling)

### 9.3. Database Constraints

**Condition**: One language preference per user

**Validation Rules**:
- Database uses `user_id` as primary key in `user_preferences` table
- Upsert operation ensures only one preference record exists per user
- Foreign key constraint ensures `user_id` references valid `auth.users.id`

**Error Handling**:
- Database errors are caught and returned as 500 Internal Server Error
- Client displays generic error message to user

### 9.4. Translation Key Fallback

**Condition**: Translation key may not exist in translation file

**Validation Rules**:
- `useTranslation()` hook checks if translation key exists
- If key is missing, falls back to the key itself (e.g., displays "nav.logout" if translation is missing)
- Logs warning in development mode

**Error Handling**:
- Non-blocking: Application continues to function
- Missing translations are visible in development, encouraging fixes

### 9.5. AI Prompt Language

**Condition**: AI prompts must be generated in the selected language

**Validation Rules**:
- `formatSystemPrompt()` and `formatUserPrompt()` functions accept language parameter
- Language-specific prompt templates are used based on user preference
- If language is not supported, falls back to English

**Error Handling**:
- If language-specific prompt template is missing, uses English template
- Logs warning in development mode

## 10. Error Handling

### 10.1. API Error: Failed to Fetch Language Preference

**Scenario**: `GET /api/user-preferences` fails (network error, 500 error, etc.)

**Handling**:
- `TranslationProvider` catches error and defaults to "en"
- Error is logged to console in development
- Application continues to function with English as default
- Non-blocking: User can still use the application

**User Experience**: User sees English interface (default), no error message shown (silent fallback)

### 10.2. API Error: Failed to Update Language Preference

**Scenario**: `PUT /api/user-preferences` fails (network error, 500 error, validation error)

**Handling**:
- `LanguageSelector` catches error
- Reverts to previous language in UI
- Displays user-friendly error message (toast or inline alert)
- User can retry the language change

**User Experience**: 
- Error message: "Failed to update language preference. Please try again."
- Language selector shows previous language
- User can attempt to change language again

### 10.3. API Error: Unauthorized (401)

**Scenario**: User's session expires while trying to update language preference

**Handling**:
- Client detects 401 response
- Redirects to `/auth/login` (existing error handling pattern)
- After re-authentication, user returns to previous page

**User Experience**: User is redirected to login page, then returns to application

### 10.4. Translation Key Missing

**Scenario**: Component uses translation key that doesn't exist in translation file

**Handling**:
- `useTranslation()` hook checks if key exists
- If missing, returns the key itself as fallback (e.g., "nav.logout")
- Logs warning in development mode: `Missing translation for key: nav.logout`

**User Experience**: 
- Development: Sees key name, warning in console
- Production: Sees key name (should be fixed before production)

### 10.5. Database Error: User Preference Creation Fails

**Scenario**: Database constraint violation or connection error when creating/updating preference

**Handling**:
- API catches database error
- Returns 500 Internal Server Error with generic message
- Client displays user-friendly error message
- User can retry the operation

**User Experience**: Error message: "An error occurred while saving your preference. Please try again."

### 10.6. AI Prompt Language Error

**Scenario**: Language-specific AI prompt template is missing or malformed

**Handling**:
- `formatSystemPrompt()` and `formatUserPrompt()` functions check if language template exists
- If missing, falls back to English template
- Logs warning in development mode
- AI conversation continues in English

**User Experience**: AI responds in English instead of selected language (should be fixed in development)

## 11. Implementation Steps

### Step 1: Database Migration

1. Create database migration file: `supabase/migrations/YYYYMMDDHHMMSS_add_user_preferences.sql`
2. Create `user_preferences` table with:
   - `user_id` (UUID, primary key, foreign key to `auth.users.id`)
   - `language` (enum or text, default "en")
   - `created_at` (timestamptz, default now())
   - `updated_at` (timestamptz, default now())
3. Add RLS policies:
   - Users can SELECT their own preferences
   - Users can INSERT their own preferences (if not exists)
   - Users can UPDATE their own preferences
   - Users cannot DELETE preferences (or can, depending on requirements)
4. Add index on `user_id` for performance
5. Add trigger for `updated_at` timestamp
6. Run migration and update `database.types.ts`

### Step 2: Create Translation System Infrastructure

1. Create directory: `src/lib/i18n/`
2. Create translation files:
   - `src/lib/i18n/translations/en.json`
   - `src/lib/i18n/translations/pl.json`
3. Add initial translation keys for core UI elements (start with NavBar, auth forms)
4. Create `src/lib/i18n/TranslationProvider.tsx`:
   - React Context Provider
   - Manages current language state
   - Loads translation JSON files
5. Create `src/lib/i18n/useTranslation.ts`:
   - Custom hook that returns `t(key)` function and `language`
   - Handles missing key fallback
6. Create `src/lib/i18n/types.ts`:
   - Define `LanguageCode`, `TranslationKey`, `Translations` types

### Step 3: Create API Endpoints

1. Create `src/pages/api/user-preferences/index.ts`:
   - Implement `GET` handler to fetch user preference
   - Implement `PUT` handler to update user preference
   - Add validation using Zod schemas
   - Add error handling
2. Create validation schema: `src/lib/validation/user-preferences.schemas.ts`
3. Create service function: `src/lib/user-preferences/user-preference.service.ts`
   - `getUserLanguagePreference(userId, supabase)`
   - `updateUserLanguagePreference(userId, language, supabase)`
4. Create API client: `src/lib/api/user-preferences.client.ts`
   - `getLanguagePreference()`
   - `updateLanguagePreference(command)`
5. Add types to `src/types.ts`:
   - `GetLanguagePreferenceResponseDto`
   - `UpdateLanguagePreferenceCommand`
   - `UpdateLanguagePreferenceResponseDto`

### Step 4: Create LanguageSelector Component

1. Create `src/components/LanguageSelector.tsx`:
   - Use Shadcn/ui Select component
   - Fetch current language on mount
   - Handle language change
   - Display loading/error states
   - Integrate with translation system
2. Add component to `NavBar.tsx`:
   - Import and render `LanguageSelector`
   - Position it appropriately in the navigation bar

### Step 5: Integrate TranslationProvider

1. Wrap application with `TranslationProvider`:
   - Update `PrivateLayout.astro` to include provider
   - Update `Layout.astro` (public layout) to include provider (optional, for public pages)
2. Configure provider to:
   - Fetch language preference on mount
   - Handle errors gracefully
   - Default to "en" if preference cannot be loaded

### Step 6: Update AI Prompt Functions

1. Modify `src/lib/ai/session.service.ts`:
   - Update `formatSystemPrompt()` to accept `language: LanguageCode` parameter
   - Update `formatUserPrompt()` to accept `language: LanguageCode` parameter
   - Create language-specific prompt templates (English and Polish)
2. Update `createSession()` function:
   - Accept language parameter (from user preference)
   - Pass language to prompt formatting functions
3. Update `sendMessage()` function:
   - Retrieve language from user preference (may need to fetch from database or pass through)
   - Pass language to prompt formatting functions
4. Update API endpoints that call these functions:
   - `src/pages/api/ai/sessions/index.ts`: Fetch user language preference and pass to `createSession()`
   - `src/pages/api/ai/sessions/[id]/message.ts`: Fetch user language preference and pass to `sendMessage()`

### Step 7: Migrate Components to Use Translations

1. Start with high-priority components:
   - `NavBar.tsx`: Update button labels, menu items
   - `LoginForm.tsx`: Update form labels, error messages, button text
   - `RegisterForm.tsx`: Update form labels, validation messages
   - `DashboardView.tsx`: Update page title, button labels, empty states
2. For each component:
   - Import `useTranslation()` hook
   - Replace hardcoded strings with `t("translation.key")`
   - Add translation keys to both `en.json` and `pl.json`
3. Continue with remaining components incrementally:
   - `AIChatInterface.tsx`
   - `MealPlanEditor.tsx`
   - `MealPlanList.tsx`
   - All other components with user-facing text

### Step 8: Add Polish Translations

1. Review all English translation keys
2. Translate each key to Polish in `pl.json`
3. Ensure translations are:
   - Accurate and natural in Polish
   - Consistent in terminology
   - Appropriate for professional dietitian audience
4. Consider hiring a native Polish speaker for review (if available)

### Step 9: Create Polish AI Prompt Templates

1. Create Polish versions of system and user prompts:
   - Polish system prompt explaining AI's role and XML structure requirements
   - Polish user prompt template for meal plan requests
2. Ensure Polish prompts:
   - Maintain the same structure and requirements as English
   - Use natural Polish language
   - Include all necessary instructions for XML formatting
3. Update `formatSystemPrompt()` and `formatUserPrompt()` to use language-specific templates

### Step 10: Testing

1. **Unit Tests**:
   - Test `TranslationProvider` and `useTranslation()` hook
   - Test API client functions
   - Test service functions
   - Test validation schemas

2. **Integration Tests**:
   - Test language preference API endpoints
   - Test language selector component
   - Test translation system with different languages

3. **E2E Tests (Playwright)**:
   - Test language selection flow
   - Test UI updates when language changes
   - Test language persistence across sessions
   - Test AI conversation in both languages

4. **Manual Testing**:
   - Test all UI components in both languages
   - Test AI conversation in English
   - Test AI conversation in Polish
   - Test error handling scenarios
   - Test language preference persistence

### Step 11: Documentation and Cleanup

1. Update project documentation:
   - Add language feature to README
   - Document translation key naming conventions
   - Document how to add new languages (future expansion)
2. Code cleanup:
   - Remove any unused translation keys
   - Ensure consistent code style
   - Run linter and fix any issues
3. Update type definitions:
   - Ensure all types are exported properly
   - Update `src/types.ts` with new DTOs
   - Regenerate database types if needed

## 12. Database Schema Changes

### New Table: user_preferences

```sql
CREATE TABLE "public"."user_preferences" (
  "user_id" uuid NOT NULL,
  "language" text NOT NULL DEFAULT 'en' CHECK ("language" IN ('en', 'pl')),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id"),
  CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_user_preferences_user_id" ON "public"."user_preferences" USING btree ("user_id");

-- RLS Policies
ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow authenticated select own preferences"
ON "public"."user_preferences" FOR SELECT
TO "authenticated"
USING (auth.uid() = user_id);

CREATE POLICY "allow authenticated insert own preferences"
ON "public"."user_preferences" FOR INSERT
TO "authenticated"
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow authenticated update own preferences"
ON "public"."user_preferences" FOR UPDATE
TO "authenticated"
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER "on_user_preferences_update"
BEFORE UPDATE ON "public"."user_preferences"
FOR EACH ROW
EXECUTE PROCEDURE "public"."handle_updated_at"();
```

## 13. Translation Key Structure

Translation keys follow a hierarchical naming convention:

- `nav.*` - Navigation bar elements
- `auth.*` - Authentication forms and messages
- `dashboard.*` - Dashboard page elements
- `chat.*` - AI chat interface elements
- `editor.*` - Meal plan editor elements
- `common.*` - Common UI elements (buttons, labels, etc.)
- `errors.*` - Error messages
- `validation.*` - Validation error messages

Example structure in `en.json`:

```json
{
  "nav.logout": "Log out",
  "nav.deleteAccount": "Delete Account",
  "nav.login": "Log in",
  "nav.language": "Language",
  "nav.language.english": "English",
  "nav.language.polish": "Polski",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.login": "Log in",
  "auth.register": "Register",
  "dashboard.title": "My Meal Plans",
  "dashboard.createPlan": "Create New Plan",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete"
}
```

## 14. AI Prompt Language Templates

### English System Prompt (Existing)

The existing English system prompt in `formatSystemPrompt()` will be kept as-is for English language.

### Polish System Prompt (New)

A Polish version of the system prompt will be created:

```typescript
function formatSystemPrompt(language: LanguageCode): string {
  if (language === "pl") {
    return `Jesteś pomocnym asystentem dietetyka. Twoim jedynym zadaniem jest generowanie planów żywieniowych na podstawie dostarczonych informacji o pacjencie i wytycznych dietetycznych.

KRYTYCZNE: MUSISZ formatować WSZYSTKIE swoje odpowiedzi używając następującej struktury XML. Każda odpowiedź musi zawierać te tagi XML:

<meal_plan>
  <daily_summary>
    <kcal>całkowite kalorie dziennie</kcal>
    <proteins>całkowite białko w gramach</proteins>
    <fats>całkowite tłuszcze w gramach</fats>
    <carbs>całkowite węglowodany w gramach</carbs>
  </daily_summary>
  <meals>
    <meal>
      <name>Nazwa posiłku (np. Śniadanie, Obiad, Kolacja)</name>
      <ingredients>Szczegółowa lista składników z ilościami</ingredients>
      <preparation>Instrukcje przygotowania krok po kroku</preparation>
      <summary>
        <kcal>kalorie dla tego posiłku</kcal>
        <protein>białko w gramach dla tego posiłku</protein>
        <fat>tłuszcz w gramach dla tego posiłku</fat>
        <carb>węglowodany w gramach dla tego posiłku</carb>
      </summary>
    </meal>
    <!-- Powtórz tag <meal> dla każdego posiłku -->
  </meals>
</meal_plan>

<comments>
Opcjonalnie: Wszelkie dodatkowe komentarze, wyjaśnienia lub uwagi, które nie są częścią samego planu żywieniowego. Użyj tego tagu do ogólnej rozmowy, wyjaśnień lub dodatkowych informacji, które chcesz udostępnić użytkownikowi. Ta zawartość będzie wyświetlana w konwersacji czatu osobno od planu żywieniowego.
</comments>

Wymagania:
1. Utwórz szczegółowy 1-dniowy plan żywieniowy spełniający określone cele żywieniowe
2. Uwzględnij WSZYSTKIE żądane posiłki ze szczegółowymi składnikami i instrukcjami przygotowania
3. Szanuj wszystkie wykluczenia dietetyczne i wytyczne
4. Oblicz i dopasuj docelowy rozkład kalorii i makroskładników jak najdokładniej
5. Upewnij się, że sumy daily_summary odpowiadają sumie wszystkich podsumowań posiłków
6. Używaj TYLKO określonych powyżej tagów XML - nie dodawaj dodatkowych tagów ani formatowania
7. Użyj tagu <comments> do wszelkiej ogólnej rozmowy lub wyjaśnień, które powinny być pokazane w czacie, ale nie są częścią struktury planu żywieniowego

Skoncentruj się wyłącznie na tworzeniu dokładnych, praktycznych planów żywieniowych. Zawsze używaj struktury XML dla każdej odpowiedzi.`;
  }
  
  // English version (existing)
  return `You are a helpful dietitian assistant...`; // existing prompt
}
```

Similar approach will be used for `formatUserPrompt()` to generate Polish user prompts.

## 15. Future Considerations

### Extensibility of user_preferences Table

The `user_preferences` table is designed to be extensible for future preference types. The current implementation focuses on language, but the table structure supports adding additional preferences through one of two approaches:

#### Approach 1: Column-Based (Current Implementation)

**Pros:**
- Simple, type-safe, easy to query
- Good for preferences that are frequently accessed
- Strong type checking in TypeScript

**Cons:**
- Requires database migration for each new preference
- Table structure changes with each new preference type

**How to Extend:**
- Add new columns to `user_preferences` table (e.g., `theme`, `notifications_enabled`, `date_format`)
- Update TypeScript types in `database.types.ts`
- Create new API endpoints or extend existing ones
- Add validation schemas for new preferences

**Example Future Columns:**
```sql
ALTER TABLE "public"."user_preferences" 
ADD COLUMN "theme" text DEFAULT 'light' CHECK ("theme" IN ('light', 'dark', 'auto')),
ADD COLUMN "notifications_enabled" boolean DEFAULT true,
ADD COLUMN "date_format" text DEFAULT 'YYYY-MM-DD';
```

#### Approach 2: JSONB Column (Alternative for Complex Preferences)

If many preferences are expected or preferences have complex nested structures, consider adding a JSONB column:

```sql
ALTER TABLE "public"."user_preferences"
ADD COLUMN "additional_preferences" jsonb DEFAULT '{}'::jsonb;
```

**Pros:**
- Very flexible, no schema changes needed for new preferences
- Good for preferences with nested structures
- Easy to add/remove preference types

**Cons:**
- Less type-safe (requires runtime validation)
- Slightly more complex queries
- Harder to enforce constraints

**Recommendation:** Start with Approach 1 (column-based) for language preference. If more than 5-7 preference types are needed, or if preferences have complex nested structures, consider migrating to a hybrid approach (keep `language` as a column, use JSONB for others) or full JSONB approach.

### Potential Enhancements

1. **Additional Languages**: The system is designed to be extensible. Adding new languages requires:
   - Adding language code to `LanguageCode` type
   - Creating new translation JSON file
   - Adding language option to `LanguageSelector`
   - Creating language-specific AI prompt templates

2. **Additional User Preferences**: The `user_preferences` table can be extended with new columns for:
   - **Theme/Dark Mode**: `theme` column (light/dark/auto)
   - **Notification Settings**: `notifications_enabled`, `email_notifications`, etc.
   - **Date/Time Format**: `date_format`, `time_format`, `timezone`
   - **Display Preferences**: `items_per_page`, `default_view`, etc.
   - **AI Preferences**: `preferred_ai_model`, `ai_temperature`, etc.

3. **Browser Language Detection**: On first visit, detect browser language and suggest it as default (if supported)

4. **Per-Session Language**: Allow temporary language changes without saving to database (for testing or one-time use)

5. **Translation Management**: Consider using a translation management system (e.g., i18next) if the number of translation keys grows significantly

6. **RTL Support**: If Arabic or Hebrew languages are added in the future, consider right-to-left (RTL) text direction support

7. **Date/Number Formatting**: Consider locale-specific formatting for dates, numbers, and currency (if applicable)

8. **AI Model Language Support**: Verify that the selected AI model (via OpenRouter) supports the chosen language well

9. **Unified Preferences API**: As more preferences are added, consider creating a unified preferences API:
   - `GET /api/user-preferences` - Returns all user preferences
   - `PUT /api/user-preferences` - Updates any preference(s)
   - `PATCH /api/user-preferences` - Partial update of specific preferences
   - This would replace individual endpoints like `/api/user-preferences/language`

