# Feature Implementation Plan: AI Prompt Enhancement Based on Clinical Guidelines

## 1. Overview

This feature enhances the AI meal plan generation system by redesigning the initial system prompt and user prompt messages to incorporate evidence-based clinical guidelines, calculation methodologies, and professional standards from authoritative sources. The enhancement makes the AI assistant more accurate, clinically sound, and aligned with professional dietitian practices.

**User Story**: As a dietitian, I want the AI to generate meal plans based on evidence-based clinical guidelines and professional calculation methods, so that the plans are accurate, clinically appropriate, and follow established standards.

**Main Purpose**: 
- Integrate clinical guidelines (EFSA, ESPEN, NICE, KDOQI, EAACI, Diabetes consensus) into AI prompts
- Incorporate scientific calculation methodologies (FAO/WHO/UNU, BMR equations, PAL factors, illness stress factors)
- Reference professional standards for macro distribution, protein requirements, and condition-specific nutrition therapy
- Enhance prompt accuracy and clinical relevance without changing the JSON output structure

**How it fits into the workflow**:
- The enhanced prompts are used when creating new AI chat sessions (`POST /api/ai/sessions`)
- The system prompt defines the AI's role and knowledge base
- The user prompt structures patient information with clinical context
- Follow-up messages in existing sessions continue to use the enhanced system prompt from session creation

## 2. View Routing

This feature does not introduce new views or routes. It enhances existing functionality:
- **Existing Route**: `POST /api/ai/sessions` - Creates new AI chat sessions (enhanced prompts)
- **Existing Route**: `POST /api/ai/sessions/[id]/message` - Sends follow-up messages (uses stored system prompt from session creation)
- **Existing View**: `/app/meal-plan/new` - Startup form that triggers session creation
- **Existing View**: `/app/meal-plan/[id]/chat` - Chat interface that uses the enhanced prompts

## 3. Component Structure

This feature primarily modifies backend services, not UI components. The component structure remains unchanged:

```
Existing Components (No Changes)
├── AIChatInterface (React) - Displays chat messages
├── StartupFormDialog (React) - Collects patient data
└── API Endpoints
    ├── POST /api/ai/sessions - Uses enhanced prompts
    └── POST /api/ai/sessions/[id]/message - Uses stored enhanced prompts
```

**Backend Service Structure**:
```
src/lib/ai/session.service.ts
├── formatSystemPrompt() - Enhanced with clinical guidelines
└── formatUserPrompt() - Enhanced with structured clinical context
```

## 4. Component Details

### formatSystemPrompt() Function (Enhanced)

- **Function description**: Generates the system prompt that defines the AI's role, knowledge base, and response format. The enhanced version includes references to clinical guidelines, calculation methodologies, and professional standards.

- **Main elements**:
  - Role definition: "You are a professional dietitian assistant..."
  - Clinical guidelines section: References to EFSA, ESPEN, NICE, KDOQI, EAACI, Diabetes consensus
  - Calculation methodology section: References to FAO/WHO/UNU, BMR equations (Schofield, Harris-Benedict, Mifflin-St Jeor), PAL factors, illness stress factors
  - Macro distribution standards: EFSA %EI ranges, SACN carbohydrate/fiber recommendations
  - Condition-specific guidance: References to ESPEN (illness), KDOQI (CKD), Diabetes consensus, EAACI (allergies)
  - JSON structure requirements: Unchanged from current implementation
  - Response requirements: Enhanced with clinical accuracy expectations

- **Handled logic**:
  - Language detection (English/Polish)
  - Single-day vs multi-day plan detection
  - Clinical guideline integration
  - Calculation methodology references

- **Types**:
  - Input: `language: LanguageCode`, `isMultiDay: boolean`
  - Output: `string` (system prompt text)

### formatUserPrompt() Function (Enhanced)

- **Function description**: Formats patient startup data into a structured user prompt that includes clinical context and calculation methodology references. The enhanced version organizes patient information with references to appropriate clinical standards.

- **Main elements**:
  - Patient demographics section: Age, weight, height with clinical context
  - Activity level section: PAL factor references (FAO/WHO standards)
  - Nutritional targets section: References to EFSA DRVs and calculation methods
  - Macro distribution section: References to EFSA %EI ranges
  - Condition-specific information: Structured presentation of exclusions/guidelines with clinical context
  - Calculation methodology hints: References to appropriate BMR equations and adjustment factors

- **Handled logic**:
  - Patient data formatting with clinical context
  - Activity level to PAL factor mapping
  - Condition detection from exclusions_guidelines
  - Multi-day plan specific formatting

- **Types**:
  - Input: `command: CreateAiSessionCommand`, `language: LanguageCode`, `isMultiDay: boolean`
  - Output: `string` (user prompt text)

## 5. Types

No new types are required. The feature uses existing types:

### Existing Types Used

- `CreateAiSessionCommand`: From `src/types.ts` - Command for creating AI sessions
  - `patient_age?: number | null`
  - `patient_weight?: number | null`
  - `patient_height?: number | null`
  - `activity_level?: "sedentary" | "light" | "moderate" | "high" | null`
  - `target_kcal?: number | null`
  - `target_macro_distribution?: TargetMacroDistribution | null`
  - `meal_names?: string | null`
  - `exclusions_guidelines?: string | null`
  - `number_of_days?: number` (multi-day)
  - `ensure_meal_variety?: boolean` (multi-day)
  - `different_guidelines_per_day?: boolean` (multi-day)
  - `per_day_guidelines?: string | null` (multi-day)

- `LanguageCode`: From `src/lib/i18n/types.ts` - Language code ("en" | "pl")

- `ChatMessage`: From `src/types.ts` - Message structure (unchanged)

## 6. State Management

No state management changes required. The feature modifies prompt generation functions that are stateless:
- `formatSystemPrompt()`: Pure function, no state
- `formatUserPrompt()`: Pure function, no state
- Prompts are generated at session creation time and stored in the database
- Follow-up messages use the stored system prompt from the session

## 7. API Integration

No new API endpoints are required. The feature enhances existing endpoints:

### Existing Endpoints (Enhanced Prompts)

**POST /api/ai/sessions**
- **Request**: Unchanged (`CreateAiSessionCommand`)
- **Response**: Unchanged (`CreateAiSessionResponseDto`)
- **Enhancement**: Uses enhanced `formatSystemPrompt()` and `formatUserPrompt()` functions
- **Authentication**: Required (unchanged)
- **Validation**: Unchanged (uses `createAiSessionSchema`)

**POST /api/ai/sessions/[id]/message**
- **Request**: Unchanged (`SendAiMessageCommand`)
- **Response**: Unchanged (`SendAiMessageResponseDto`)
- **Enhancement**: Uses stored enhanced system prompt from session creation
- **Authentication**: Required (unchanged)
- **Validation**: Unchanged (uses `sendAiMessageSchema`)

## 8. User Interactions

No new user interactions are introduced. Existing interactions remain unchanged:

- **Form submission** (`StartupFormDialog`): User fills out patient data form → Creates AI session with enhanced prompts
- **Chat message** (`AIChatInterface`): User sends follow-up message → Uses stored enhanced system prompt
- **Session creation**: Backend automatically applies enhanced prompts (transparent to user)

## 9. Conditions and Validation

### Prompt Generation Conditions

- **Language detection**: Determines prompt language (English/Polish) based on user preference
- **Plan type detection**: Determines single-day vs multi-day prompt structure
- **Patient data availability**: Handles optional/nullable fields gracefully
- **Condition detection**: Analyzes `exclusions_guidelines` for condition-specific references

### Clinical Guideline Integration Conditions

- **General guidelines**: Always included (EFSA, ESPEN, FAO/WHO/UNU)
- **Condition-specific guidelines**: Included when relevant conditions are detected:
  - CKD/Renal: KDOQI references
  - Diabetes: ADA/EASD consensus references
  - Allergies/Intolerances: EAACI references
  - Illness/Inflammation: ESPEN illness stress factors

### Calculation Methodology Conditions

- **BMR equations**: Referenced when patient demographics (age, weight, height) are available
- **PAL factors**: Referenced when activity level is provided
- **Illness factors**: Referenced when clinical conditions are mentioned in exclusions_guidelines

### Validation

- **Input validation**: Unchanged (uses existing Zod schemas)
- **Prompt validation**: No validation required (string generation)
- **Output validation**: Unchanged (JSON structure validation remains the same)

## 10. Error Handling

No new error handling required. Existing error handling remains unchanged:

- **API errors**: Handled by existing error handling in `session.service.ts`
- **OpenRouter errors**: Handled by `OpenRouterService` (unchanged)
- **Database errors**: Handled by existing error handling (unchanged)
- **Validation errors**: Handled by existing Zod validation (unchanged)

**Edge Cases**:
- Missing patient data: Prompts handle optional fields gracefully
- Missing activity level: PAL references omitted if not provided
- No exclusions/guidelines: Condition-specific references omitted
- Language preference missing: Defaults to English

## 11. Implementation Steps

### Step 1: Research and Document Clinical Guidelines Integration

1. Review `dietitian-guidelines.md` thoroughly
2. Extract key clinical guideline references for system prompt
3. Extract calculation methodology references
4. Document condition-specific guideline mappings
5. Create reference structure for prompt integration

**Deliverable**: Clinical guidelines reference document (internal)

### Step 2: Enhance formatSystemPrompt() Function

1. Update English single-day prompt:
   - Add clinical guidelines section (EFSA, ESPEN, NICE)
   - Add calculation methodology section (FAO/WHO/UNU, BMR equations)
   - Add macro distribution standards (EFSA %EI, SACN)
   - Add condition-specific guidance references
   - Maintain existing JSON structure requirements

2. Update English multi-day prompt:
   - Apply same enhancements as single-day
   - Maintain multi-day specific requirements

3. Update Polish single-day prompt:
   - Translate enhanced English prompt to Polish
   - Maintain clinical accuracy in translation

4. Update Polish multi-day prompt:
   - Translate enhanced English multi-day prompt to Polish

**Files to modify**:
- `src/lib/ai/session.service.ts` - `formatSystemPrompt()` function (lines 30-247)

**Testing**:
- Unit test prompt generation for all language/plan type combinations
- Verify JSON structure requirements are preserved
- Verify clinical guideline references are included

### Step 3: Enhance formatUserPrompt() Function

1. Update English single-day user prompt:
   - Add clinical context to patient demographics
   - Add PAL factor references for activity levels
   - Add calculation methodology hints (BMR equations)
   - Add EFSA DRV references for nutritional targets
   - Structure condition-specific information with clinical context

2. Update English multi-day user prompt:
   - Apply same enhancements as single-day
   - Maintain multi-day specific formatting

3. Update Polish single-day user prompt:
   - Translate enhanced English prompt to Polish

4. Update Polish multi-day user prompt:
   - Translate enhanced English multi-day prompt to Polish

**Files to modify**:
- `src/lib/ai/session.service.ts` - `formatUserPrompt()` function (lines 256-396)

**Testing**:
- Unit test user prompt generation with various patient data combinations
- Verify clinical context is included appropriately
- Verify optional fields are handled gracefully

### Step 4: Create Helper Functions for Clinical Context (Optional)

1. Create function to detect conditions from `exclusions_guidelines`:
   - Detect CKD/renal conditions
   - Detect diabetes
   - Detect allergies/intolerances
   - Detect illness/inflammation indicators

2. Create function to map activity levels to PAL factors:
   - sedentary → PAL 1.2-1.3
   - light → PAL 1.4-1.5
   - moderate → PAL 1.6-1.7
   - high → PAL 1.8-2.0

3. Create function to suggest appropriate BMR equation:
   - Mifflin-St Jeor (preferred for adults)
   - Harris-Benedict (alternative)
   - Schofield (for specific populations)

**Files to create**:
- `src/lib/ai/clinical-context.helpers.ts` (new file)

**Files to modify**:
- `src/lib/ai/session.service.ts` - Import and use helper functions

**Testing**:
- Unit test condition detection function
- Unit test PAL factor mapping
- Unit test BMR equation suggestion

### Step 5: Update Unit Tests

1. Update existing unit tests for `formatSystemPrompt()`:
   - Test enhanced prompts include clinical guidelines
   - Test enhanced prompts include calculation methodologies
   - Test JSON structure requirements are preserved
   - Test all language/plan type combinations

2. Update existing unit tests for `formatUserPrompt()`:
   - Test enhanced prompts include clinical context
   - Test PAL factor references
   - Test calculation methodology hints
   - Test condition-specific formatting

3. Create new unit tests for helper functions (if Step 4 is implemented):
   - Test condition detection
   - Test PAL factor mapping
   - Test BMR equation suggestion

**Files to modify**:
- `src/test/unit/lib/ai/session.service.test.ts` (if exists, or create new)

**Testing**:
- Run all unit tests
- Verify test coverage for enhanced functions

### Step 6: Integration Testing

1. Test end-to-end session creation:
   - Create session with various patient data combinations
   - Verify enhanced prompts are generated correctly
   - Verify AI responses maintain JSON structure
   - Verify AI responses show improved clinical accuracy

2. Test follow-up messages:
   - Send follow-up messages to existing sessions
   - Verify stored enhanced system prompt is used
   - Verify conversation context is maintained

3. Test multi-day plans:
   - Create multi-day sessions with enhanced prompts
   - Verify multi-day specific enhancements are applied
   - Verify average calculations are accurate

**Files to test**:
- `src/pages/api/ai/sessions.ts`
- `src/pages/api/ai/sessions/[id]/message.ts`
- `src/lib/ai/session.service.ts`

**Testing**:
- Manual testing with various patient scenarios
- Verify AI responses are clinically appropriate
- Verify JSON structure is maintained

### Step 7: Documentation Updates

1. Update code comments:
   - Document clinical guideline references in `formatSystemPrompt()`
   - Document calculation methodology references
   - Document condition-specific logic

2. Update internal documentation:
   - Document prompt enhancement rationale
   - Document clinical guideline sources
   - Document calculation methodology sources

**Files to modify**:
- `src/lib/ai/session.service.ts` - Add comprehensive JSDoc comments
- `.ai/prompt-enhance/` - Create documentation files

### Step 8: Code Review and Refinement

1. Code review:
   - Review prompt content for clinical accuracy
   - Review prompt length and token usage
   - Review maintainability of prompt structure

2. Refinement:
   - Optimize prompt length if needed
   - Refine clinical guideline references
   - Refine calculation methodology references
   - Ensure prompts are clear and actionable

**Files to review**:
- `src/lib/ai/session.service.ts`
- `src/lib/ai/clinical-context.helpers.ts` (if created)

## 12. Clinical Guidelines Integration Details

### System Prompt Enhancements

**Clinical Guidelines Section** (to be added):
```
You are a professional dietitian assistant trained in evidence-based clinical nutrition. 
Your meal plans must align with established clinical guidelines and professional standards:

- EFSA (European Food Safety Authority) Dietary Reference Values (DRVs) for macro distribution
- ESPEN (European Society for Clinical Nutrition and Metabolism) guidelines for clinical nutrition
- NICE (UK) nutrition support guidance for malnutrition assessment and nutrition support
- FAO/WHO/UNU Human Energy Requirements (2001/2004) for energy calculation methodologies
- SACN (UK) Carbohydrates & Health (2015) for carbohydrate and fiber recommendations

For condition-specific cases:
- KDOQI/Kidney Foundation guidelines for chronic kidney disease (CKD) nutrition
- ADA/EASD Diabetes Nutrition Therapy Consensus for diabetes management
- EAACI Food Allergy Guidelines for allergy and intolerance management
```

**Calculation Methodology Section** (to be added):
```
When calculating nutritional requirements, use evidence-based methodologies:

Energy Requirements:
- Base Metabolic Rate (BMR): Use Mifflin-St Jeor equation (preferred for adults) or Harris-Benedict equation
- Physical Activity Level (PAL): Apply appropriate PAL multipliers based on activity level:
  * Sedentary: PAL 1.2-1.3
  * Light activity: PAL 1.4-1.5
  * Moderate activity: PAL 1.6-1.7
  * High activity: PAL 1.8-2.0
- Illness Stress Factors: Apply ESPEN illness stress factors when clinical conditions are present

Macro Distribution:
- Follow EFSA %EI (percentage of energy intake) ranges:
  * Protein: 10-35% of total energy
  * Fat: 20-35% of total energy
  * Carbohydrates: 45-65% of total energy
- Follow SACN recommendations for fiber (30g/day for adults) and free sugars (<5% of total energy)

Protein Requirements:
- General: 0.8-1.0 g/kg body weight (EFSA)
- Clinical conditions: Follow ESPEN or KDOQI guidelines for condition-specific protein needs
```

### User Prompt Enhancements

**Patient Demographics Section** (enhanced):
```
Patient Information:
- Age: [age] years
- Weight: [weight] kg
- Height: [height] cm
- BMI: [calculated if weight and height provided]

Note: BMR can be calculated using Mifflin-St Jeor equation if needed for energy requirement verification.
```

**Activity Level Section** (enhanced):
```
Activity Level: [level]
- PAL Factor: [corresponding PAL range based on FAO/WHO standards]
- This factor should be applied to BMR for total energy requirement calculation.
```

**Nutritional Targets Section** (enhanced):
```
Nutritional Targets:
- Target Calories: [target_kcal] kcal/day
- Target Macro Distribution: Protein [p_perc]%, Fat [f_perc]%, Carbohydrates [c_perc]%
  (These percentages should align with EFSA %EI ranges and patient-specific needs)
```

**Condition-Specific Section** (enhanced):
```
Dietary Exclusions and Guidelines: [exclusions_guidelines]

Clinical Context:
[If CKD/renal conditions detected]: Consider KDOQI guidelines for protein and electrolyte management.
[If diabetes detected]: Consider ADA/EASD consensus for carbohydrate counting and glycemic control.
[If allergies/intolerances detected]: Follow EAACI guidelines for safe food selection and cross-contamination prevention.
[If illness/inflammation detected]: Apply ESPEN illness stress factors for increased protein and energy needs.
```

## 13. Testing Strategy

### Unit Tests

**Test Cases for formatSystemPrompt()**:
1. English single-day prompt includes clinical guidelines
2. English multi-day prompt includes clinical guidelines
3. Polish single-day prompt includes clinical guidelines (translated)
4. Polish multi-day prompt includes clinical guidelines (translated)
5. JSON structure requirements are preserved in all prompts
6. Calculation methodology references are included
7. Condition-specific guidance references are included

**Test Cases for formatUserPrompt()**:
1. Patient demographics include clinical context
2. Activity level includes PAL factor reference
3. Nutritional targets include EFSA DRV references
4. Condition-specific information is structured appropriately
5. Optional fields are handled gracefully
6. Multi-day specific formatting is correct

**Test Cases for Helper Functions** (if implemented):
1. Condition detection correctly identifies CKD
2. Condition detection correctly identifies diabetes
3. Condition detection correctly identifies allergies
4. PAL factor mapping is correct for all activity levels
5. BMR equation suggestion is appropriate

### Integration Tests

**Test Cases**:
1. Create AI session with complete patient data → Verify enhanced prompts are used
2. Create AI session with minimal patient data → Verify prompts handle optional fields
3. Create AI session with CKD condition → Verify KDOQI references in prompt
4. Create AI session with diabetes → Verify ADA/EASD references in prompt
5. Send follow-up message → Verify stored enhanced system prompt is used
6. Create multi-day session → Verify multi-day specific enhancements

### Manual Testing

**Test Scenarios**:
1. Create meal plan for healthy adult → Verify clinical accuracy
2. Create meal plan for CKD patient → Verify KDOQI compliance
3. Create meal plan for diabetic patient → Verify diabetes guidelines
4. Create meal plan with allergies → Verify EAACI compliance
5. Create multi-day plan → Verify variety and clinical accuracy
6. Send correction messages → Verify AI maintains clinical context

## 14. Success Criteria

1. **Clinical Accuracy**: AI-generated meal plans align with clinical guidelines and professional standards
2. **Calculation Accuracy**: AI uses evidence-based calculation methodologies when applicable
3. **Condition-Specific Compliance**: AI appropriately applies condition-specific guidelines when relevant
4. **JSON Structure Preservation**: Enhanced prompts maintain existing JSON structure requirements
5. **Backward Compatibility**: Existing sessions continue to work with stored enhanced prompts
6. **Performance**: Prompt generation time remains acceptable (<100ms)
7. **Token Usage**: Enhanced prompts remain within reasonable token limits for AI models

## 15. Future Enhancements (Out of Scope)

The following enhancements are considered for future iterations but are not included in this implementation:

1. **Dynamic Guideline Retrieval**: Integration with Europe PMC or PubMed APIs to fetch latest guidelines
2. **Automated BMR Calculation**: Calculate BMR in the application and include in prompts
3. **Condition Detection AI**: Use AI to automatically detect conditions from free-text exclusions_guidelines
4. **Guideline Versioning**: Track which guideline versions are referenced in prompts
5. **Custom Guideline Integration**: Allow dietitians to add custom guidelines or preferences
6. **Prompt A/B Testing**: Test different prompt variations for optimal results

## 16. References

- **Clinical Guidelines Document**: `.ai/dietitian-guidelines.md`
- **Current Implementation**: `src/lib/ai/session.service.ts`
- **API Endpoints**: `src/pages/api/ai/sessions.ts`, `src/pages/api/ai/sessions/[id]/message.ts`
- **Types**: `src/types.ts`

## 17. Implementation Notes

1. **Prompt Length**: Enhanced prompts will be longer. Monitor token usage and AI model limits.
2. **Translation Quality**: Ensure Polish translations maintain clinical accuracy and terminology.
3. **Maintenance**: Clinical guidelines evolve. Plan for periodic prompt updates.
4. **Testing**: Focus on verifying AI responses show improved clinical accuracy, not just prompt content.
5. **Gradual Rollout**: Consider testing enhanced prompts with a subset of users before full deployment.

