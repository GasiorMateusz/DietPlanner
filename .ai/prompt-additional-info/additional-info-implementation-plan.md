# Feature Implementation Plan: Additional Information for AI Conversations

## 1. Overview

The Additional Information feature allows users to provide context that will be automatically included in all AI conversations. This feature enables dietitians to add persistent instructions, guidelines, or context that should be considered by the AI when generating meal plans. The information is stored in the user's selected dashboard language, and when saved, translations are automatically generated for the other supported language (English/Polish). Users can view and edit this information in their My Account view, and it will be seamlessly integrated into all AI chat sessions.

**User Story**: As a User, I want to be able to add additional information to each conversation. It should be possible to edit this in my-account view. User should provide a prompt in the language they selected in the dashboard. When saving changes, the translation for other languages should be made automatically. Users provide and see additional information in the language selected in the dashboard for the whole application. This additional information is used in all AI conversations.

**Main Purpose**: 
- Provide a persistent way for users to add context that applies to all AI conversations
- Support multilingual content with automatic translation
- Integrate seamlessly into existing AI conversation flow
- Allow easy management through the My Account view

**Integration Points**:
- My Account view (`/app/account`) - for editing additional information
- AI Session creation (`/api/ai/sessions`) - to include additional info in system prompt
- AI Message sending (`/api/ai/sessions/[id]/message`) - to include additional info in follow-up messages

## 2. View Routing

- **Path**: `/app/account` (existing page at `src/pages/app/account.astro`)
- **Layout**: Private Layout (`src/layouts/PrivateLayout.astro`)
- **Access Control**: Requires authentication (handled by middleware)
- **Navigation**: Accessible via "My Account" button in the navigation bar

## 3. Component Structure

```
account.astro (Astro Page)
└── PrivateLayout.astro (Private Layout)
    └── AccountProfile (React Component)
        ├── Account Information Card (existing)
        ├── Additional Information Card (NEW)
        │   ├── Textarea (Additional Info Input)
        │   ├── Button (Save Changes)
        │   ├── Alert (Success Message)
        │   └── Alert (Error Message)
        ├── Terms and Privacy Policy Card (existing)
        ├── Account Management Card (existing)
        └── Legal Information Card (existing)
```

## 4. Component Details

### AccountProfile (React Component) - Enhanced

- **Component description**: Enhanced existing component that now includes a new section for managing additional information. The component manages form state for the additional information textarea, handles saving with automatic translation, displays success/error states, and integrates with the user preferences API.

- **Main elements** (new section):
  - `<Card>`: Container for the Additional Information section
  - `<CardHeader>`: Header with title
  - `<CardTitle>`: "Additional Information" title
  - `<CardContent>`: Content container
  - `<div className="space-y-4">`: Container for form elements
  - `<Label>`: Label for the textarea ("Additional Information")
  - `<Textarea>`: Multi-line text input for additional information
  - `<p className="text-sm text-muted-foreground">`: Helper text explaining the feature
  - `<Button>`: Save button with loading state
  - `<Alert>`: Success alert displayed after successful save
  - `<Alert>`: Error alert displayed on save failure

- **Handled interactions** (new):
  - Textarea input: Updates local state as user types
  - Save button click: Validates input, calls API to save with translation, updates UI state
  - Success alert dismissal: Clears success message
  - Error alert dismissal: Clears error message

- **Handled validation** (new):
  - **Additional Information field**:
    - Optional: Field can be empty (no required validation)
    - Maximum length: 2000 characters (to prevent excessive content)
    - Validation triggers on blur and form submission
    - Whitespace trimming: Leading/trailing whitespace is trimmed before saving

- **Types**:
  - `AdditionalInfoFormData`: Type for form input
    - `additional_info: string`
  - `AdditionalInfoResponseDto`: Type for API response
    - `additional_info_en: string | null`
    - `additional_info_pl: string | null`

- **Props**: No changes to existing props interface

### account.astro (Astro Page) - Enhanced

- **Component description**: Enhanced existing page that now fetches and passes additional information to the AccountProfile component. The page retrieves user preferences including the additional information translations from the database.

- **Main elements** (enhanced):
  - Server-side fetch of user preferences including additional information
  - Pass additional information props to AccountProfile component

- **Handled interactions**: None (server-side only)

- **Handled validation**: None (validation handled by React component)

- **Types**: None (Astro template)

- **Props**: None

## 5. Types

### AdditionalInfoFormData

Type for the form input when editing additional information:

```typescript
interface AdditionalInfoFormData {
  additional_info: string;
}
```

**Field Details**:
- `additional_info: string`: The additional information text provided by the user in their selected dashboard language. Maximum 2000 characters. Optional (can be empty string).

### AdditionalInfoResponseDto

Type for API response containing additional information in both languages:

```typescript
interface AdditionalInfoResponseDto {
  additional_info_en: string | null;
  additional_info_pl: string | null;
}
```

**Field Details**:
- `additional_info_en: string | null`: The English translation of the additional information. Null if not set.
- `additional_info_pl: string | null`: The Polish translation of the additional information. Null if not set.

### UpdateAdditionalInfoCommand

Type for API request to update additional information:

```typescript
interface UpdateAdditionalInfoCommand {
  additional_info: string;
  language: "en" | "pl";
}
```

**Field Details**:
- `additional_info: string`: The additional information text in the user's selected language. Will be translated to the other language automatically.
- `language: "en" | "pl"`: The language of the provided additional information. Used to determine which translation to update and which to generate.

### GetUserPreferencesResponseDto - Enhanced

Enhanced existing type to include additional information:

```typescript
interface GetUserPreferencesResponseDto {
  language: "en" | "pl";
  theme: Theme;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  ai_model: string | null;
  additional_info_en: string | null; // NEW
  additional_info_pl: string | null; // NEW
}
```

**New Field Details**:
- `additional_info_en: string | null`: The English translation of the user's additional information. Null if not set.
- `additional_info_pl: string | null`: The Polish translation of the user's additional information. Null if not set.

### AccountProfile Props - Enhanced

Enhanced existing props interface:

```typescript
interface AccountProfileProps {
  userEmail: string;
  termsAccepted: boolean;
  termsAcceptedAt: string | null;
  additionalInfoEn: string | null; // NEW
  additionalInfoPl: string | null; // NEW
  userLanguage: "en" | "pl"; // NEW
}
```

**New Field Details**:
- `additionalInfoEn: string | null`: The English translation of additional information. Passed from server.
- `additionalInfoPl: string | null`: The Polish translation of additional information. Passed from server.
- `userLanguage: "en" | "pl"`: The user's current language preference. Used to determine which translation to display and edit.

## 6. State Management

### AccountProfile Component State

The component uses React `useState` for local state management:

- `additionalInfo: string`: Local state for the textarea value. Initialized from props based on user's language preference.
- `isSaving: boolean`: Loading state for the save operation. Prevents multiple simultaneous saves.
- `saveSuccess: boolean`: Success state after successful save. Triggers success alert display.
- `saveError: string | null`: Error state for save failures. Stores error message for display.

**State Flow**:
1. Component mounts: `additionalInfo` is initialized from props (`additionalInfoEn` or `additionalInfoPl` based on `userLanguage`)
2. User types: `additionalInfo` state updates on each keystroke
3. User clicks Save: `isSaving` set to `true`, API call initiated
4. On success: `isSaving` set to `false`, `saveSuccess` set to `true`, `saveError` cleared
5. On error: `isSaving` set to `false`, `saveError` set to error message, `saveSuccess` cleared
6. Success alert auto-dismisses after 3 seconds or on user click
7. Error alert dismisses on user click

**Language Synchronization**:
- The component displays the additional information in the user's current dashboard language
- When the user changes their language preference (via LanguageSelector), the AccountProfile component should re-fetch preferences or receive updated props
- The textarea always shows the content in the user's selected language

## 7. API Integration

### New API Endpoint: PUT /api/user-preferences/additional-info

**Endpoint**: `PUT /api/user-preferences/additional-info`

**Authentication**: Required (Authorization: Bearer <SUPABASE_JWT>)

**Request Body**:
```typescript
{
  additional_info: string;
  language: "en" | "pl";
}
```

**Response** (200 OK):
```typescript
{
  additional_info_en: string | null;
  additional_info_pl: string | null;
}
```

**Error Responses**:
- `400 Bad Request`: Validation failed (e.g., additional_info exceeds 2000 characters)
- `401 Unauthorized`: User is not authenticated
- `500 Internal Server Error`: Database or translation service failure
- `502 Bad Gateway`: Error communicating with translation service (OpenRouter)

**Implementation Details**:
1. Validate request body (Zod schema)
2. Extract authenticated user from request
3. Determine target language for translation (opposite of provided language)
4. Call OpenRouter API to translate the provided text to the target language
5. Store both translations in `user_preferences` table
6. Return both translations in response

### Enhanced API Endpoint: GET /api/user-preferences

**Endpoint**: `GET /api/user-preferences` (existing, enhanced)

**Authentication**: Required

**Response** (200 OK) - Enhanced:
```typescript
{
  language: "en" | "pl";
  theme: Theme;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  ai_model: string | null;
  additional_info_en: string | null; // NEW
  additional_info_pl: string | null; // NEW
}
```

**Implementation Details**:
- Extend existing `getAllUserPreferences` service function to include `additional_info_en` and `additional_info_pl` fields
- Update database query to select these new fields

### API Client Functions

**New Client Function**: `userPreferencesApi.updateAdditionalInfo`

```typescript
async updateAdditionalInfo(command: UpdateAdditionalInfoCommand): Promise<AdditionalInfoResponseDto>
```

**Implementation**:
- Uses `getAuthHeaders()` for authentication
- Sends PUT request to `/api/user-preferences/additional-info`
- Handles 401 errors with redirect to login
- Returns parsed response or throws error

## 8. User Interactions

### Interaction 1: View Additional Information

**Interaction**: User navigates to `/app/account` and views the Additional Information section.

**Expected Outcome**: 
- The Additional Information card is displayed
- The textarea shows the current additional information in the user's selected dashboard language
- If no additional information exists, the textarea is empty
- Helper text explains that this information will be included in all AI conversations

**Implementation**:
- Server-side: Fetch user preferences including `additional_info_en` and `additional_info_pl`
- Pass both translations and `userLanguage` to AccountProfile component
- Component initializes `additionalInfo` state from the appropriate translation based on `userLanguage`

### Interaction 2: Edit Additional Information

**Interaction**: User types or modifies text in the Additional Information textarea.

**Expected Outcome**:
- Textarea updates in real-time as user types
- Character count (if displayed) updates
- No validation errors shown during typing (only on blur/submit)

**Implementation**:
- React Hook Form or controlled input with `onChange` handler
- Update `additionalInfo` state on each keystroke
- Optional: Display character count (e.g., "150/2000 characters")

### Interaction 3: Save Additional Information

**Interaction**: User clicks the "Save" button after entering/modifying additional information.

**Expected Outcome**:
- Button shows loading state ("Saving...")
- API call is made with the current text and user's language
- On success: Success alert appears, button returns to normal state
- On error: Error alert appears with error message, button returns to normal state
- Translation is automatically generated and stored

**Implementation**:
1. Validate input (trim whitespace, check max length)
2. Set `isSaving` to `true`
3. Call `userPreferencesApi.updateAdditionalInfo({ additional_info: trimmedValue, language: userLanguage })`
4. On success: Update state, show success message
5. On error: Show error message, keep current text in textarea

### Interaction 4: Language Change with Additional Information

**Interaction**: User changes their dashboard language while on the account page (or returns to account page after changing language).

**Expected Outcome**:
- The Additional Information textarea updates to show the translation in the new language
- If translation doesn't exist, shows empty or the original language version
- User can edit in the new language

**Implementation**:
- Component receives updated `userLanguage` prop (or re-fetches preferences)
- Updates `additionalInfo` state to show the appropriate translation
- If user saves in new language, both translations are updated

### Interaction 5: Use Additional Information in AI Conversations

**Interaction**: User starts a new AI conversation or sends a message in an existing conversation.

**Expected Outcome**:
- The additional information is automatically included in the AI conversation
- For new sessions: Included in the system prompt
- For follow-up messages: Included in the context (if needed)

**Implementation**:
- When creating AI session: Fetch user's additional information in the conversation language
- Append to system prompt or include as a separate context section
- Format: "Additional Information: [translated content]" or similar

## 9. Conditions and Validation

### Client-Side Validation

**Additional Information Field**:
- **Optional**: Field can be empty (no required validation)
- **Maximum Length**: 2000 characters
  - Validation message: "Additional information cannot exceed 2000 characters"
  - Triggers on blur and form submission
- **Whitespace Handling**: Leading and trailing whitespace is trimmed before validation and saving
- **Empty String Handling**: Empty string after trimming is treated as "no additional information" (null in database)

### Server-Side Validation

**Request Body Validation** (Zod schema):
```typescript
const updateAdditionalInfoSchema = z.object({
  additional_info: z.string().max(2000, "Additional information cannot exceed 2000 characters").trim(),
  language: z.enum(["en", "pl"], {
    errorMap: () => ({ message: "Language must be 'en' or 'pl'" })
  })
});
```

**Validation Rules**:
- `additional_info`: Required string, max 2000 characters, trimmed
- `language`: Required, must be "en" or "pl"

### Business Logic Conditions

**Translation Generation**:
- Translation is only generated if `additional_info` is not empty after trimming
- If `additional_info` is empty, both `additional_info_en` and `additional_info_pl` are set to `null`
- Translation uses OpenRouter API with the same model as AI conversations (or a dedicated translation model)
- Translation prompt: "Translate the following text from [source_language] to [target_language]. Preserve the meaning and tone exactly: [text]"

**AI Conversation Integration**:
- Additional information is only included if it exists (not null)
- The translation matching the conversation language is used
- If translation doesn't exist for the conversation language, fall back to the other language
- Format: Added as a separate section in the system prompt: "\n\nAdditional Context from User:\n[additional_info]"

**Access Control**:
- Only authenticated users can view/edit additional information
- Users can only view/edit their own additional information (enforced by RLS)

## 10. Error Handling

### Validation Errors

**Client-Side**:
- Display inline error message below textarea
- Error message: "Additional information cannot exceed 2000 characters"
- Prevent form submission if validation fails
- Error clears when user fixes the issue

**Server-Side**:
- Return `400 Bad Request` with validation error details
- Error response format:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": ["additional_info"],
      "message": "Additional information cannot exceed 2000 characters"
    }
  ]
}
```

### API Errors

**401 Unauthorized**:
- Client: Redirect to `/auth/login`
- Server: Return 401 with error message

**500 Internal Server Error**:
- Client: Display user-friendly error message: "Failed to save additional information. Please try again."
- Server: Log error details, return generic error message
- Common causes: Database connection failure, RLS policy violation

**502 Bad Gateway** (Translation Service Failure):
- Client: Display error message: "Failed to translate additional information. Please try again."
- Server: Log OpenRouter API error
- Fallback behavior: Store the provided text in the user's language only, set the other language to null
- Optionally: Allow user to retry translation later

### Network Errors

**Request Timeout**:
- Client: Display error: "Request timed out. Please check your connection and try again."
- Allow user to retry

**Network Failure**:
- Client: Display error: "Network error. Please check your connection and try again."
- Allow user to retry

### Edge Cases

**Empty Additional Information**:
- If user clears all text and saves: Both translations set to `null`
- No error, success message still shown

**Translation Failure with Non-Empty Text**:
- Store the provided text in the user's language
- Set the other language to `null`
- Show warning message: "Additional information saved, but translation failed. You can try again later."
- Allow user to manually trigger re-translation

**Language Mismatch**:
- If user's language preference changes between page load and save:
  - Use the language from the form submission (current UI state)
  - Update both translations accordingly

**Concurrent Edits**:
- Last write wins (standard database behavior)
- No explicit locking needed for this use case

## 11. Database Schema Changes

### user_preferences Table - New Columns

Add two new columns to the `user_preferences` table:

```sql
ALTER TABLE user_preferences
ADD COLUMN additional_info_en TEXT,
ADD COLUMN additional_info_pl TEXT;
```

**Column Details**:
- `additional_info_en`: Stores the English translation of the user's additional information. Nullable.
- `additional_info_pl`: Stores the Polish translation of the user's additional information. Nullable.

**Constraints**:
- Both columns are nullable (user may not have set additional information)
- No length constraint at database level (handled by application validation)
- No default values

**Indexes**: No additional indexes needed (user_preferences table already has user_id index)

**RLS Policies**: No changes needed (existing RLS policies on user_preferences table apply)

## 12. Translation Service Integration

### OpenRouter Translation Function

Create a new service function for translation:

**Location**: `src/lib/ai/translation.service.ts` (new file)

**Function**:
```typescript
async function translateText(
  text: string,
  sourceLanguage: "en" | "pl",
  targetLanguage: "en" | "pl",
  model?: string
): Promise<string>
```

**Implementation**:
1. Use OpenRouterService to call AI model
2. System prompt: "You are a professional translator. Translate the following text from [source] to [target]. Preserve the exact meaning, tone, and formatting. Only return the translated text, no explanations."
3. User message: The text to translate
4. Parse response and return translated text
5. Handle errors and retries

**Error Handling**:
- If translation fails, throw `OpenRouterError`
- Allow caller to handle fallback (store original text only)

### Integration with AI Session Service

Modify `formatSystemPrompt` function in `src/lib/ai/session.service.ts`:

**Enhancement**:
- Accept optional `additionalInfo: string | null` parameter
- If `additionalInfo` is provided, append to system prompt:
  ```
  \n\nAdditional Context from User:\n[additionalInfo]
  ```

**Usage in Session Creation**:
1. Fetch user's additional information in conversation language
2. Pass to `formatSystemPrompt` function
3. Include in system message sent to OpenRouter

## 13. Implementation Steps

### Step 1: Database Schema Update

1. Create migration file to add `additional_info_en` and `additional_info_pl` columns to `user_preferences` table
2. Run migration in development environment
3. Update `database.types.ts` (regenerate from Supabase or manually update)
4. Test database changes

### Step 2: Create Translation Service

1. Create `src/lib/ai/translation.service.ts`
2. Implement `translateText` function using OpenRouterService
3. Add error handling and retry logic
4. Write unit tests for translation service
5. Test with sample translations

### Step 3: Update Types

1. Add `AdditionalInfoFormData`, `AdditionalInfoResponseDto`, `UpdateAdditionalInfoCommand` to `src/types.ts`
2. Enhance `GetUserPreferencesResponseDto` and `UpdatePreferencesResponseDto` types
3. Update `AccountProfileProps` interface
4. Ensure all types are properly exported

### Step 4: Create API Endpoint

1. Create `src/pages/api/user-preferences/additional-info.ts`
2. Implement PUT handler with validation
3. Integrate translation service
4. Update database with both translations
5. Add error handling (401, 400, 500, 502)
6. Write unit tests for API endpoint
7. Test API with Postman/curl

### Step 5: Enhance User Preferences Service

1. Update `getAllUserPreferences` in `src/lib/user-preferences/user-preference.service.ts` to include additional info fields
2. Test service function
3. Update existing API endpoint `GET /api/user-preferences` to return additional info

### Step 6: Create API Client Function

1. Add `updateAdditionalInfo` to `src/lib/api/user-preferences.client.ts`
2. Implement error handling (401 redirect)
3. Test client function

### Step 7: Enhance AccountProfile Component

1. Add new state variables for additional information management
2. Add Additional Information Card section to JSX
3. Implement form handling with React Hook Form or controlled input
4. Add save functionality with API call
5. Add success/error alert components
6. Implement character count display (optional)
7. Handle language changes
8. Test component in isolation

### Step 8: Update Account Page

1. Update `src/pages/app/account.astro` to fetch additional information
2. Pass new props to AccountProfile component
3. Test server-side data fetching

### Step 9: Integrate with AI Conversations

1. Update `AiSessionService.createSession` to fetch user's additional information
2. Modify `formatSystemPrompt` to accept and include additional information
3. Update `formatUserPrompt` if needed (or keep in system prompt only)
4. Test AI conversations with additional information
5. Verify additional information appears in AI responses appropriately

### Step 10: Add Translations

1. Add translation keys to `src/lib/i18n/translations/en.json`:
   - `account.additionalInfo`
   - `account.additionalInfoLabel`
   - `account.additionalInfoHelper`
   - `account.additionalInfoSave`
   - `account.additionalInfoSaveSuccess`
   - `account.additionalInfoSaveError`
   - `account.additionalInfoTranslationError`
2. Add Polish translations to `src/lib/i18n/translations/pl.json`
3. Test translations in UI

### Step 11: Testing

1. **Unit Tests**:
   - Translation service tests
   - API endpoint tests
   - Component tests (form validation, API calls)
   - Service function tests

2. **Integration Tests**:
   - Full flow: Edit additional info → Save → Verify translation → Use in AI conversation
   - Language switching: Change language → Verify correct translation displayed
   - Error scenarios: Translation failure, network errors, validation errors

3. **E2E Tests** (Playwright):
   - Navigate to account page
   - Enter additional information
   - Save and verify success message
   - Start AI conversation and verify additional info is included
   - Change language and verify translation

### Step 12: Documentation and Cleanup

1. Update project documentation if needed
2. Add JSDoc comments to new functions
3. Review and fix any linter errors
4. Ensure accessibility (ARIA labels, keyboard navigation)
5. Test responsive design on mobile devices

## 14. Testing Strategy

### Unit Tests

**Translation Service**:
- Test successful translation (EN → PL, PL → EN)
- Test error handling (API failure, timeout)
- Test empty string handling
- Test special characters and formatting preservation

**API Endpoint**:
- Test successful save with translation
- Test validation errors (max length, invalid language)
- Test 401 unauthorized
- Test translation failure (502) with fallback
- Test empty string handling (sets both to null)

**Component**:
- Test form validation (max length)
- Test save button click and API call
- Test success/error state display
- Test language switching

### Integration Tests

**Full User Flow**:
1. User sets additional info in English
2. Verify Polish translation is generated and stored
3. User changes language to Polish
4. Verify Polish translation is displayed
5. User modifies text in Polish
6. Verify English translation is updated
7. Start AI conversation
8. Verify additional info is included in system prompt

**Error Scenarios**:
1. Translation service failure → Verify fallback behavior
2. Network error during save → Verify error message
3. Validation error → Verify inline error display

### E2E Tests (Playwright)

**Test Case 1: Add Additional Information**
- Navigate to `/app/account`
- Find Additional Information section
- Enter text in textarea
- Click Save button
- Verify success message
- Verify text is saved

**Test Case 2: Edit Additional Information**
- Navigate to `/app/account` with existing additional info
- Modify text in textarea
- Click Save
- Verify success message
- Verify changes are saved

**Test Case 3: Language Switching**
- Set additional info in English
- Change language to Polish
- Verify Polish translation is displayed
- Edit in Polish
- Save and verify both translations updated

**Test Case 4: AI Conversation Integration**
- Set additional information
- Navigate to dashboard
- Start new AI conversation
- Verify additional info is included (check system prompt or AI response context)

## 15. Accessibility Considerations

- **Textarea Label**: Properly associated with `<Label>` using `htmlFor` and `id`
- **Helper Text**: Descriptive text explaining the feature's purpose
- **Error Messages**: Associated with form field using `aria-describedby`
- **Success Messages**: Use `role="alert"` for screen reader announcements
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Focus Management**: Focus moves to success/error alerts when they appear
- **Character Count**: If displayed, use `aria-live="polite"` for screen readers

## 16. Responsive Design

- **Mobile**: Textarea and button stack vertically, full width
- **Tablet**: Maintain card layout, comfortable spacing
- **Desktop**: Standard card layout with adequate spacing
- **Textarea**: Responsive width, appropriate min-height for multi-line input

## 17. Performance Considerations

- **Translation API Call**: Async operation, doesn't block UI
- **Debouncing**: Consider debouncing save operation if auto-save is implemented (not in initial version)
- **Caching**: User preferences (including additional info) can be cached on client-side
- **Lazy Loading**: Translation service only loaded when needed

## 18. Security Considerations

- **Input Sanitization**: Additional information is stored as-is (trusted user input)
- **XSS Prevention**: React automatically escapes content, but ensure no HTML injection in AI prompts
- **RLS**: Database Row-Level Security ensures users can only access their own additional information
- **Rate Limiting**: Consider rate limiting on translation API calls to prevent abuse

## 19. Future Enhancements (Out of Scope)

- Auto-save functionality (save as user types)
- Rich text editor for additional information
- Support for more languages
- Version history of additional information changes
- Per-conversation additional information (override global setting)
- Import/export additional information
- Templates for common additional information patterns

