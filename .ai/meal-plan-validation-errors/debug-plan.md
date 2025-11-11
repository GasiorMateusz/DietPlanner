# Debugging Plan: Meal Plan Validation Errors

**Created**: 2025-01-25
**Status**: 🚧 In Progress
**Related Analysis**: `issue-analysis.md` (in same directory)

---

## Debugging Methodology

This plan follows a systematic, multi-phase debugging approach:
1. **Infrastructure Verification**: Verify XML parsing, validation schemas, and error handling
2. **Code Analysis**: Review application code for parsing and validation issues
3. **Logging Implementation**: Add comprehensive logging throughout
4. **Error Message Improvement**: Improve error messages (translation, user-friendly format)
5. **Inline Error Display**: Implement field-level error display
6. **JSON Migration**: Migrate from XML to JSON format for robustness

---

## Phase 1: Infrastructure Verification

### Step 1.1: XML Parser Analysis
- [ ] Review `parseXmlMealPlan()` function in `src/lib/utils/meal-plan-parser.ts`
- [ ] Test parser with various malformed XML inputs
- [ ] Identify edge cases where parsing fails silently
- [ ] Document what happens when tags are missing or malformed

**Status**: ⏳ Pending
**Findings**: _{Will be updated during debugging}_

### Step 1.2: Validation Schema Review
- [ ] Review Zod schemas in `src/lib/validation/meal-plans.schemas.ts`
- [ ] Check validation error message format
- [ ] Identify which validations can fail and how errors are reported
- [ ] Review form validation schema in `src/lib/validation/meal-plan-form.schema.ts`

**Status**: ⏳ Pending
**Findings**: _{Will be updated during debugging}_

### Step 1.3: Error Handling Review
- [ ] Review API error handling in `src/pages/api/meal-plans/index.ts`
- [ ] Check how validation errors are returned to client
- [ ] Review client-side error handling in `useMealPlanEditor.ts`
- [ ] Check error display in `MealPlanEditor.tsx`

**Status**: ⏳ Pending
**Findings**: _{Will be updated during debugging}_

---

## Phase 2: Code Analysis

### Step 2.1: XML Parser Edge Cases
- [ ] Test parser with missing `<meal>` tags
- [ ] Test parser with missing `<summary>` tags
- [ ] Test parser with missing `<kcal>` tags (should default to 0, causing validation error)
- [ ] Test parser with wrong tag names (e.g., `<item>` instead of expected tags)
- [ ] Test parser with language-specific variations

**Status**: ⏳ Pending
**Findings**: _{Will be updated during debugging}_

### Step 2.2: Error Message Format Analysis
- [ ] Review API error response format
- [ ] Check how Zod errors are formatted
- [ ] Identify error path format (e.g., "Plan Content → Meals → item 1 → Summary → Kcal")
- [ ] Map error paths to form fields

**Status**: ⏳ Pending
**Findings**: _{Will be updated during debugging}_

### Step 2.3: Translation Coverage
- [ ] Check `src/lib/i18n/translations/en.json` for validation error keys
- [ ] Check `src/lib/i18n/translations/pl.json` for validation error keys
- [ ] Identify missing translation keys
- [ ] Document which errors are not translated

**Status**: ⏳ Pending
**Findings**: _{Will be updated during debugging}_

---

## Phase 3: Logging Implementation

### Step 3.1: Add Debug Logs to XML Parser
- [ ] Add logging at parser entry point (input message preview)
- [ ] Add logging for daily summary extraction
- [ ] Add logging for meals extraction
- [ ] Add logging for each meal parsing step
- [ ] Add logging for missing tags (warnings)
- [ ] Add logging for parsing results (final parsed data)

**Status**: ⏳ Pending
**Files Modified**: _{Will be updated during debugging}_

### Step 3.2: Add Debug Logs to Validation
- [ ] Add logging when validation fails in API
- [ ] Add logging for which fields fail validation
- [ ] Add logging for error message format
- [ ] Add logging in client-side form validation

**Status**: ⏳ Pending
**Files Modified**: _{Will be updated during debugging}_

### Step 3.3: Add Debug Logs to Error Display
- [ ] Add logging when errors are set in `useMealPlanEditor`
- [ ] Add logging for error message translation
- [ ] Add logging for error display in `MealPlanEditor.tsx`

**Status**: ⏳ Pending
**Files Modified**: _{Will be updated during debugging}_

---

## Phase 4: Error Message Improvement

### Step 4.1: Create Error Message Mapper
- [ ] Create utility function to map Zod error paths to user-friendly field names
- [ ] Map "Plan Content → Meals → item 1 → Summary → Kcal" to "Meal 1: Calories"
- [ ] Map "Name" to translated field name
- [ ] Handle array indices in error paths

**Status**: ⏳ Pending
**Files Modified**: _{Will be updated during debugging}_

### Step 4.2: Add Translation Keys
- [ ] Add translation keys for all validation errors
- [ ] Add keys for field names (meal name, calories, proteins, etc.)
- [ ] Add keys for error messages (e.g., "Meal {index}: {field} is required")
- [ ] Test translations in both English and Polish

**Status**: ⏳ Pending
**Files Modified**: _{Will be updated during debugging}_

### Step 4.3: Update Error Display
- [ ] Update `useMealPlanEditor.ts` to use error mapper
- [ ] Update `MealPlanEditor.tsx` to display translated, user-friendly errors
- [ ] Format errors to show which meal and field has the problem

**Status**: ⏳ Pending
**Files Modified**: _{Will be updated during debugging}_

---

## Phase 5: Inline Error Display

### Step 5.1: Add Field-Level Error State
- [ ] Update `MealCard.tsx` to accept and display field errors
- [ ] Map API validation errors to form field errors
- [ ] Add error display next to each field (name, ingredients, preparation, summary fields)

**Status**: ⏳ Pending
**Files Modified**: _{Will be updated during debugging}_

### Step 5.2: Implement Inline Error Display
- [ ] Add error text below each problematic field
- [ ] Style errors to be visible but not intrusive
- [ ] Ensure errors are translated
- [ ] Test with various validation error scenarios

**Status**: ⏳ Pending
**Files Modified**: _{Will be updated during debugging}_

### Step 5.3: Update Form Validation
- [ ] Ensure client-side validation shows inline errors
- [ ] Ensure API validation errors are mapped to form fields
- [ ] Test error display for all validation scenarios

**Status**: ⏳ Pending
**Files Modified**: _{Will be updated during debugging}_

---

## Phase 6: JSON Migration (Long-term Solution)

### Step 6.1: Update AI System Prompts
- [ ] Update `formatSystemPrompt()` in `src/lib/ai/session.service.ts` to use JSON instead of XML
- [ ] Update English prompt to request JSON format
- [ ] Update Polish prompt to request JSON format
- [ ] Define JSON schema structure for meal plans

**Status**: ⏳ Pending
**Files Modified**: _{Will be updated during debugging}_

### Step 6.2: Create JSON Parser
- [ ] Create `parseJsonMealPlan()` function in `src/lib/utils/meal-plan-parser.ts`
- [ ] Implement JSON parsing with error handling
- [ ] Handle malformed JSON gracefully
- [ ] Add fallback to XML parser for backward compatibility (if needed)

**Status**: ⏳ Pending
**Files Modified**: _{Will be updated during debugging}_

### Step 6.3: Update Editor to Use JSON Parser
- [ ] Update `useMealPlanEditor.ts` to use JSON parser
- [ ] Test with AI responses in JSON format
- [ ] Remove XML parser dependency (or keep as fallback)

**Status**: ⏳ Pending
**Files Modified**: _{Will be updated during debugging}_

### Step 6.4: Testing and Validation
- [ ] Test JSON parsing with various AI responses
- [ ] Test with different languages
- [ ] Test error handling for malformed JSON
- [ ] Verify backward compatibility (if XML fallback is kept)

**Status**: ⏳ Pending
**Files Modified**: _{Will be updated during debugging}_

---

## Phase 7: Testing & Verification

### Step 7.1: Local Testing
- [ ] Test XML parser with various malformed inputs
- [ ] Test error message display
- [ ] Test inline error display
- [ ] Test translations
- [ ] Test JSON parser (after migration)

**Status**: ⏳ Pending
**Results**: _{Will be updated during debugging}_

### Step 7.2: Production Testing
- [ ] Deploy improvements
- [ ] Test with real AI responses
- [ ] Monitor error rates
- [ ] Verify error messages are user-friendly

**Status**: ⏳ Pending
**Results**: _{Will be updated during debugging}_

---

## Phase 8: Root Cause Identification

### Step 8.1: Analyze Findings
- [ ] Review all collected logs
- [ ] Identify patterns in parsing failures
- [ ] Identify patterns in validation errors
- [ ] Formulate root cause hypothesis

**Status**: ⏳ Pending
**Findings**: _{Will be updated during debugging}_

### Step 8.2: Verify Root Cause
- [ ] Test hypothesis
- [ ] Confirm root cause
- [ ] Document findings

**Status**: ⏳ Pending
**Root Cause**: _{Will be updated during debugging}_

---

## Phase 9: Solution Implementation

### Step 9.1: Implement Fixes
- [ ] Implement error message improvements
- [ ] Implement inline error display
- [ ] Implement JSON migration (if proceeding)
- [ ] Test fixes locally

**Status**: ⏳ Pending
**Solution**: _{Will be updated during debugging}_

### Step 9.2: Verify Fix
- [ ] Test in affected environment
- [ ] Verify issue is resolved
- [ ] Check for regressions
- [ ] Verify translations work correctly

**Status**: ⏳ Pending
**Verification**: _{Will be updated during debugging}_

---

## Debugging History

### 2025-01-25 - Initial Setup
**What was done**: Created issue analysis and debugging plan
**Findings**: 
- Issue involves XML parsing fragility, error message format, and error display location
- Multiple components affected: parser, validation, error handling, translation
- Need to improve error messages, add inline display, and migrate to JSON
**Next steps**: Begin Phase 1 - Infrastructure Verification
**Status**: ✅ Success

---

## Current Status

**Current Phase**: Phase 1 - Infrastructure Verification
**Current Step**: Step 1.1 - XML Parser Analysis
**Blockers**: None
**Next Action**: Review XML parser code and test with edge cases

---

**Last Updated**: 2025-01-25

