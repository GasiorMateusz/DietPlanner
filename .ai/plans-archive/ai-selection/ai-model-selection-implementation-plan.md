# Feature Implementation Plan: AI Model Selection

## 1. Overview

The AI Model Selection feature enables users to choose their preferred AI model for generating meal plans from a dropdown in the My Account view. The selected model is stored in user preferences and used for all AI conversations. Each model displays its combined price (calculated with output-weighted formula) and power ranking to help users make informed choices. The default model is GPT-4.1 Nano.

**Key Functionality:**
- Users can select from 10 available AI models in a dropdown
- Each model displays: name, combined price ($), and power ranking
- Selection is saved when user clicks "Save" button
- Selected model is used for all AI chat sessions
- Default model is "openai/gpt-4.1-nano" (GPT-4.1 Nano)

**Integration Points:**
- Database: Add `ai_model` field to `user_preferences` table
- UI: Model selection dropdown in AccountProfile component
- AI Service: Modified session service to use user's selected model
- API: Updated user preferences endpoints to handle model selection

## 2. View Routing

- **Path**: `/app/account` (existing)
- **Layout**: Private Layout (existing)
- **Access Control**: Requires authentication (existing)
- **Navigation**: Accessible via "My Account" in the navigation bar (existing)

## 3. Component Structure

```
AccountProfile (React)
├── Account Information Card (existing)
├── AI Model Selection Card (NEW)
│   ├── Select (shadcn/ui)
│   │   └── SelectItem (for each model)
│   └── Button (Save button)
├── Terms and Privacy Policy Card (existing)
├── Account Management Card (existing)
└── Legal Information Card (existing)
```

## 4. Component Details

### AccountProfile Component (Modified)

**Location**: `src/components/account/AccountProfile.tsx`

**New Elements**:
- AI Model Selection Card with:
  - Card title: "AI Model Selection"
  - Select dropdown showing all available models
  - Each option displays: Model name, combined price ($), and power ranking
  - Save button to persist selection
  - Loading state during save
  - Success/error feedback
  - Disabled state for Save button when no changes made

**New Interactions**:
- User selects a model from dropdown
- Save button becomes enabled when selection differs from saved preference
- User clicks Save button → Selection is saved to user preferences
- Success toast notification on save
- Error handling with user-friendly messages
- Save button disabled after successful save

**Props**: No changes (existing props remain)

## 5. Types

### Database Types

**Location**: `src/db/database.types.ts`

Add `ai_model` field to `user_preferences` table:
- Type: `string | null`
- Stores OpenRouter model identifier (e.g., "openai/gpt-4.1-nano")

### Application Types

**Location**: `src/types.ts`

```typescript
/**
 * Available AI models with their metadata
 */
export interface AiModel {
  id: string; // OpenRouter model identifier (e.g., "openai/gpt-4.1-nano")
  name: string; // Display name
  provider: string; // Provider name (e.g., "Google", "OpenAI")
  inputPrice: number; // Price per 1M input tokens
  outputPrice: number; // Price per 1M output tokens
  combinedPrice: number; // Calculated combined price using formula: (inputPrice * 0.2) + (outputPrice * 0.8)
  powerRank: number; // Power ranking (1-10, where 1 is highest power)
}

/**
 * DTO for getting AI model preference
 */
export interface GetAiModelPreferenceResponseDto {
  model: string; // OpenRouter model identifier
}

/**
 * DTO for updating AI model preference
 */
export interface UpdateAiModelPreferenceCommand {
  model: string; // OpenRouter model identifier
}
```

### Validation Schemas

**Location**: `src/lib/validation/user-preferences.schemas.ts`

Add validation for AI model:
```typescript
export const updateAiModelPreferenceSchema = z.object({
  model: z.string().min(1, "Model is required"),
});

export const getAllPreferencesResponseSchema = z.object({
  // ... existing fields
  ai_model: z.string().nullable(),
});
```

## 6. State Management

- **Local State**: `useState` for:
  - Selected model (temporary selection)
  - Saved model (current saved preference)
  - Loading state during save
  - Error state
- **Form State**: Not needed (simple select dropdown)
- **State Flow**:
  1. Component mounts → Fetch current model preference → Set saved model
  2. User selects model from dropdown → Update selected model → Enable Save button
  3. User clicks Save → Set loading state → Call API to save
  4. API success → Update saved model → Disable Save button → Show success toast
  5. API error → Show error message → Keep Save button enabled for retry

## 7. API Integration

### Modified API Endpoints

**Location**: `src/pages/api/user-preferences/index.ts`

**GET /api/user-preferences** (Modified)
- Add `ai_model` field to response
- Returns current model preference or default ("openai/gpt-4.1-nano")

**PUT /api/user-preferences** (Modified)
- Accept `ai_model` in request body
- Update user preference with new model
- Validate model identifier exists in available models list

### Service Layer

**Location**: `src/lib/user-preferences/user-preference.service.ts`

**New Functions**:
- `getAiModelPreference(userId, supabase)`: Get user's AI model preference
- `updateAiModelPreference(userId, model, supabase)`: Update user's AI model preference
- `getAllUserPreferences()`: Modified to include `ai_model` field

### Client API

**Location**: `src/lib/api/user-preferences.client.ts`

**New Functions**:
- `getAiModelPreference()`: Fetch current model preference
- `updateAiModelPreference(model)`: Update model preference
- `getAllPreferences()`: Modified to include `ai_model` in response

## 8. AI Model Configuration

### Model Definitions

**Location**: `src/lib/ai/models.config.ts` (NEW)

Define all available models with their metadata. Models are ordered by price (cheapest first):

```typescript
import type { AiModel } from "../../types.ts";

/**
 * Available AI models with their metadata.
 * Models are ordered by price (cheapest first).
 */
export const AVAILABLE_AI_MODELS: AiModel[] = [
  {
    id: "google/gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    provider: "Google",
    inputPrice: 0.10,
    outputPrice: 0.40,
    combinedPrice: (0.10 * 0.2) + (0.40 * 0.8), // 0.34
    powerRank: 4,
  },
  {
    id: "openai/gpt-4.1-nano",
    name: "GPT-4.1 Nano",
    provider: "OpenAI",
    inputPrice: 0.10,
    outputPrice: 0.40,
    combinedPrice: (0.10 * 0.2) + (0.40 * 0.8), // 0.34
    powerRank: 5.5,
  },
  {
    id: "meta-llama/llama-4-scout",
    name: "Llama 4 Scout",
    provider: "Meta",
    inputPrice: 0.18,
    outputPrice: 0.59,
    combinedPrice: (0.18 * 0.2) + (0.59 * 0.8), // 0.508
    powerRank: 7,
  },
  {
    id: "xai/grok-code-fast-1",
    name: "Grok Code Fast 1",
    provider: "xAI",
    inputPrice: 0.20,
    outputPrice: 1.50,
    combinedPrice: (0.20 * 0.2) + (1.50 * 0.8), // 1.24
    powerRank: 1,
  },
  {
    id: "openai/gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "OpenAI",
    inputPrice: 0.25,
    outputPrice: 2.00,
    combinedPrice: (0.25 * 0.2) + (2.00 * 0.8), // 1.65
    powerRank: 9,
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    inputPrice: 0.30,
    outputPrice: 2.50,
    combinedPrice: (0.30 * 0.2) + (2.50 * 0.8), // 2.06
    powerRank: 3,
  },
  {
    id: "openai/gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "OpenAI",
    inputPrice: 0.40,
    outputPrice: 1.60,
    combinedPrice: (0.40 * 0.2) + (1.60 * 0.8), // 1.36
    powerRank: 6,
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o-mini",
    provider: "OpenAI",
    inputPrice: 0.60,
    outputPrice: 2.40,
    combinedPrice: (0.60 * 0.2) + (2.40 * 0.8), // 2.04
    powerRank: 5,
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "Anthropic",
    inputPrice: 3.00,
    outputPrice: 15.00,
    combinedPrice: (3.00 * 0.2) + (15.00 * 0.8), // 12.6
    powerRank: 8,
  },
  {
    id: "anthropic/claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    inputPrice: 3.00,
    outputPrice: 15.00,
    combinedPrice: (3.00 * 0.2) + (15.00 * 0.8), // 12.6
    powerRank: 2,
  },
];

/**
 * Default AI model used when user has no preference set.
 */
export const DEFAULT_AI_MODEL = "openai/gpt-4.1-nano";

/**
 * Gets an AI model by its OpenRouter identifier.
 * @param modelId - The OpenRouter model identifier
 * @returns The AI model or undefined if not found
 */
export function getModelById(modelId: string): AiModel | undefined {
  return AVAILABLE_AI_MODELS.find((model) => model.id === modelId);
}

/**
 * Validates if a model ID exists in the available models list.
 * @param modelId - The OpenRouter model identifier to validate
 * @returns True if the model exists, false otherwise
 */
export function isValidModelId(modelId: string): boolean {
  return AVAILABLE_AI_MODELS.some((model) => model.id === modelId);
}
```

**Price Calculation Formula:**
The combined price uses a weighted formula that emphasizes output tokens since AI generates significantly more text than user input:
```
combinedPrice = (inputPrice * 0.2) + (outputPrice * 0.8)
```

This reflects typical usage where:
- User sends relatively short prompts (20% weight on input)
- AI generates long meal plans with detailed recipes (80% weight on output)

### OpenRouter Service Integration

**Location**: `src/lib/ai/session.service.ts`

**Modifications**:
- `createSession()`: Accept optional `model` parameter, fetch user preference if not provided
- `sendMessage()`: Accept optional `model` parameter, fetch user preference if not provided
- Add helper function `getUserAiModelPreference(userId, supabase)` to fetch model from preferences

**Location**: `src/pages/api/ai/sessions.ts`

**Modifications**:
- Extract user ID from request
- Fetch user's AI model preference
- Pass model to `createSession()` and `sendMessage()` functions

## 9. User Interactions

### Model Selection

**Interaction**: User clicks dropdown and selects a model
**Expected Outcome**: 
- Dropdown shows selected model
- Save button becomes enabled (if different from saved preference)
- Model details (price, power) are visible in dropdown

**Implementation**:
- Use shadcn/ui Select component
- Display format: "Model Name (by Provider) - $X.XX - Power: Y"
- On selection change, update local state and enable Save button

### Save Selection

**Interaction**: User clicks "Save" button
**Expected Outcome**: 
- Selection is saved to user preferences
- Success toast appears
- Save button becomes disabled
- Model is used for next AI conversation

**Implementation**:
- Call `updateAiModelPreference()` API
- Show loading state during save
- Display success/error feedback
- Update saved model state on success

### Display Format

Each model option in dropdown shows:
- Model name (e.g., "Gemini 2.5 Flash Lite")
- Provider in parentheses (e.g., "by Google")
- Combined price: "$X.XX" (formatted to 2 decimal places)
- Power ranking: "Power: X" (where X is rank 1-10)

Example display: "Gemini 2.5 Flash Lite (by Google) - $0.34 - Power: 4"

## 10. Conditions and Validation

### Client-Side Validation
- Model must be selected (dropdown prevents empty selection)
- Model identifier must exist in `AVAILABLE_AI_MODELS` list
- Save button only enabled when selection differs from saved preference

### Server-Side Validation
- Model identifier must be a non-empty string
- Model identifier must exist in available models list (using `isValidModelId()`)
- User must be authenticated

### Default Behavior
- If user has no model preference, use `DEFAULT_AI_MODEL` ("openai/gpt-4.1-nano")
- If model preference is invalid/removed, fall back to default
- If model preference fetch fails, use default model (log warning in dev mode)

## 11. Error Handling

### API Errors
- **400 Bad Request**: Invalid model identifier → Show error message, keep Save button enabled for retry
- **401 Unauthorized**: Session expired → Redirect to login
- **500 Internal Server Error**: Database error → Show generic error message, log details

### Edge Cases
- Model preference fetch fails → Use default model, show warning in dev mode
- Model identifier no longer available → Fall back to default, show notification to user
- Network error during save → Show error message, keep Save button enabled for retry
- User selects same model → Save button remains disabled

### User Feedback
- Success: Toast notification "AI model updated successfully"
- Error: Inline error message below Save button
- Loading: Disable Save button and show loading spinner during save operation

## 12. Database Migration

**Location**: `supabase/migrations/[timestamp]_add_ai_model_preference.sql`

```sql
-- Add ai_model column to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN ai_model TEXT;

-- Set default for existing users
UPDATE user_preferences 
SET ai_model = 'openai/gpt-4.1-nano' 
WHERE ai_model IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN user_preferences.ai_model IS 'OpenRouter model identifier for AI conversations (e.g., openai/gpt-4.1-nano)';
```

## 13. Translations

**Location**: `src/lib/i18n/translations/en.json` and `pl.json`

Add translation keys:
```json
{
  "account": {
    "aiModelSelection": "AI Model Selection",
    "selectModel": "Select AI Model",
    "modelPrice": "Price",
    "modelPower": "Power",
    "saveModel": "Save",
    "modelSaved": "AI model updated successfully",
    "modelSaveError": "Failed to save AI model selection",
    "modelLoading": "Saving...",
    "modelDefault": "Default: GPT-4.1 Nano"
  }
}
```

## 14. Implementation Steps

1. **Create model configuration file** (`src/lib/ai/models.config.ts`)
   - Define all 10 models with metadata
   - Calculate combined prices using formula: (inputPrice * 0.2) + (outputPrice * 0.8)
   - Export `AVAILABLE_AI_MODELS` array and `DEFAULT_AI_MODEL` constant
   - Add helper functions `getModelById()` and `isValidModelId()`

2. **Create database migration**
   - Add `ai_model` column to `user_preferences` table
   - Set default value for existing users
   - Add column comment

3. **Update database types** (`src/db/database.types.ts`)
   - Add `ai_model` field to `user_preferences` Row, Insert, Update types

4. **Update validation schemas** (`src/lib/validation/user-preferences.schemas.ts`)
   - Add `ai_model` validation to existing schemas
   - Create model validation helper function using `isValidModelId()`

5. **Update user preference service** (`src/lib/user-preferences/user-preference.service.ts`)
   - Add `getAiModelPreference()` function
   - Add `updateAiModelPreference()` function
   - Modify `getAllUserPreferences()` to include `ai_model`
   - Modify `updateUserPreferences()` to handle `ai_model`

6. **Update API endpoint** (`src/pages/api/user-preferences/index.ts`)
   - Add `ai_model` to GET response
   - Add `ai_model` to PUT request validation
   - Validate model identifier against available models using `isValidModelId()`

7. **Update client API** (`src/lib/api/user-preferences.client.ts`)
   - Add `getAiModelPreference()` function
   - Add `updateAiModelPreference()` function
   - Update `getAllPreferences()` to include `ai_model`

8. **Update types** (`src/types.ts`)
   - Add `AiModel` interface
   - Add `GetAiModelPreferenceResponseDto` interface
   - Add `UpdateAiModelPreferenceCommand` interface

9. **Update AccountProfile component** (`src/components/account/AccountProfile.tsx`)
   - Add AI Model Selection Card
   - Add Select dropdown with all models
   - Format display: "Model Name (by Provider) - $X.XX - Power: Y"
   - Add Save button (disabled when no changes)
   - Implement save on button click
   - Add loading and error states
   - Add success toast notification

10. **Update session service** (`src/lib/ai/session.service.ts`)
    - Add `getUserAiModelPreference()` helper function
    - Modify `createSession()` to accept and use model parameter
    - Modify `sendMessage()` to accept and use model parameter
    - Fetch user preference if model not provided

11. **Update AI sessions API** (`src/pages/api/ai/sessions.ts`)
    - Fetch user's AI model preference
    - Pass model to `createSession()` and `sendMessage()` functions

12. **Update OpenRouter service** (`src/lib/ai/openrouter.service.ts`)
    - Keep `DEFAULT_AI_MODEL` constant for fallback
    - Ensure model parameter in `getChatCompletion()` works correctly
    - Update comment to reference user preferences

13. **Add translations** (`src/lib/i18n/translations/en.json` and `pl.json`)
    - Add keys for AI model selection UI
    - Add model names and descriptions

14. **Test implementation**
    - Test model selection and persistence
    - Test Save button enable/disable logic
    - Test model usage in AI conversations
    - Test error handling and edge cases
    - Test with existing user preferences
    - Test default model fallback
    - Test price calculation accuracy
    - Test power ranking display

## 15. Files to Create/Modify

### New Files
- `src/lib/ai/models.config.ts` - Model definitions and configuration
- `supabase/migrations/[timestamp]_add_ai_model_preference.sql` - Database migration

### Modified Files
- `src/components/account/AccountProfile.tsx` - Add model selection UI
- `src/db/database.types.ts` - Add `ai_model` field
- `src/lib/validation/user-preferences.schemas.ts` - Add model validation
- `src/lib/user-preferences/user-preference.service.ts` - Add model preference functions
- `src/pages/api/user-preferences/index.ts` - Add model to API
- `src/lib/api/user-preferences.client.ts` - Add model client functions
- `src/types.ts` - Add model-related types
- `src/lib/ai/session.service.ts` - Use user's model preference
- `src/pages/api/ai/sessions.ts` - Pass model to session functions
- `src/lib/ai/openrouter.service.ts` - Update comments
- `src/lib/i18n/translations/en.json` - Add translations
- `src/lib/i18n/translations/pl.json` - Add translations

## 16. Testing Considerations

### Unit Tests
- Test `getModelById()` function
- Test `isValidModelId()` function
- Test combined price calculation formula
- Test model preference service functions
- Test validation schemas

### Integration Tests
- Test API endpoint with valid/invalid model IDs
- Test model preference persistence
- Test default model fallback

### E2E Tests
- Test model selection in AccountProfile
- Test Save button functionality
- Test model usage in AI conversation
- Test error handling scenarios

### Manual Testing
- Verify all 10 models appear in dropdown
- Verify price and power display correctly
- Verify Save button enable/disable logic
- Verify model is used in AI conversations
- Verify default model for new users
- Verify error messages are user-friendly

