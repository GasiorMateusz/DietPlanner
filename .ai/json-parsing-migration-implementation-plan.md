# JSON Parsing Migration Implementation Plan

## 1. Overview

### Feature Description

Migrate the AI conversation meal plan parsing system from XML format to JSON format. This change will improve parsing robustness, reduce fragility, and make the system more language-independent. The migration involves updating AI system prompts, creating a new JSON parser, and replacing all XML parsing logic with JSON parsing. This is a clean migration with no backward compatibility - all XML code will be removed.

### Purpose

The current XML parsing system uses regex-based extraction which is fragile and prone to failures when:
- AI returns unexpected XML tag variations
- XML tags are missing or malformed
- Language changes during conversation affect XML structure
- AI substitutes tags (e.g., `<item>` instead of expected tags)

**Migration Strategy**: Complete replacement of XML with JSON. No backward compatibility maintained - this is a clean migration.

JSON format provides:
- **Robustness**: Native JSON parsing with proper error handling
- **Language Independence**: JSON structure is consistent regardless of conversation language
- **Type Safety**: Better validation and type checking
- **Maintainability**: Easier to debug and extend
- **Simplicity**: Single format to maintain, no dual-parser complexity

### User Story

**As a dietitian**, I want the AI-generated meal plans to be parsed reliably regardless of language or AI response variations, so that I can consistently access and edit meal plans without parsing errors.

### Integration Points

This feature affects:
- AI system prompts (instruction format) - **Replace XML with JSON**
- Message parsing utilities - **Replace XML parser with JSON parser**
- Editor initialization (loading from AI chat) - **Update to use JSON parser**
- Chat interface (displaying meal plans) - **Update to handle JSON format**
- Error handling and validation - **Simplify (no format detection needed)**

---

## 2. View Routing

**Not Applicable** - This is a backend/utility change that doesn't create new views or routes.

---

## 3. Component Structure

```
No new components, but existing components are affected:

src/lib/ai/session.service.ts
└── formatSystemPrompt() - Replace XML instructions with JSON

src/lib/utils/meal-plan-parser.ts
├── parseXmlMealPlan() - REMOVE (no longer needed)
├── parseJsonMealPlan() - NEW: JSON parser (replaces XML parser)
├── extractComments() - Update to handle JSON comments only
└── removeJsonFromMessage() - NEW: Remove JSON structure for chat display

src/components/hooks/useMealPlanEditor.ts
└── loadMealPlanFromBridge() - Update to use JSON parser

src/lib/utils/chat-helpers.ts
└── extractCurrentMealPlan() - Update to use JSON parser
```

---

## 4. Component Details

### 4.1 `src/lib/ai/session.service.ts`

**Component Description**: Service for managing AI chat sessions. Contains system prompt formatting.

**Changes Required**:
- Update `formatSystemPrompt()` to request JSON format instead of XML
- Maintain language support (English/Polish)
- Define clear JSON schema structure in prompts

**Main Elements**:
- System prompt content (English and Polish versions)
- JSON schema specification in prompts

**Handled Interactions**:
- AI receives updated instructions to return JSON format only
- No backward compatibility needed - clean migration

**Types**:
- Uses existing `LanguageCode` type from `src/lib/i18n/types.ts`
- No new types required

### 4.2 `src/lib/utils/meal-plan-parser.ts`

**Component Description**: Utility functions for parsing meal plan data from AI messages.

**Changes Required**:
- Create `parseJsonMealPlan()` function (replaces `parseXmlMealPlan()`)
- Update `extractComments()` to handle JSON comments only
- Create `removeJsonFromMessage()` function (replaces `removeXmlTags()`)
- Remove all XML parsing code

**Main Elements**:
- `parseJsonMealPlan(message: string)` - Parses JSON meal plan structure
- `extractComments(message: string)` - Extracts comments from JSON
- `removeJsonFromMessage(message: string)` - Removes JSON structure for chat display
- Error handling for malformed JSON

**Handled Interactions**:
- Parses JSON format directly
- Provides detailed error messages for debugging
- No format detection needed (JSON only)

**Validation**:
- JSON syntax validation
- Schema validation (required fields, types)
- Graceful degradation on parse errors

**Types**:
- Returns existing types: `MealPlanMeal[]`, `MealPlanContentDailySummary`
- Uses existing types from `src/types.ts`

### 4.3 `src/components/hooks/useMealPlanEditor.ts`

**Component Description**: React hook for managing meal plan editor state.

**Changes Required**:
- Update `loadMealPlanFromBridge()` to use JSON parser
- Replace `parseXmlMealPlan()` import with `parseJsonMealPlan()`

**Main Elements**:
- `loadMealPlanFromBridge()` function
- Error handling for parsing failures

**Handled Interactions**:
- Loads meal plan from sessionStorage bridge
- Parses AI message (now supports both JSON and XML)
- Sets form state with parsed data

**Types**:
- Uses existing `StateBridge` interface
- Uses existing `MealPlanFormData` type

### 4.4 `src/lib/utils/chat-helpers.ts`

**Component Description**: Helper functions for chat message processing.

**Changes Required**:
- Update `extractCurrentMealPlan()` to use JSON parser
- Replace `parseXmlMealPlan()` import with `parseJsonMealPlan()`

**Main Elements**:
- `extractCurrentMealPlan()` function
- Validation logic

**Handled Interactions**:
- Extracts meal plan from message history (JSON format)
- Validates parsed meal plan structure

**Types**:
- Uses existing `ParsedMealPlan` type
- Uses existing `ChatMessage` type

---

## 5. Types

### 5.1 Existing Types (No Changes Required)

All existing types from `src/types.ts` remain unchanged:
- `MealPlanMeal`
- `MealPlanContentDailySummary`
- `MealPlanContent`
- `ChatMessage`
- `AssistantChatMessage`

### 5.2 JSON Schema Structure

The JSON structure that AI will return:

```typescript
interface JsonMealPlanResponse {
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
        protein: number; // Note: "protein" not "p" in JSON
        fat: number;     // Note: "fat" not "f" in JSON
        carb: number;   // Note: "carb" not "c" in JSON
      };
    }>;
  };
  comments?: string; // Optional comments field
}
```

**Note**: JSON uses full field names (`protein`, `fat`, `carb`) while internal types use short names (`p`, `f`, `c`). Parser must map between these.

---

## 6. State Management

**No State Management Changes Required**

The migration doesn't affect state management:
- Editor state remains the same (React Hook Form)
- Chat state remains the same
- Only the parsing layer changes

**State Flow**:
1. AI generates response (JSON format)
2. Response stored in database (as string, no change)
3. Editor loads response from bridge
4. Parser detects format and parses accordingly
5. Parsed data populates form state (same structure)

---

## 7. API Integration

### 7.1 AI System Prompts

**Endpoint**: Internal (OpenRouter API via `session.service.ts`)

**Changes**:
- Update `formatSystemPrompt()` to request JSON format
- Define JSON schema in prompt
- Maintain language-specific prompts (English/Polish)

**Request Format**: No change (still sends system/user messages to OpenRouter)

**Response Format**: AI will return JSON instead of XML

**Example JSON Response**:
```json
{
  "meal_plan": {
    "daily_summary": {
      "kcal": 2000,
      "proteins": 150,
      "fats": 65,
      "carbs": 200
    },
    "meals": [
      {
        "name": "Breakfast",
        "ingredients": "2 eggs, 1 slice bread, 1 tbsp butter",
        "preparation": "1. Scramble eggs\n2. Toast bread\n3. Serve",
        "summary": {
          "kcal": 400,
          "protein": 25,
          "fat": 20,
          "carb": 30
        }
      }
    ]
  },
  "comments": "This plan meets your requirements..."
}
```

### 7.2 Migration Strategy

**Strategy**: Complete replacement, no backward compatibility
- Remove all XML parsing code
- Update all references to use JSON parser
- AI prompts request JSON format only
- Clean, simple implementation with single format

---

## 8. User Interactions

### 8.1 No Direct User Interaction Changes

Users don't interact with the parsing system directly. The migration is transparent to users.

### 8.2 Indirect Benefits

**Improved Reliability**:
- **Interaction**: User accepts meal plan from AI chat
- **Expected Outcome**: Meal plan loads successfully in editor (more reliable than before)
- **Implementation**: JSON parser handles format robustly with native parsing

**Better Error Messages**:
- **Interaction**: Parsing fails (rare with JSON)
- **Expected Outcome**: Clear error message with specific field information
- **Implementation**: JSON parser provides detailed validation errors from `JSON.parse()`

---

## 9. Conditions and Validation

### 9.1 JSON Format Requirements

**Condition**: AI response must be valid JSON
**Validation**: 
- Message must contain valid JSON structure
- Must start with `{` or contain `"meal_plan"` key
- Must be parseable by `JSON.parse()`

### 9.2 JSON Validation

**Schema Validation**:
- `meal_plan` object must exist
- `daily_summary` must have: `kcal`, `proteins`, `fats`, `carbs` (all numbers > 0)
- `meals` must be non-empty array
- Each meal must have: `name` (non-empty string), `ingredients`, `preparation`, `summary`
- Each meal `summary` must have: `kcal` (> 0), `protein` (>= 0), `fat` (>= 0), `carb` (>= 0)

**Type Validation**:
- All numeric fields must be valid numbers
- String fields must be strings
- Arrays must be arrays

### 9.3 Error Conditions

**Condition**: JSON parsing fails (syntax error)
**Action**: Return structured error with details
**Validation**: Error must be user-friendly and actionable

**Condition**: JSON structure is invalid (missing fields)
**Action**: Return validation error with specific missing fields
**Validation**: Error must indicate which fields are missing or invalid

### 9.4 Field Name Mapping

**Condition**: JSON uses `protein`, `fat`, `carb` but types use `p`, `f`, `c`
**Action**: Map JSON field names to internal type field names
**Validation**: Ensure all mappings are correct

---

## 10. Error Handling

### 10.1 JSON Parsing Errors

**Error Type**: `SyntaxError` (malformed JSON)
**Handling**: 
- Catch `JSON.parse()` errors
- Log error details for debugging
- Fall back to XML parser
- If XML also fails, return structured error

**Error Message**: "Failed to parse meal plan. Please try regenerating."

### 10.2 Schema Validation Errors

**Error Type**: Missing required fields or invalid types
**Handling**:
- Validate structure after parsing
- Provide specific error messages (e.g., "Missing daily_summary.kcal")
- Fall back to XML parser
- Log validation errors for debugging

**Error Message**: "Meal plan structure is invalid. Missing required fields."

### 10.3 Format Errors

**Error Type**: Response is not valid JSON
**Handling**:
- Catch `JSON.parse()` errors
- Provide specific syntax error information
- Suggest regenerating meal plan

**Error Message**: "Invalid meal plan format. Please try regenerating the meal plan."

### 10.4 Error Display Priority

1. **Parsing Errors**: Show in editor with option to return to chat
2. **Validation Errors**: Show inline in editor (already implemented)
3. **Format Errors**: Show in chat interface with retry option

---

## 11. Implementation Steps

### Phase 1: Create JSON Parser (Foundation)

1. **Create `parseJsonMealPlan()` function**
   - File: `src/lib/utils/meal-plan-parser.ts`
   - Parse JSON structure using `JSON.parse()`
   - Map field names (`protein` → `p`, `fat` → `f`, `carb` → `c`)
   - Validate required fields
   - Handle optional `comments` field
   - Return `{ meals, dailySummary }` matching existing interface
   - Replace `parseXmlMealPlan()` function

2. **Add JSON schema validation**
   - Validate structure matches expected schema
   - Check all required fields exist
   - Validate types (numbers, strings, arrays)
   - Provide detailed error messages with field paths

3. **Update `extractComments()` function**
   - Handle JSON `comments` field only
   - Remove XML `<comments>` tag support
   - Return comments text or null

4. **Create `removeJsonFromMessage()` function**
   - Replace `removeXmlTags()` function
   - Extract and remove JSON structure for chat display
   - Preserve comments content
   - Return clean message text for display

5. **Remove XML parsing code**
   - Delete `parseXmlMealPlan()` function
   - Remove all XML-related regex patterns
   - Clean up XML-specific logic

### Phase 2: Update AI Prompts

6. **Update English system prompt**
   - File: `src/lib/ai/session.service.ts`
   - Replace XML instructions with JSON instructions
   - Define JSON schema clearly
   - Include example JSON structure
   - Maintain all requirements (nutritional targets, exclusions, etc.)

7. **Update Polish system prompt**
   - Same file, Polish version
   - Translate JSON instructions to Polish
   - Maintain consistency with English version

8. **Update user prompt reminders**
   - Update `formatUserPrompt()` to mention JSON format
   - Maintain language-specific versions

### Phase 3: Update Components

9. **Update `useMealPlanEditor.ts`**
   - File: `src/components/hooks/useMealPlanEditor.ts`
   - Replace `parseXmlMealPlan()` import with `parseJsonMealPlan()`
   - Update function call to use `parseJsonMealPlan()`
   - No other changes needed

10. **Update `chat-helpers.ts`**
    - File: `src/lib/utils/chat-helpers.ts`
    - Replace `parseXmlMealPlan()` import with `parseJsonMealPlan()`
    - Update function call to use `parseJsonMealPlan()`
    - Update validation logic if needed

11. **Update `AIChatInterface.tsx` (if needed)**
    - File: `src/components/AIChatInterface.tsx`
    - Replace `removeXmlTags()` with `removeJsonFromMessage()`
    - Update any XML-specific display logic

### Phase 4: Testing

12. **Unit Tests**
    - Test `parseJsonMealPlan()` with valid JSON
    - Test with malformed JSON (syntax errors)
    - Test with missing required fields (validation)
    - Test with invalid field types (type validation)
    - Test field name mapping (`protein` → `p`, `fat` → `f`, `carb` → `c`)
    - Test `extractComments()` with JSON `comments` field
    - Test `extractComments()` when comments field is missing
    - Test `removeJsonFromMessage()` function
    - Test error messages are user-friendly

13. **Integration Tests**
    - Test editor loading with JSON format
    - Test chat interface with JSON responses
    - Test error handling when JSON is invalid
    - Test error handling when JSON structure is incomplete

14. **E2E Tests**
    - Test full flow: AI chat → Editor with JSON
    - Test with English conversation
    - Test with Polish conversation
    - Test error scenarios (malformed JSON)
    - Test comments extraction and display

### Phase 5: Documentation and Cleanup

15. **Update code comments**
    - Document JSON format in parser functions
    - Update function JSDoc comments
    - Remove XML-related comments

16. **Update debug plan**
    - Mark JSON migration as complete in `.ai/meal-plan-validation-errors/debug-plan.md`
    - Document any issues found during migration

17. **Code cleanup**
    - Remove all XML-related code
    - Remove unused imports
    - Clean up test files (remove XML test cases)

---

## 12. Testing Strategy

### 12.1 Unit Tests

**File**: `src/test/unit/lib/utils/meal-plan-parser.test.ts`

**Test Cases**:
1. `parseJsonMealPlan()` with valid JSON
2. `parseJsonMealPlan()` with missing `meal_plan` field
3. `parseJsonMealPlan()` with missing `daily_summary` fields
4. `parseJsonMealPlan()` with empty `meals` array
5. `parseJsonMealPlan()` with invalid number types
6. `parseJsonMealPlan()` with field name mapping (`protein` → `p`)
7. `parseMealPlan()` detects JSON format
8. `parseMealPlan()` detects XML format
9. `parseMealPlan()` falls back to XML on JSON error
10. `extractComments()` with JSON `comments` field
11. `extractComments()` with XML `<comments>` tag

### 12.2 Integration Tests

**File**: `src/test/integration/lib/utils/meal-plan-parser.test.ts`

**Test Cases**:
1. Editor loads meal plan from JSON format
2. Editor loads meal plan from XML format (backward compatibility)
3. Chat helper extracts meal plan from JSON message
4. Error handling when both formats fail

### 12.3 E2E Tests

**File**: `src/test/e2e/meal-plan-creation.spec.ts`

**Test Cases**:
1. Create meal plan via AI chat (JSON format)
2. Accept and load in editor (JSON format)
3. Verify all fields populated correctly
4. Test with Polish language conversation
5. Test error recovery (regenerate on parse failure)

---

## 13. Migration Strategy

### 13.1 Clean Migration Approach

**Strategy**: Complete replacement, no backward compatibility
- Remove all XML code in one deployment
- AI prompts request JSON format only
- Parser handles JSON format only
- Simpler codebase, easier maintenance

### 13.2 Deployment Plan

**Phase 1**: Development and Testing
- Implement JSON parser
- Update all components
- Comprehensive testing
- Code review

**Phase 2**: Deployment
- Deploy JSON-only implementation
- Monitor parsing success rates
- Monitor error rates
- Quick response to any issues

**Phase 3**: Validation
- Validate JSON format adoption by AI (>99% expected)
- Monitor user experience
- Fix any edge cases
- Document lessons learned

### 13.3 Rollback Plan

**If Critical Issues Arise**:
- Revert to previous version (XML parser)
- This requires code deployment (not just config change)
- Should be rare given JSON's robustness
- Have rollback procedure documented

---

## 14. Success Criteria

### 14.1 Functional Requirements

- ✅ JSON parser successfully parses AI responses
- ✅ All existing functionality works with JSON format
- ✅ Error handling provides clear messages
- ✅ Field name mapping works correctly
- ✅ XML code completely removed

### 14.2 Quality Requirements

- ✅ Parsing success rate > 99% (improved from XML's ~95%)
- ✅ No regression in existing functionality
- ✅ All tests pass
- ✅ Code coverage maintained or improved

### 14.3 User Experience

- ✅ No visible changes to user workflow
- ✅ More reliable meal plan loading
- ✅ Better error messages when issues occur
- ✅ Works consistently across languages

---

## 15. Risk Assessment

### 15.1 Technical Risks

**Risk**: AI doesn't consistently return JSON format
- **Mitigation**: Clear prompts with JSON schema, validation, monitoring
- **Impact**: Medium (no fallback, but JSON is more reliable than XML)

**Risk**: JSON parsing introduces new bugs
- **Mitigation**: Comprehensive testing, code review, staged deployment
- **Impact**: Medium (affects core functionality)

**Risk**: Field name mapping errors
- **Mitigation**: Unit tests for all mappings, type checking
- **Impact**: Medium (data corruption possible)

### 15.2 Business Risks

**Risk**: User confusion during transition
- **Mitigation**: Transparent migration (no UI changes)
- **Impact**: Low (users don't see format)

**Risk**: Increased support requests
- **Mitigation**: Better error messages, monitoring
- **Impact**: Low (improved reliability should reduce requests)

---

## 16. Dependencies

### 16.1 No External Dependencies

- No new npm packages required (uses native `JSON.parse()`)
- No database changes required
- No API changes required

### 16.2 Internal Dependencies

- Depends on existing types in `src/types.ts`
- Depends on existing error handling utilities
- Depends on AI service in `src/lib/ai/session.service.ts`

---

## 17. Future Enhancements

### 17.1 JSON Schema Validation

**Future**: Use JSON Schema library for stricter validation
- More robust validation
- Better error messages
- Type inference
- Runtime schema validation

### 17.2 Streaming JSON Parsing

**Future**: Parse JSON as AI streams response
- Faster initial display
- Better user experience
- More complex implementation
- Progressive rendering

### 17.3 Enhanced Error Recovery

**Future**: Implement smart error recovery
- Attempt to fix common JSON errors (missing commas, quotes)
- Provide suggestions for fixing malformed JSON
- Better user guidance

---

## 18. Notes and Considerations

### 18.1 Language Independence

JSON format is language-independent, which solves the issue where XML structure might vary with conversation language. This is a key benefit of the migration.

### 18.2 AI Model Compatibility

Different AI models may format JSON differently. The parser should be flexible enough to handle:
- Extra whitespace (JSON.parse() handles this)
- Different key ordering (JSON objects are unordered)
- Optional fields (validate only required fields)
- Comments in JSON (not standard, but can be stripped before parsing)

### 18.3 Performance

JSON parsing is generally faster than regex-based XML parsing, but the difference is negligible for this use case. The main benefit is reliability, not performance.

### 18.4 Debugging

JSON format is easier to debug:
- Can use browser DevTools to inspect JSON
- Can use JSON validators
- Clearer error messages from `JSON.parse()`

---

**Plan Created**: 2025-01-25
**Status**: Ready for Implementation
**Estimated Effort**: 1-2 days development + 1 day testing (simplified without backward compatibility)
**Priority**: Medium (improves reliability, not blocking)
**Migration Type**: Clean migration, no backward compatibility

