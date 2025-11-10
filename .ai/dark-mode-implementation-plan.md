# Feature Implementation Plan: Dark Mode

## 1. Overview

The Dark Mode feature enables users to toggle between light and dark themes for the application interface. This feature implements a user preference system that persists the selected theme in the database and applies it across the entire application. The theme preference is stored per user and loaded on application initialization, ensuring a consistent visual experience throughout the user's session. Dark mode uses the existing CSS variable system already defined in `src/styles/global.css`, which includes comprehensive color definitions for both light and dark themes.

**Key Functionality:**
- Users can toggle between light and dark themes
- Theme preference is stored in the database and persists across sessions
- Theme is applied immediately on page load to prevent flash of incorrect theme
- Theme toggle is accessible from the navigation bar for quick access
- System preference detection (optional) can be supported in the future
- All UI components automatically adapt using Tailwind's `dark:` variant and CSS variables

**Integration Points:**
- Database: Extend `user_preferences` table to store theme preference
- UI: Theme toggle component in NavBar (similar to LanguageSelector)
- Styling: Leverage existing dark mode CSS variables in `global.css`
- Client-side: Apply theme class to `<html>` element for Tailwind dark mode
- Server-side: Apply theme class in Astro layouts to prevent flash

**Technical Foundation:**
The application already has dark mode CSS variables defined in `src/styles/global.css` with a `.dark` class selector. The implementation will add the `dark` class to the `<html>` element to activate dark mode, and Tailwind's `@custom-variant dark (&:is(.dark *))` will handle all dark mode styling automatically.

## 2. View Routing

- **Path**: Theme toggle is accessible via the NavBar component (present on all pages)
- **Layout**: 
  - Private Layout (`src/layouts/PrivateLayout.astro`) - theme toggle visible to authenticated users
  - Public Layout (`src/layouts/Layout.astro`) - theme toggle visible to unauthenticated users
  - Landing Layout (`src/layouts/LandingLayout.astro`) - theme toggle visible on landing page
- **Access Control**: Theme toggle is available to all users (authenticated and unauthenticated)
- **Navigation**: Theme toggle button/switch in the NavBar, visible on all pages

## 3. Component Structure

```
NavBar (React Component - Existing)
└── ThemeToggle (React Component - New)
    └── Button (Shadcn/ui Button)
        └── Icon (Sun/Moon icon from lucide-react)

AppWithTranslations (React Component - Existing)
└── ThemeProvider (React Component - New)
    └── TranslationProvider (Existing)
        └── NavBar (Existing)
            └── ThemeToggle (New)

All Layouts (Astro - Existing)
└── <html> element
    └── Theme class applied server-side (New)
```

## 4. Component Details

### ThemeToggle (React Component - New)

- **Component description**: A button component that allows users to toggle between light and dark themes. It displays an icon (sun for light mode, moon for dark mode) and provides visual feedback when clicked. The component fetches the current theme preference from the API on mount (if authenticated), updates the UI immediately when changed, and persists the change to the database (if authenticated). For unauthenticated users, it uses localStorage as a fallback.

- **Main elements**:
  - `<Button>`: Shadcn/ui Button component with icon
  - Sun icon (`Sun` from lucide-react): Displayed when in dark mode (clicking switches to light)
  - Moon icon (`Moon` from lucide-react): Displayed when in light mode (clicking switches to dark)
  - Loading state indicator (optional, while fetching preference)
  - Tooltip (optional): "Switch to light mode" / "Switch to dark mode"

- **Handled interactions**:
  - **Theme toggle**: User clicks on the theme toggle button
    - Updates local state immediately for instant UI feedback
    - Applies theme class to `<html>` element
    - Saves preference to localStorage (for immediate persistence)
    - Calls API to persist the preference to the database (if authenticated)
    - Handles errors gracefully with user-friendly messages
  - **Component mount**: 
    - Checks localStorage for theme preference
    - Fetches current theme preference from API (if authenticated)
    - Applies theme immediately to prevent flash
  - **Error handling**: Displays error message if API call fails (non-blocking, falls back to localStorage)

- **Handled validation**:
  - **Theme value validation**: Only accepts "light" or "dark" values
  - **API response validation**: Validates that the API returns a valid theme value

- **Types**:
  - `Theme`: `"light" | "dark"` - Type for supported theme values
  - `ThemePreference`: `{ theme: Theme }` - Type for theme preference data
  - `Props`: Component props interface (optional, may accept className)

- **Props**:
  - `className?: string`: Optional CSS class name for styling

### ThemeProvider (React Component - New)

- **Component description**: A React Context Provider that manages theme state across the application. It wraps the application and provides theme context to all child components. The provider initializes the theme from user preference (database or localStorage), applies the theme class to the `<html>` element, and provides a `useTheme()` hook for components to access and update the theme.

- **Main elements**:
  - `ThemeProvider`: React Context Provider that wraps the application
  - `useTheme()`: Custom hook that returns theme value and setter function
  - Theme initialization logic: Fetches user preference on app initialization
  - HTML class management: Adds/removes `dark` class from `<html>` element

- **Handled interactions**:
  - **Theme change**: When theme is changed, updates context and applies class to `<html>` element
  - **Initial load**: Fetches user theme preference and sets initial theme
  - **Fallback**: Falls back to "light" if theme preference cannot be loaded
  - **localStorage sync**: Syncs theme preference with localStorage for persistence

- **Types**:
  - `Theme`: `"light" | "dark"` - Type for supported theme values
  - `ThemeContextValue`: `{ theme: Theme, setTheme: (theme: Theme) => Promise<void>, toggleTheme: () => Promise<void> }`

### Modified Components (Existing)

- **AppWithTranslations.tsx**: Wrap children with `ThemeProvider` in addition to `TranslationProvider`
- **All Layouts (Astro)**: Apply theme class to `<html>` element server-side based on user preference (if available) to prevent flash of incorrect theme
- **NavBar.tsx**: Add `ThemeToggle` component next to `LanguageSelector`

## 5. Types

### Theme

```typescript
type Theme = "light" | "dark";
```

**Field Details**:
- `"light"`: Light theme (default)
- `"dark"`: Dark theme

### ThemePreference

```typescript
interface ThemePreference {
  theme: Theme;
}
```

**Field Details**:
- `theme: Theme`: The user's preferred theme. Must be either "light" or "dark".

### GetThemePreferenceResponseDto

```typescript
interface GetThemePreferenceResponseDto {
  theme: Theme;
}
```

**Field Details**:
- `theme: Theme`: The current theme preference for the authenticated user.

### UpdateThemePreferenceCommand

```typescript
interface UpdateThemePreferenceCommand {
  theme: Theme;
}
```

**Field Details**:
- `theme: Theme`: The new theme preference to set. Must be either "light" or "dark".

### UpdateThemePreferenceResponseDto

```typescript
interface UpdateThemePreferenceResponseDto {
  theme: Theme;
}
```

**Field Details**:
- `theme: Theme`: The updated theme preference, confirming the change was successful.

### Extended User Preferences Types

The existing `user_preferences` table will be extended to include a `theme` column. The database types will be updated accordingly:

```typescript
// In Database["public"]["Tables"]["user_preferences"]
user_preferences: {
  Row: {
    user_id: string;
    language: "en" | "pl";
    theme: "light" | "dark"; // New field
    created_at: string;
    updated_at: string;
  };
  Insert: {
    user_id: string;
    language?: "en" | "pl";
    theme?: "light" | "dark"; // New field, defaults to "light"
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    language?: "en" | "pl";
    theme?: "light" | "dark"; // New field
    updated_at?: string;
  };
}
```

## 6. State Management

### Theme Preference State

Theme preference is managed through multiple layers:

1. **Database State**: Stored in `user_preferences` table, persisted across sessions (authenticated users only)
2. **localStorage State**: Stored in browser localStorage, persists across sessions (all users, fallback for unauthenticated)
3. **API State**: Retrieved via `GET /api/user-preferences` endpoint (authenticated users only)
4. **React Context State**: Managed by `ThemeProvider` component
5. **DOM State**: `dark` class on `<html>` element for Tailwind dark mode
6. **Local Component State**: `ThemeToggle` component manages its own loading/error states

### State Flow

1. **Application Initialization**:
   - `ThemeProvider` mounts and checks localStorage for theme preference
   - If authenticated, fetches theme preference from `GET /api/user-preferences`
   - If API call succeeds, uses database preference (and syncs to localStorage)
   - If API call fails or user has no preference, uses localStorage value
   - If no localStorage value exists, defaults to "light"
   - Applies theme class to `<html>` element immediately
   - All components using `useTheme()` receive the current theme

2. **Theme Change**:
   - User clicks theme toggle in `ThemeToggle` component
   - `ThemeToggle` calls `setTheme()` from `ThemeProvider`
   - `ThemeProvider` updates context state immediately
   - `ThemeProvider` applies/removes `dark` class on `<html>` element
   - `ThemeProvider` saves preference to localStorage immediately
   - If authenticated, `ThemeProvider` calls API to persist to database
   - If API call fails, error is logged but theme change is not reverted (localStorage is source of truth)

3. **Server-Side Rendering**:
   - Astro layouts check for theme preference in cookies or user session
   - Apply theme class to `<html>` element server-side to prevent flash
   - Client-side `ThemeProvider` takes over after hydration

### State Synchronization

- **localStorage ↔ Database**: Database is source of truth for authenticated users. On app load, database preference overwrites localStorage. On theme change, both are updated.
- **localStorage ↔ DOM**: DOM class is always in sync with localStorage value
- **Context ↔ DOM**: Context state is always in sync with DOM class

## 7. API Integration

### Database Schema Changes

**Migration**: `supabase/migrations/YYYYMMDDHHMMSS_add_theme_to_user_preferences.sql`

Add `theme` column to `user_preferences` table:

```sql
-- Add theme column to user_preferences table
ALTER TABLE "public"."user_preferences"
ADD COLUMN "theme" text NOT NULL DEFAULT 'light' 
CHECK ("theme" IN ('light', 'dark'));
```

**Note**: The migration adds a new column with a default value, so existing records will automatically get "light" as their theme preference.

### API Endpoints

#### GET /api/user-preferences

**Description**: Retrieves the authenticated user's preferences (language and theme). This endpoint already exists but will be extended to return theme preference.

**Request**:
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Body**: None

**Response**:
- **Success (200 OK)**:
  ```typescript
  {
    language: "en" | "pl",
    theme: "light" | "dark" // New field
  }
  ```
- **Success (200 OK) - No preference exists**:
  ```typescript
  {
    language: "en", // Default to English
    theme: "light" // Default to light
  }
  ```
- **Error (401 Unauthorized)**: User is not authenticated
- **Error (500 Internal Server Error)**: Database error

**Implementation**: `src/pages/api/user-preferences/index.ts` (modify existing endpoint)

#### PUT /api/user-preferences

**Description**: Updates the authenticated user's preferences (language and/or theme). This endpoint already exists but will be extended to accept theme preference.

**Request**:
- **Method**: `PUT`
- **Headers**: 
  - `Authorization: Bearer <JWT_TOKEN>`
  - `Content-Type: application/json`
- **Body**:
  ```typescript
  {
    language?: "en" | "pl", // Optional
    theme?: "light" | "dark" // Optional, new field
  }
  ```

**Response**:
- **Success (200 OK)**:
  ```typescript
  {
    language: "en" | "pl",
    theme: "light" | "dark"
  }
  ```
- **Error (400 Bad Request)**: Invalid language or theme value
- **Error (401 Unauthorized)**: User is not authenticated
- **Error (500 Internal Server Error)**: Database error

**Implementation**: `src/pages/api/user-preferences/index.ts` (modify existing endpoint)

**Note**: The endpoint accepts partial updates, so existing language preference is preserved when only theme is updated, and vice versa.

### API Client Functions

New functions in `src/lib/api/user-preferences.client.ts`:

```typescript
export const userPreferencesApi = {
  // ... existing getLanguagePreference and updateLanguagePreference functions ...

  /**
   * Gets the current user's theme preference.
   * @returns Theme preference (defaults to "light" if not set or user not authenticated)
   * @throws {Error} Only for non-401 errors (network issues, etc.)
   */
  async getThemePreference(): Promise<GetThemePreferenceResponseDto> {
    // Implementation similar to getLanguagePreference
  },

  /**
   * Updates the current user's theme preference.
   * @param command - Theme preference update command
   * @returns Updated theme preference
   * @throws {Error} If the request fails
   */
  async updateThemePreference(
    command: UpdateThemePreferenceCommand
  ): Promise<UpdateThemePreferenceResponseDto> {
    // Implementation similar to updateLanguagePreference
  },

  /**
   * Gets all user preferences (language and theme).
   * @returns All user preferences
   * @throws {Error} Only for non-401 errors
   */
  async getAllPreferences(): Promise<GetAllPreferencesResponseDto> {
    // New function to get both language and theme
  },

  /**
   * Updates any user preferences (language and/or theme).
   * @param command - Preferences update command (partial)
   * @returns Updated preferences
   * @throws {Error} If the request fails
   */
  async updatePreferences(
    command: UpdatePreferencesCommand
  ): Promise<UpdatePreferencesResponseDto> {
    // New function to update any preference(s)
  },
};
```

### Authentication Requirements

Both endpoints require authentication via `Authorization: Bearer <JWT_TOKEN>` header. The API will use `getUserFromRequest()` from `src/lib/auth/session.service.ts` to extract the authenticated user ID.

For unauthenticated users, theme preference is stored only in localStorage and is not persisted to the database.

### Database Integration

The API endpoints will interact with the `user_preferences` table:
- **GET**: Selects the theme preference for the authenticated user, or returns default "light" if no record exists
- **PUT**: Upserts the theme preference for the authenticated user (creates record if it doesn't exist, updates if it does)

## 8. User Interactions

### Theme Toggle

- **Interaction**: User clicks the theme toggle button in the NavBar
- **Expected Outcome**: 
  - Theme switches immediately (light ↔ dark)
  - Icon changes (sun ↔ moon)
  - All UI components update their colors instantly
  - Preference is saved to localStorage
  - If authenticated, preference is saved to database
- **Implementation**: 
  - `ThemeToggle` component calls `toggleTheme()` from `useTheme()` hook
  - `ThemeProvider` updates context state
  - `ThemeProvider` applies/removes `dark` class on `<html>` element
  - `ThemeProvider` saves to localStorage
  - `ThemeProvider` calls API to save to database (if authenticated)

### Initial Theme Load

- **Interaction**: User visits the application (page load)
- **Expected Outcome**: 
  - Theme is applied immediately (no flash of incorrect theme)
  - Theme matches user's last preference
- **Implementation**: 
  - Server-side: Astro layout checks for theme in cookies/session and applies class to `<html>`
  - Client-side: `ThemeProvider` initializes from localStorage or API
  - Client-side: `ThemeProvider` applies theme class if not already applied

### Error Handling

- **Interaction**: API call to save theme preference fails
- **Expected Outcome**: 
  - Theme change is not reverted (localStorage is source of truth)
  - Error is logged to console
  - User sees no error message (non-blocking)
  - Theme preference will be saved on next successful API call
- **Implementation**: 
  - `ThemeProvider` catches API errors
  - Logs error to console
  - Continues with localStorage value
  - Retries on next theme change

## 9. Conditions and Validation

### Client-Side Validation

- **Theme Value Validation**: 
  - Only "light" or "dark" values are accepted
  - Invalid values default to "light"
  - Validation performed in `ThemeProvider` and `ThemeToggle` components

- **localStorage Validation**: 
  - On read, validates that stored value is "light" or "dark"
  - Invalid values are ignored and default to "light"
  - Missing values default to "light"

### Server-Side Validation

- **API Request Validation**: 
  - Theme value must be "light" or "dark" (Zod schema validation)
  - Invalid values return 400 Bad Request
  - Validation performed in API endpoint using Zod

- **Database Validation**: 
  - Database CHECK constraint ensures only "light" or "dark" values
  - Database defaults to "light" if not specified

### Access Control Conditions

- **Authenticated Users**: 
  - Theme preference is stored in database and localStorage
  - Database is source of truth
  - API endpoints are accessible

- **Unauthenticated Users**: 
  - Theme preference is stored only in localStorage
  - No API calls are made
  - Preference persists across sessions in same browser

### Business Logic Conditions

- **Theme Application**: 
  - Theme class must be applied to `<html>` element (not `<body>`)
  - Theme must be applied before first paint to prevent flash
  - Server-side rendering should apply theme if preference is known

- **Preference Priority**: 
  1. Database preference (if authenticated and available)
  2. localStorage preference (if available)
  3. Default "light" theme

## 10. Error Handling

### Validation Errors

- **Invalid Theme Value**: 
  - Client-side: Defaults to "light", logs warning
  - Server-side: Returns 400 Bad Request with error details
  - User-friendly message: "Invalid theme preference"

### API Errors

- **401 Unauthorized**: 
  - Client-side: Falls back to localStorage, no error shown
  - Theme toggle still works for unauthenticated users
  - No redirect (theme is available to all users)

- **400 Bad Request**: 
  - Client-side: Logs error, reverts to previous theme
  - User-friendly message: "Failed to save theme preference"
  - Theme change is reverted in UI

- **500 Internal Server Error**: 
  - Client-side: Logs error, keeps theme change (localStorage is source of truth)
  - User-friendly message: None (non-blocking, theme works locally)
  - Error logged to console for debugging

- **Network Errors**: 
  - Client-side: Logs error, keeps theme change (localStorage is source of truth)
  - Theme toggle continues to work locally
  - Preference will be saved on next successful API call

### Edge Cases

- **Missing localStorage Support**: 
  - Falls back to default "light" theme
  - Theme toggle works but doesn't persist
  - No error shown to user

- **Database Migration Not Applied**: 
  - API returns existing preference structure (without theme)
  - Client-side defaults to "light"
  - No error shown, graceful degradation

- **Theme Class Not Applied**: 
  - Check that `<html>` element exists
  - Check that class is applied before first paint
  - Fallback: Apply class immediately on client-side mount

- **Flash of Incorrect Theme**: 
  - Prevent by applying theme class server-side in Astro layouts
  - Use blocking script in `<head>` if necessary
  - Minimize time between HTML load and theme application

## 11. Implementation Steps

### Step 1: Database Migration

1. Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_add_theme_to_user_preferences.sql`
2. Add `theme` column to `user_preferences` table with CHECK constraint
3. Set default value to "light"
4. Test migration locally
5. Apply migration to database

### Step 2: Update Type Definitions

1. Update `src/types.ts`:
   - Add `Theme` type
   - Add `GetThemePreferenceResponseDto` type
   - Add `UpdateThemePreferenceCommand` type
   - Add `UpdateThemePreferenceResponseDto` type
   - Add `GetAllPreferencesResponseDto` type (optional, for unified endpoint)
   - Add `UpdatePreferencesCommand` type (optional, for unified endpoint)
   - Add `UpdatePreferencesResponseDto` type (optional, for unified endpoint)
2. Update `src/db/database.types.ts` (regenerate from Supabase or manually update):
   - Add `theme` field to `user_preferences` table types

### Step 3: Update User Preferences Service

1. Update `src/lib/user-preferences/user-preference.service.ts`:
   - Add `getUserThemePreference()` function
   - Add `updateUserThemePreference()` function
   - Update `getUserLanguagePreference()` to return both language and theme (or create `getAllUserPreferences()`)
   - Update `updateUserLanguagePreference()` to accept partial updates (or create `updateUserPreferences()`)

### Step 4: Update API Endpoints

1. Update `src/pages/api/user-preferences/index.ts`:
   - Modify `GET` endpoint to return theme preference
   - Modify `PUT` endpoint to accept and update theme preference
   - Add Zod schemas for theme validation
   - Update error handling

### Step 5: Update API Client

1. Update `src/lib/api/user-preferences.client.ts`:
   - Add `getThemePreference()` function
   - Add `updateThemePreference()` function
   - Update existing functions to handle theme (or create unified functions)
   - Update error handling

### Step 6: Create Theme Provider

1. Create `src/lib/theme/ThemeProvider.tsx`:
   - Implement React Context for theme state
   - Implement `useTheme()` hook
   - Implement theme initialization logic
   - Implement localStorage synchronization
   - Implement API synchronization (for authenticated users)
   - Implement DOM class management (`dark` class on `<html>`)

### Step 7: Create Theme Toggle Component

1. Create `src/components/ThemeToggle.tsx`:
   - Implement theme toggle button
   - Use sun/moon icons from lucide-react
   - Integrate with `useTheme()` hook
   - Handle loading and error states
   - Add accessibility attributes (aria-label)

### Step 8: Update AppWithTranslations Component

1. Update `src/components/AppWithTranslations.tsx`:
   - Wrap children with `ThemeProvider`
   - Ensure `ThemeProvider` wraps `TranslationProvider` (or vice versa, test order)

### Step 9: Update NavBar Component

1. Update `src/components/NavBar.tsx`:
   - Add `ThemeToggle` component next to `LanguageSelector`
   - Ensure proper spacing and alignment
   - Test responsive design

### Step 10: Update Astro Layouts

1. Update `src/layouts/PrivateLayout.astro`:
   - Add server-side theme detection (from cookies or user session)
   - Apply theme class to `<html>` element server-side
   - Add blocking script in `<head>` to apply theme before first paint (if needed)

2. Update `src/layouts/Layout.astro`:
   - Add server-side theme detection (from cookies)
   - Apply theme class to `<html>` element server-side

3. Update `src/layouts/LandingLayout.astro`:
   - Add server-side theme detection (from cookies)
   - Apply theme class to `<html>` element server-side

### Step 11: Add Translation Keys

1. Update translation files:
   - `src/lib/i18n/translations/en.json`: Add theme-related keys
   - `src/lib/i18n/translations/pl.json`: Add theme-related keys
   - Keys: `nav.theme`, `nav.theme.light`, `nav.theme.dark`, `nav.theme.switchToLight`, `nav.theme.switchToDark`

### Step 12: Testing

1. **Unit Tests**:
   - Test `ThemeProvider` initialization logic
   - Test `ThemeProvider` theme switching
   - Test `ThemeProvider` localStorage synchronization
   - Test `ThemeProvider` API synchronization
   - Test `ThemeToggle` component rendering
   - Test `ThemeToggle` interaction handling
   - Test API client functions
   - Test service functions

2. **Integration Tests**:
   - Test theme persistence across page reloads
   - Test theme synchronization between database and localStorage
   - Test theme application on page load (no flash)
   - Test theme toggle for authenticated users
   - Test theme toggle for unauthenticated users

3. **E2E Tests (Playwright)**:
   - Test theme toggle interaction
   - Test theme persistence after logout/login
   - Test theme application on initial page load
   - Test theme works across all pages

4. **Manual Testing**:
   - Test theme toggle in NavBar
   - Test theme persistence across browser sessions
   - Test theme on all pages (dashboard, editor, auth pages, landing page)
   - Test theme with all UI components (forms, buttons, cards, etc.)
   - Test responsive design with theme toggle
   - Test accessibility (keyboard navigation, screen readers)

### Step 13: Documentation

1. Update README or documentation:
   - Document theme feature
   - Document theme toggle location
   - Document theme persistence behavior

### Step 14: Code Review and Refinement

1. Review code for:
   - Type safety
   - Error handling completeness
   - Performance optimizations
   - Accessibility compliance
   - Code consistency with existing patterns

## 12. Future Enhancements

1. **System Preference Detection**: 
   - Add "auto" theme option that follows system preference
   - Use `prefers-color-scheme` media query
   - Update theme automatically when system preference changes

2. **Theme Customization**: 
   - Allow users to customize accent colors
   - Store custom theme preferences in database

3. **Theme Transitions**: 
   - Add smooth transitions when switching themes
   - Use CSS transitions for color changes

4. **Multiple Theme Options**: 
   - Add additional theme variants (e.g., "high contrast", "sepia")
   - Store theme variant preference in database

5. **Theme Preview**: 
   - Show theme preview before applying
   - Allow users to test themes before committing

6. **Per-Page Theme Override**: 
   - Allow specific pages to override global theme
   - Useful for special pages or modals

## 13. Accessibility Considerations

1. **Keyboard Navigation**: 
   - Theme toggle must be keyboard accessible
   - Focus indicator must be visible
   - Enter/Space keys must toggle theme

2. **Screen Readers**: 
   - Theme toggle must have proper `aria-label`
   - Current theme state must be announced
   - Theme change must be announced to screen readers

3. **Color Contrast**: 
   - Ensure all color combinations meet WCAG AA standards in both themes
   - Test all UI components in both themes
   - Verify text readability in both themes

4. **Focus Indicators**: 
   - Ensure focus indicators are visible in both themes
   - Test keyboard navigation in both themes

## 14. Performance Considerations

1. **Initial Load**: 
   - Apply theme class server-side to prevent flash
   - Minimize blocking scripts
   - Use inline script in `<head>` if necessary

2. **Theme Switching**: 
   - Theme switch should be instant (< 100ms)
   - Use CSS variables for efficient color updates
   - Avoid re-rendering entire component tree

3. **localStorage Usage**: 
   - localStorage operations are synchronous but fast
   - Batch localStorage writes if multiple preferences change

4. **API Calls**: 
   - API calls for theme updates are non-blocking
   - Theme change is not dependent on API response
   - API calls happen asynchronously after UI update

## 15. Extensibility

The `user_preferences` table is designed to be extensible. The implementation follows the same pattern as the language preference feature, making it easy to add additional preferences in the future:

1. **Database**: Add new columns to `user_preferences` table
2. **Types**: Add new types to `src/types.ts`
3. **Service**: Add new service functions in `src/lib/user-preferences/user-preference.service.ts`
4. **API**: Extend existing endpoints or add new ones
5. **Client**: Add new API client functions
6. **UI**: Add new preference components (similar to `ThemeToggle` and `LanguageSelector`)

This pattern ensures consistency and maintainability as the application grows.

