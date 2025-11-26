# AI Prompt Enhancement - Questions and Formatting Implementation Plan

## 1. Overview

This feature enhances the AI conversation system with two main improvements:

1. **Formatting Enhancement**: Instructs the AI to format meal preparation instructions using structured lists (bullet points or numbered lists) instead of plain text paragraphs.

2. **Question Mode**: Adds an optional checkbox in the startup form that enables a "question mode" where the AI asks 5 challenging questions based on the initial form data before proceeding with meal plan creation. After 5 questions, the AI summarizes answers and asks if the user wants more questions or to proceed with plan creation. By default, the AI continues asking if the user doesn't explicitly request to proceed.

### User Story

As a dietitian, I want the AI to:
- Format meal preparation instructions in a clear, structured way (bullet or numbered lists) so they're easier to read and follow
- Optionally ask me challenging questions about the patient before creating the plan, so I can provide additional context that improves plan quality

### Integration Points

- **Startup Form**: Add checkbox for "Ask questions before creating plan"
- **System Prompts**: Add formatting instructions and question mode logic
- **User Prompts**: Conditionally modify initial prompt to request questions first
- **Chat Interface**: No changes needed (questions appear as regular conversation messages)

---

## 2. View Routing

No new views or routes required. Changes are made to:
- Existing startup form (`StartupFormDialog.tsx`)
- Existing AI chat interface (no changes needed - questions appear in conversation)
- Existing prompt generation (`src/lib/ai/session.service.ts`)

---

## 3. Component Structure

```
StartupFormDialog (React)
├── Existing form fields
└── New: ask_questions_before_planning (Checkbox)
    └── UI Primitive: Checkbox (shadcn/ui)

AIChatInterface (React)
└── No changes needed - questions appear as regular messages
```

---

## 4. Component Details

### 4.1 StartupFormDialog Component

**Component**: `src/components/StartupFormDialog.tsx`

**Changes Required**:
- Add new checkbox field `ask_questions_before_planning` in the multi-day options section
- Position after `different_guidelines_per_day` checkbox
- Add translation keys for label and description

**New UI Elements**:
- Checkbox: "Ask challenging questions before creating plan"
- Helper text (optional): Brief description of what questions will cover

**Handled Interactions**:
- User toggles checkbox to enable/disable question mode
- Checkbox state included in form submission

**Types**:
- Add `ask_questions_before_planning?: boolean` to `MultiDayStartupFormData` type in `src/types.ts`
- Add to `multiDayStartupFormDataSchema` in `src/lib/validation/meal-plans.schemas.ts`

### 4.2 AIChatInterface Component

**Component**: `src/components/AIChatInterface.tsx`

**Changes Required**: None
- Questions appear as regular assistant messages in the conversation
- User responses appear as regular user messages
- No special UI handling needed

---

## 5. Types

### 5.1 MultiDayStartupFormData Extension

**File**: `src/types.ts`

Add to existing `MultiDayStartupFormData` type:

```typescript
export type MultiDayStartupFormData = MealPlanStartupData & {
  number_of_days: number;
  ensure_meal_variety: boolean;
  different_guidelines_per_day: boolean;
  per_day_guidelines: string | null;
  ask_questions_before_planning?: boolean; // NEW
};
```

### 5.2 CreateAiSessionCommand Extension

**File**: `src/types.ts`

The `CreateAiSessionCommand` type already extends `MealPlanStartupData`, which will be extended via `MultiDayStartupFormData`. Ensure the type includes:

```typescript
export type CreateAiSessionCommand = MultiDayStartupFormData;
```

### 5.3 Validation Schema Update

**File**: `src/lib/validation/meal-plans.schemas.ts`

Update `multiDayStartupFormDataSchema`:

```typescript
export const multiDayStartupFormDataSchema = mealPlanStartupDataSchema
  .extend({
    number_of_days: z.number().int().min(1).max(7),
    ensure_meal_variety: z.boolean().default(true),
    different_guidelines_per_day: z.boolean().default(false),
    per_day_guidelines: z.string().max(2000).nullable().optional(),
    ask_questions_before_planning: z.boolean().optional().default(false), // NEW
  })
  // ... existing superRefine
```

### 5.4 AI Session Schema Update

**File**: `src/lib/validation/ai.schemas.ts`

Update `createAiSessionSchema`:

```typescript
export const createAiSessionSchema = z.object({
  // ... existing fields
  ask_questions_before_planning: z.boolean().optional().default(false), // NEW
});
```

---

## 6. State Management

### 6.1 Startup Form State

**File**: `src/components/hooks/useStartupForm.ts`

**Changes**:
- Add `ask_questions_before_planning: false` to default values
- Include in processed data passed to `onSubmit`

### 6.2 Chat State

**No changes needed** - questions and answers are handled as regular conversation messages stored in `message_history` array in the session.

---

## 7. API Integration

### 7.1 POST /api/ai/sessions

**Endpoint**: `src/pages/api/ai/sessions/index.ts`

**Changes Required**: None
- Endpoint already accepts `CreateAiSessionCommand` which will include the new field
- Validation schema updated to accept `ask_questions_before_planning`
- `AiSessionService.createSession()` will pass the field to prompt generation

### 7.2 POST /api/ai/sessions/[id]/message

**Endpoint**: `src/pages/api/ai/sessions/[id]/message.ts`

**Changes Required**: None
- Regular message flow handles question-answer conversation
- AI maintains context from initial prompt about question mode

---

## 8. User Interactions

### 8.1 Enable Question Mode

**Interaction**: User checks "Ask challenging questions before creating plan" checkbox in startup form

**Expected Outcome**: 
- Checkbox is checked
- Form submission includes `ask_questions_before_planning: true`

**Implementation**: Standard checkbox handling in React Hook Form

### 8.2 Question Mode Flow

**Interaction**: User submits form with question mode enabled

**Expected Outcome**:
1. AI session created with modified prompt instructing to ask 5 questions first
2. First AI message contains 5 challenging questions (or fewer if context is limited)
3. User answers questions in chat
4. After 5 questions answered, AI summarizes answers and asks: "Would you like me to ask more questions, or should I proceed with creating the meal plan?"
5. If user doesn't explicitly say "proceed" or "create plan", AI continues asking questions
6. When user explicitly requests plan creation, AI proceeds with normal meal plan generation

**Implementation**: 
- Modified system prompt includes question mode instructions
- Modified user prompt conditionally requests questions first
- AI handles conversation flow naturally through message history

### 8.3 Regular Mode Flow (Question Mode Disabled)

**Interaction**: User submits form without question mode

**Expected Outcome**: Normal flow - AI creates plan immediately

**Implementation**: No changes to existing flow

### 8.4 Formatting in Meal Plans

**Interaction**: AI generates meal plan with preparation instructions

**Expected Outcome**: Preparation instructions formatted as:
- Bullet points (`-` or `•`) for simple steps
- Numbered lists (`1.`, `2.`, etc.) for sequential steps requiring order

**Implementation**: Instructions added to system prompt

---

## 9. Conditions and Validation

### 9.1 Form Validation

**Condition**: `ask_questions_before_planning` is optional boolean, defaults to `false`

**Validation**: 
- Type: `boolean`
- Default: `false`
- No additional validation rules needed

### 9.2 Question Mode Conditions

**Condition**: Question mode only applies to multi-day plans

**Validation**: 
- Feature only available when `number_of_days` is present (multi-day form)
- Single-day plans always use regular mode (no question option)

**Implementation**: Checkbox only shown in multi-day options section

### 9.3 Prompt Generation Conditions

**Condition**: System and user prompts modified only when `ask_questions_before_planning === true`

**Validation**: 
- Check `ask_questions_before_planning` flag in `formatSystemPrompt()` and `formatUserPrompt()`
- Apply question mode instructions only when flag is true

---

## 10. Error Handling

### 10.1 Form Submission Errors

**Error**: Validation fails for `ask_questions_before_planning`

**Handling**: Standard Zod validation error display inline with field

### 10.2 AI Question Generation Errors

**Error**: AI doesn't ask questions or asks inappropriate questions

**Handling**: 
- User can respond naturally in chat to guide AI
- User can explicitly request plan creation if questions aren't helpful
- No special error handling needed - handled through normal conversation

### 10.3 Formatting Errors

**Error**: AI doesn't format preparation instructions correctly

**Handling**: 
- User can request reformatting in follow-up messages
- No breaking errors - formatting is a preference, not a requirement

---

## 11. Implementation Steps

### Step 1: Update Type Definitions

1. Add `ask_questions_before_planning?: boolean` to `MultiDayStartupFormData` in `src/types.ts`
2. Verify `CreateAiSessionCommand` includes the field (via inheritance)

### Step 2: Update Validation Schemas

1. Add `ask_questions_before_planning: z.boolean().optional().default(false)` to `multiDayStartupFormDataSchema` in `src/lib/validation/meal-plans.schemas.ts`
2. Add same field to `createAiSessionSchema` in `src/lib/validation/ai.schemas.ts`

### Step 3: Update Startup Form Hook

1. Add `ask_questions_before_planning: false` to default values in `src/components/hooks/useStartupForm.ts`
2. Include field in `processedData` passed to `onSubmit`

### Step 4: Update Startup Form UI

1. Add checkbox in multi-day options section of `src/components/StartupFormDialog.tsx`
2. Position after `different_guidelines_per_day` checkbox
3. Add translation keys:
   - `startup.askQuestionsBeforePlanning` (label)
   - `startup.askQuestionsBeforePlanningDescription` (optional helper text)

### Step 5: Update System Prompts - Formatting

1. Modify `formatSystemPrompt()` in `src/lib/ai/session.service.ts`
2. Add formatting instructions to both English and Polish prompts (single-day and multi-day):
   - "Format preparation instructions using bullet points (`-` or `•`) for simple steps or numbered lists (`1.`, `2.`, etc.) for sequential steps that require order. Choose the format that best suits the complexity of the preparation."
   - Add to requirements section

### Step 6: Update System Prompts - Question Mode

1. Modify `formatSystemPrompt()` to include question mode instructions when flag is true
2. Add instructions for both English and Polish (multi-day only):
   - "Before creating the meal plan, you must ask the user 5 challenging questions based on the provided patient information and dietary guidelines. These questions should help clarify important details that will improve the meal plan quality."
   - "After the user answers 5 questions, summarize their answers and ask: 'Would you like me to ask more questions, or should I proceed with creating the meal plan?'"
   - "If the user doesn't explicitly request to proceed with plan creation, continue asking questions. Only proceed with meal plan creation when the user explicitly requests it (e.g., 'proceed', 'create plan', 'go ahead')."
   - "Once the user requests plan creation, proceed with generating the meal plan using the standard JSON structure."

### Step 7: Update User Prompts - Question Mode

1. Modify `formatUserPrompt()` in `src/lib/ai/session.service.ts`
2. When `ask_questions_before_planning === true`, append instruction:
   - English: "IMPORTANT: Before creating the meal plan, please ask me 5 challenging questions based on the provided information to help clarify important details that will improve the meal plan quality."
   - Polish: "WAŻNE: Przed utworzeniem planu żywieniowego, proszę zadaj mi 5 wymagających pytań na podstawie podanych informacji, aby pomóc wyjaśnić ważne szczegóły, które poprawią jakość planu żywieniowego."

### Step 8: Add Translation Keys

1. Add to `src/lib/i18n/translations/en.json`:
   ```json
   "startup": {
     "askQuestionsBeforePlanning": "Ask challenging questions before creating plan",
     "askQuestionsBeforePlanningDescription": "The AI will ask 5 questions to clarify important details before generating the meal plan"
   }
   ```

2. Add to `src/lib/i18n/translations/pl.json`:
   ```json
   "startup": {
     "askQuestionsBeforePlanning": "Zadaj wymagające pytania przed utworzeniem planu",
     "askQuestionsBeforePlanningDescription": "AI zada 5 pytań, aby wyjaśnić ważne szczegóły przed wygenerowaniem planu żywieniowego"
   }
   ```

### Step 9: Testing

1. **Unit Tests**:
   - Test validation schema accepts `ask_questions_before_planning`
   - Test default value is `false`
   - Test prompt generation includes question mode instructions when enabled

2. **Integration Tests**:
   - Test API accepts `ask_questions_before_planning` in session creation
   - Test prompt includes question mode when flag is true

3. **E2E Tests**:
   - Test checkbox appears in startup form
   - Test question mode flow: form submission → AI asks questions → user answers → AI summarizes → user proceeds → plan created
   - Test regular mode still works (checkbox unchecked)
   - Test formatting appears in generated meal plans

### Step 10: Documentation

1. Update `.ai/docs/project-summary.md` to document new feature
2. Add note about question mode in relevant sections

---

## 12. Key Files to Modify

1. `src/types.ts` - Add `ask_questions_before_planning` to `MultiDayStartupFormData`
2. `src/lib/validation/meal-plans.schemas.ts` - Add field to schema
3. `src/lib/validation/ai.schemas.ts` - Add field to schema
4. `src/components/hooks/useStartupForm.ts` - Add to default values and processed data
5. `src/components/StartupFormDialog.tsx` - Add checkbox UI
6. `src/lib/ai/session.service.ts` - Modify `formatSystemPrompt()` and `formatUserPrompt()`
7. `src/lib/i18n/translations/en.json` - Add translation keys
8. `src/lib/i18n/translations/pl.json` - Add translation keys

---

## 13. Testing Considerations

### 13.1 Question Mode Flow

- Verify AI asks exactly 5 questions (or fewer if context is limited)
- Verify AI summarizes answers after 5 questions
- Verify AI asks if user wants more questions or to proceed
- Verify AI continues asking if user doesn't explicitly request plan creation
- Verify AI proceeds when user explicitly requests plan creation

### 13.2 Formatting

- Verify preparation instructions use bullet points or numbered lists
- Verify formatting is appropriate for complexity (simple = bullets, sequential = numbered)
- Test with various meal types and preparation complexities

### 13.3 Edge Cases

- Test with minimal form data (AI should still ask relevant questions)
- Test with comprehensive form data (AI should ask deeper, more specific questions)
- Test user exiting and re-entering chat (questions are lost, as per requirement)
- Test question mode disabled (normal flow works)

---

## 14. Future Enhancements (Out of Scope)

- User preference to save question-answer history
- Ability to edit answers to previous questions
- Pre-defined question templates
- Question mode for single-day plans
- User preference for bullet vs numbered list formatting

