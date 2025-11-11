# Issue Analysis: Meal Plan Validation Errors

**Date**: 2025-01-25
**Reported By**: User
**Status**: 🔍 Investigating
**Environment**: Local Development, Production

---

## 1. Problem Statement

### 1.1 Symptom Description

Users see error messages in the meal plan editor (edit view) that are:
- **Not detailed**: Generic error messages without specific information about what's wrong
- **Not translated**: Error messages appear in English even when the interface is in Polish
- **Not pointing to exact meals**: Errors don't indicate which specific meal has the problem
- **Not displayed next to problematic fields**: Errors appear in a generic alert box instead of inline with the fields

**Expected Behavior**: 
- Precise error messages that point to the exact field and meal that has the problem
- Error messages should be translated based on user's language preference
- Errors should appear next to the problematic fields (inline validation)
- System should handle different language conversations (migrate from XML to JSON format)

### 1.2 Environment Details

**Affected Environments**:
- Local Development: ✅ Issue occurs
- Production: ✅ Issue occurs

**Technical Stack**:
- Framework: Astro 5
- React: React 19
- Validation: Zod schemas
- Form Management: React Hook Form
- AI Integration: OpenRouter (XML format responses)
- Database: Supabase (PostgreSQL)

### 1.3 Error Details

**Error Messages**:
```
POST https://dietplanner.pages.dev/api/meal-plans 400 (Bad Request)

Validation failed. Name: String must contain at least 1 character(s); 
Plan Content → Meals → item 1 → Summary → Kcal: Number must be greater than 0; 
Plan Content → Meals → item 2 → Summary → Kcal: Number must be greater than 0; 
Plan Content → Meals → item 3 → Summary → Kcal: Number must be greater than 0
```

**Console/Log Output**:
```
MealPlanEditorWrapper.CIF30dSF.js:1  POST https://dietplanner.pages.dev/api/meal-plans 400 (Bad Request)
create @ MealPlanEditorWrapper.CIF30dSF.js:1
await in create
(anonymous) @ MealPlanEditorWrapper.CIF30dSF.js:1
await in (anonymous)
onSubmit @ MealPlanEditorWrapper.CIF30dSF.js:1
```

**User-Facing Error Messages**:
- "Please fix meal errors before saving" (generic, not translated)
- "Validation failed. Name: String must contain at least 1 character(s); Plan Content → Meals → item 1 → Summary → Kcal: Number must be greater than 0..." (raw Zod error, not translated, not user-friendly)

### 1.4 Impact Assessment

**User Impact**: 
- Users cannot fix meal plans because they don't know what's wrong
- Users see untranslated error messages in English even when using Polish interface
- Users cannot identify which specific meal or field has the problem
- Users cannot complete meal plan creation/editing workflow

**Business Impact**: 
- High - Major feature (meal plan creation/editing) is broken
- Users cannot use the core functionality of the application
- Poor user experience leads to frustration and potential abandonment

**Affected Features**: 
- Meal Plan Editor (Create Mode)
- Meal Plan Editor (Edit Mode)
- AI Chat → Editor transition (XML parsing issues)
- Form validation and error display

---

## 2. Initial Investigation

### 2.1 Timeline

- **First Occurrence**: Unknown (user doesn't know when it started)
- **Last Known Good State**: Unknown
- **Recent Changes**: Unknown
- **Consistency**: Sometimes, depends on conversation (AI response quality)

### 2.2 Reproduction Steps

1. User creates a meal plan via AI chat
2. AI generates meal plan with XML tags
3. User accepts plan and navigates to editor
4. XML parsing may fail if:
   - AI response has wrong XML tags
   - AI response has missing XML tags
   - AI response has unexpected XML tag substitutions
   - Language changes during conversation
5. User tries to save meal plan
6. Validation errors occur (e.g., missing meal names, kcal = 0)
7. Generic error message appears without details
8. User cannot identify what needs to be fixed

### 2.3 Affected Components

Based on initial analysis, the following components are involved:

**XML Parsing**:
- `src/lib/utils/meal-plan-parser.ts` - `parseXmlMealPlan()` function
- `src/lib/ai/session.service.ts` - System prompts that instruct AI to use XML format
- `src/components/hooks/useMealPlanEditor.ts` - Loads meal plan from bridge and parses XML

**Validation**:
- `src/lib/validation/meal-plans.schemas.ts` - Zod schemas for meal plan validation
- `src/lib/validation/meal-plan-form.schema.ts` - Form validation schema
- `src/pages/api/meal-plans/index.ts` - API endpoint that validates requests

**Error Display**:
- `src/components/MealPlanEditor.tsx` - Displays error alerts
- `src/components/hooks/useMealPlanEditor.ts` - Handles error state and display
- `src/components/MealCard.tsx` - Individual meal card (may need inline error display)

**Translation**:
- `src/lib/i18n/translations/en.json` - English translations
- `src/lib/i18n/translations/pl.json` - Polish translations
- Missing translation keys for validation errors

---

## 3. Root Cause Hypothesis

### 3.1 Initial Hypothesis

**Primary Issues**:

1. **XML Parsing Fragility**: 
   - XML parsing relies on regex matching which is fragile
   - If AI returns wrong XML tags (e.g., `<item>` instead of expected tags) or missing tags, parsing fails silently
   - Parsing returns default values (0 for numbers, empty strings) when tags are missing
   - This leads to validation errors downstream (e.g., kcal = 0, empty meal names)

2. **Error Message Format**:
   - API returns raw Zod validation errors in English
   - Error messages are not translated
   - Error messages don't map to user-friendly, field-specific messages
   - Error messages use technical paths like "Plan Content → Meals → item 1 → Summary → Kcal"

3. **Error Display Location**:
   - Errors are displayed in a generic alert at the top of the form
   - Errors are not displayed inline next to the problematic fields
   - Users cannot see which specific meal or field has the problem

4. **Language Handling**:
   - XML format is language-agnostic but parsing is fragile
   - When language changes during conversation, XML structure may change
   - JSON format would be more robust and language-independent

### 3.2 Areas to Investigate

1. **XML Parser Robustness**:
   - Test with various malformed XML responses
   - Test with missing tags
   - Test with unexpected tag names
   - Test with language-specific tag variations

2. **Error Message Translation**:
   - Check if translation keys exist for validation errors
   - Map Zod error paths to user-friendly field names
   - Implement translation for error messages

3. **Inline Error Display**:
   - Add field-level error display in MealCard component
   - Map API validation errors to form field errors
   - Display errors next to problematic fields

4. **JSON Migration**:
   - Update AI system prompts to use JSON instead of XML
   - Create JSON parser to replace XML parser
   - Test JSON parsing robustness
   - Update all related code

### 3.3 Related Issues

- **XML Parsing**: Current implementation uses regex which is fragile
- **Error Handling**: API errors are not user-friendly
- **Internationalization**: Error messages are not translated
- **Form Validation**: Client-side validation doesn't catch all issues before API call

---

## 4. Investigation Plan

### 4.1 Verification Steps

- [ ] Test XML parser with various malformed inputs
- [ ] Check translation files for validation error keys
- [ ] Review API error response format
- [ ] Test error display in editor component
- [ ] Review form validation schema
- [ ] Test with different language conversations

### 4.2 Debugging Strategy

1. **Add Logging**: Add comprehensive logging to XML parser to see what's being parsed
2. **Test Edge Cases**: Test with various AI response formats
3. **Error Mapping**: Map API validation errors to form fields
4. **Translation**: Add missing translation keys
5. **Inline Errors**: Implement inline error display
6. **JSON Migration**: Plan and implement JSON format migration

### 4.3 Logging Plan

Add logging at:
- XML parser entry point (input message)
- Each parsing step (daily summary, meals extraction)
- Validation errors (which fields fail)
- Error display (what error message is shown)
- API error responses (raw error format)

---

## 5. Next Steps

1. **Immediate**: Add logging to understand what's being parsed and what's failing
2. **Short-term**: Improve error messages (translation, user-friendly format)
3. **Short-term**: Add inline error display next to fields
4. **Medium-term**: Migrate from XML to JSON format for better robustness
5. **Long-term**: Improve XML parser robustness as fallback (if JSON migration is delayed)

---

**Analysis Created**: 2025-01-25
**Next Review**: After initial debugging

