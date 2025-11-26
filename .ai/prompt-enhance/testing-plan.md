# AI Conversation Redesign - Testing Plan

This document provides a comprehensive testing plan for the AI conversation redesign that integrates evidence-based clinical guidelines. The plan covers unit tests, integration tests, and manual testing scenarios.

## Testing Strategy

### Test Priorities

1. **Condition-specific scenarios** (CKD, diabetes, allergies) - Highest risk if guidelines misapplied
2. **Standard healthy adult scenarios** - Most common use case
3. **Edge cases** (multiple conditions, extreme targets) - Quality assurance

### Test Coverage Goals

- **Unit Tests**: > 80% coverage for new code
- **Integration Tests**: All major user flows
- **Manual Tests**: Condition-specific scenarios and edge cases

---

## Unit Tests

### Test File: `src/test/unit/lib/ai/session.service.test.ts`

#### 1. System Prompt Generation Tests

**Test 1.1: Single-Day English Prompt Includes Guidelines**
```typescript
test("formatSystemPrompt() includes clinical guidelines for single-day English", () => {
  const prompt = formatSystemPrompt("en", false);
  
  expect(prompt).toContain("EFSA");
  expect(prompt).toContain("ESPEN");
  expect(prompt).toContain("FAO/WHO/UNU");
  expect(prompt).toContain("SACN");
  expect(prompt).toContain("disclaimer");
  expect(prompt).toContain("Mifflin-St Jeor");
  expect(prompt).toContain("PAL");
});
```

**Test 1.2: Multi-Day English Prompt Includes Guidelines**
```typescript
test("formatSystemPrompt() includes clinical guidelines for multi-day English", () => {
  const prompt = formatSystemPrompt("en", true);
  
  expect(prompt).toContain("EFSA");
  expect(prompt).toContain("multi_day_plan");
  expect(prompt).toContain("FBDG");
});
```

**Test 1.3: Single-Day Polish Prompt Includes Guidelines**
```typescript
test("formatSystemPrompt() includes clinical guidelines for single-day Polish", () => {
  const prompt = formatSystemPrompt("pl", false);
  
  expect(prompt).toContain("EFSA");
  expect(prompt).toContain("ESPEN");
  expect(prompt).toContain("meal_plan");
  expect(prompt).toContain("nie zastępuje");
});
```

**Test 1.4: Multi-Day Polish Prompt Includes Guidelines**
```typescript
test("formatSystemPrompt() includes clinical guidelines for multi-day Polish", () => {
  const prompt = formatSystemPrompt("pl", true);
  
  expect(prompt).toContain("EFSA");
  expect(prompt).toContain("multi_day_plan");
  expect(prompt).toContain("wielodniowy");
});
```

**Test 1.5: JSON Structure Requirements Preserved**
```typescript
test("formatSystemPrompt() preserves JSON structure requirements", () => {
  const singleDay = formatSystemPrompt("en", false);
  const multiDay = formatSystemPrompt("en", true);
  
  expect(singleDay).toContain('"meal_plan"');
  expect(singleDay).toContain('"daily_summary"');
  expect(singleDay).toContain('"meals"');
  
  expect(multiDay).toContain('"multi_day_plan"');
  expect(multiDay).toContain('"days"');
  expect(multiDay).toContain('"summary"');
});
```

**Test 1.6: Token Count Under 2000**
```typescript
test("formatSystemPrompt() generates prompts under 2000 tokens", () => {
  const singleDayEn = formatSystemPrompt("en", false);
  const multiDayEn = formatSystemPrompt("en", true);
  const singleDayPl = formatSystemPrompt("pl", false);
  const multiDayPl = formatSystemPrompt("pl", true);
  
  // Rough estimate: 1 token ≈ 4 characters
  expect(singleDayEn.length / 4).toBeLessThan(2000);
  expect(multiDayEn.length / 4).toBeLessThan(2000);
  expect(singleDayPl.length / 4).toBeLessThan(2000);
  expect(multiDayPl.length / 4).toBeLessThan(2000);
});
```

#### 2. User Prompt Generation Tests

**Test 2.1: User Prompt Includes PAL Factor Mapping**
```typescript
test("formatUserPrompt() includes PAL factor for activity level", () => {
  const command: CreateAiSessionCommand = {
    activity_level: "moderate",
    target_kcal: 2000,
  };
  
  const prompt = formatUserPrompt(command, "en", false);
  
  expect(prompt).toContain("PAL");
  expect(prompt).toContain("1.6-1.7");
  expect(prompt).toContain("moderate");
});
```

**Test 2.2: User Prompt Includes Macro Calculations**
```typescript
test("formatUserPrompt() includes macro gram calculations", () => {
  const command: CreateAiSessionCommand = {
    target_kcal: 2000,
    target_macro_distribution: {
      p_perc: 25,
      f_perc: 30,
      c_perc: 45,
    },
  };
  
  const prompt = formatUserPrompt(command, "en", false);
  
  expect(prompt).toContain("EFSA %EI ranges");
  expect(prompt).toContain("Protein 25%");
  expect(prompt).toContain("Fat 30%");
  expect(prompt).toContain("Carbohydrates 45%");
});
```

**Test 2.3: User Prompt Handles Optional Fields Gracefully**
```typescript
test("formatUserPrompt() handles missing optional fields", () => {
  const command: CreateAiSessionCommand = {
    target_kcal: 2000,
  };
  
  const prompt = formatUserPrompt(command, "en", false);
  
  expect(prompt).not.toContain("undefined");
  expect(prompt).not.toContain("null");
  expect(prompt).toContain("meal plan");
});
```

**Test 2.4: User Prompt Includes Clinical Context for CKD**
```typescript
test("formatUserPrompt() includes clinical context when CKD detected", () => {
  const command: CreateAiSessionCommand = {
    exclusions_guidelines: "Chronic kidney disease, low protein",
    target_kcal: 1800,
  };
  
  const prompt = formatUserPrompt(command, "en", false);
  
  expect(prompt).toContain("CLINICAL CONTEXT");
  expect(prompt).toContain("CKD");
  expect(prompt).toContain("KDOQI");
});
```

**Test 2.5: User Prompt Includes Clinical Context for Diabetes**
```typescript
test("formatUserPrompt() includes clinical context when diabetes detected", () => {
  const command: CreateAiSessionCommand = {
    exclusions_guidelines: "Type 2 diabetes, insulin dependent",
    target_kcal: 2000,
  };
  
  const prompt = formatUserPrompt(command, "en", false);
  
  expect(prompt).toContain("CLINICAL CONTEXT");
  expect(prompt).toContain("diabetes");
  expect(prompt).toContain("ADA/EASD");
});
```

**Test 2.6: User Prompt Includes Clinical Context for Allergies**
```typescript
test("formatUserPrompt() includes clinical context when allergies detected", () => {
  const command: CreateAiSessionCommand = {
    exclusions_guidelines: "Peanut allergy, tree nut intolerance",
    target_kcal: 2000,
  };
  
  const prompt = formatUserPrompt(command, "en", false);
  
  expect(prompt).toContain("CLINICAL CONTEXT");
  expect(prompt).toContain("allergies");
  expect(prompt).toContain("EAACI");
});
```

**Test 2.7: User Prompt Handles Multiple Conditions**
```typescript
test("formatUserPrompt() includes multiple clinical contexts when multiple conditions detected", () => {
  const command: CreateAiSessionCommand = {
    exclusions_guidelines: "CKD and diabetes, low protein and carb counting",
    target_kcal: 1800,
  };
  
  const prompt = formatUserPrompt(command, "en", false);
  
  expect(prompt).toContain("CKD");
  expect(prompt).toContain("diabetes");
  expect(prompt).toContain("KDOQI");
  expect(prompt).toContain("ADA/EASD");
});
```

---

### Test File: `src/test/unit/lib/ai/clinical-context.helpers.test.ts`

#### 3. Condition Detection Tests

**Test 3.1: Detect CKD from Exclusions**
```typescript
test("detectConditions() detects CKD from exclusions", () => {
  const result = detectConditions("Chronic kidney disease, low protein diet");
  
  expect(result.hasCKD).toBe(true);
  expect(result.hasDiabetes).toBe(false);
  expect(result.hasAllergies).toBe(false);
});
```

**Test 3.2: Detect Diabetes from Exclusions**
```typescript
test("detectConditions() detects diabetes from exclusions", () => {
  const result = detectConditions("Type 2 diabetes, insulin dependent");
  
  expect(result.hasCKD).toBe(false);
  expect(result.hasDiabetes).toBe(true);
  expect(result.hasAllergies).toBe(false);
});
```

**Test 3.3: Detect Allergies from Exclusions**
```typescript
test("detectConditions() detects allergies from exclusions", () => {
  const result = detectConditions("Peanut allergy, severe reaction");
  
  expect(result.hasCKD).toBe(false);
  expect(result.hasDiabetes).toBe(false);
  expect(result.hasAllergies).toBe(true);
});
```

**Test 3.4: Detect Illness from Exclusions**
```typescript
test("detectConditions() detects illness from exclusions", () => {
  const result = detectConditions("Post-surgery recovery, inflammation present");
  
  expect(result.hasCKD).toBe(false);
  expect(result.hasIllness).toBe(true);
});
```

**Test 3.5: Detect Multiple Conditions**
```typescript
test("detectConditions() detects multiple conditions", () => {
  const result = detectConditions("CKD and diabetes, low protein and carb counting");
  
  expect(result.hasCKD).toBe(true);
  expect(result.hasDiabetes).toBe(true);
});
```

**Test 3.6: Handle Null Exclusions**
```typescript
test("detectConditions() returns false for all conditions when exclusions null", () => {
  const result = detectConditions(null);
  
  expect(result.hasCKD).toBe(false);
  expect(result.hasDiabetes).toBe(false);
  expect(result.hasAllergies).toBe(false);
  expect(result.hasIllness).toBe(false);
});
```

**Test 3.7: Case Insensitive Detection**
```typescript
test("detectConditions() is case insensitive", () => {
  const result = detectConditions("CHRONIC KIDNEY DISEASE");
  
  expect(result.hasCKD).toBe(true);
});
```

#### 4. PAL Factor Mapping Tests

**Test 4.1: Map Sedentary to PAL Range**
```typescript
test("getPALFactorRange() maps sedentary to correct PAL range", () => {
  const palRange = getPALFactorRange("sedentary");
  
  expect(palRange).toBe("1.2-1.3");
});
```

**Test 4.2: Map Light to PAL Range**
```typescript
test("getPALFactorRange() maps light to correct PAL range", () => {
  const palRange = getPALFactorRange("light");
  
  expect(palRange).toBe("1.4-1.5");
});
```

**Test 4.3: Map Moderate to PAL Range**
```typescript
test("getPALFactorRange() maps moderate to correct PAL range", () => {
  const palRange = getPALFactorRange("moderate");
  
  expect(palRange).toBe("1.6-1.7");
});
```

**Test 4.4: Map High to PAL Range**
```typescript
test("getPALFactorRange() maps high to correct PAL range", () => {
  const palRange = getPALFactorRange("high");
  
  expect(palRange).toBe("1.8-2.0");
});
```

**Test 4.5: Handle Null Activity Level**
```typescript
test("getPALFactorRange() returns null for null activity level", () => {
  const palRange = getPALFactorRange(null);
  
  expect(palRange).toBeNull();
});
```

**Test 4.6: Handle Unknown Activity Level**
```typescript
test("getPALFactorRange() returns null for unknown activity level", () => {
  const palRange = getPALFactorRange("unknown");
  
  expect(palRange).toBeNull();
});
```

---

## Integration Tests

### Test File: `src/test/integration/ai/session-conditions.test.ts`

#### 5. Condition-Specific Integration Tests

**Test 5.1: Create Session with CKD Condition**
```typescript
test("POST /api/ai/sessions includes KDOQI context for CKD condition", async () => {
  const command: CreateAiSessionCommand = {
    patient_age: 55,
    patient_weight: 75,
    patient_height: 170,
    activity_level: "sedentary",
    target_kcal: 1800,
    target_macro_distribution: {
      p_perc: 15, // Low protein for CKD
      f_perc: 30,
      c_perc: 55,
    },
    exclusions_guidelines: "Chronic kidney disease stage 3, low protein",
    meal_names: "Breakfast, Lunch, Dinner",
  };
  
  const response = await createSession(
    command,
    userId,
    supabase,
    "en"
  );
  
  // Verify session created successfully
  expect(response.session_id).toBeDefined();
  expect(response.message).toBeDefined();
  
  // Verify stored prompt includes CKD context
  const { data: session } = await supabase
    .from("ai_chat_sessions")
    .select("message_history")
    .eq("id", response.session_id)
    .single();
  
  const history = session?.message_history as ChatMessage[];
  const userPrompt = history.find(msg => msg.role === "user" && !msg.content.startsWith("[SYSTEM]"));
  
  expect(userPrompt?.content).toContain("CKD");
  expect(userPrompt?.content).toContain("KDOQI");
});
```

**Test 5.2: Create Session with Diabetes Condition**
```typescript
test("POST /api/ai/sessions includes ADA/EASD context for diabetes condition", async () => {
  const command: CreateAiSessionCommand = {
    patient_age: 45,
    patient_weight: 80,
    target_kcal: 2000,
    exclusions_guidelines: "Type 2 diabetes, carbohydrate counting required",
    meal_names: "Breakfast, Lunch, Dinner, Snack",
  };
  
  const response = await createSession(
    command,
    userId,
    supabase,
    "en"
  );
  
  const { data: session } = await supabase
    .from("ai_chat_sessions")
    .select("message_history")
    .eq("id", response.session_id)
    .single();
  
  const history = session?.message_history as ChatMessage[];
  const userPrompt = history.find(msg => msg.role === "user" && !msg.content.startsWith("[SYSTEM]"));
  
  expect(userPrompt?.content).toContain("diabetes");
  expect(userPrompt?.content).toContain("ADA/EASD");
});
```

**Test 5.3: Create Session with Allergies**
```typescript
test("POST /api/ai/sessions includes EAACI context for allergies", async () => {
  const command: CreateAiSessionCommand = {
    target_kcal: 2000,
    exclusions_guidelines: "Peanut allergy, tree nut allergy, severe reactions",
    meal_names: "Breakfast, Lunch, Dinner",
  };
  
  const response = await createSession(
    command,
    userId,
    supabase,
    "en"
  );
  
  const { data: session } = await supabase
    .from("ai_chat_sessions")
    .select("message_history")
    .eq("id", response.session_id)
    .single();
  
  const history = session?.message_history as ChatMessage[];
  const userPrompt = history.find(msg => msg.role === "user" && !msg.content.startsWith("[SYSTEM]"));
  
  expect(userPrompt?.content).toContain("allergies");
  expect(userPrompt?.content).toContain("EAACI");
});
```

**Test 5.4: Create Multi-Day Session with Conditions**
```typescript
test("POST /api/ai/sessions includes condition context for multi-day plans", async () => {
  const command: CreateAiSessionCommand = {
    target_kcal: 2000,
    exclusions_guidelines: "CKD stage 3",
    number_of_days: 3,
    ensure_meal_variety: true,
    meal_names: "Breakfast, Lunch, Dinner",
  };
  
  const response = await createSession(
    command,
    userId,
    supabase,
    "en"
  );
  
  const { data: session } = await supabase
    .from("ai_chat_sessions")
    .select("message_history")
    .eq("id", response.session_id)
    .single();
  
  const history = session?.message_history as ChatMessage[];
  const systemPrompt = history.find(msg => msg.content.startsWith("[SYSTEM]"));
  
  expect(systemPrompt?.content).toContain("multi_day_plan");
  expect(systemPrompt?.content).toContain("EFSA");
});
```

---

### Test File: `src/test/integration/ai/guideline-compliance.test.ts`

#### 6. Guideline Compliance Tests

**Test 6.1: AI Response Includes Guideline Citations in Comments**
```typescript
test("AI response includes guideline citations when conditions present", async () => {
  const command: CreateAiSessionCommand = {
    target_kcal: 1800,
    exclusions_guidelines: "CKD stage 3, low protein",
    meal_names: "Breakfast, Lunch, Dinner",
  };
  
  const response = await createSession(
    command,
    userId,
    supabase,
    "en"
  );
  
  // Parse AI response
  const aiMessage = response.message;
  const mealPlan = JSON.parse(aiMessage.content);
  
  // Verify comments field includes guideline citation
  if (mealPlan.comments) {
    expect(mealPlan.comments.toLowerCase()).toMatch(/kdoqi|guideline|clinical/);
  }
});
```

**Test 6.2: AI Response Respects Macro Distribution Ranges**
```typescript
test("AI response respects EFSA macro distribution ranges", async () => {
  const command: CreateAiSessionCommand = {
    target_kcal: 2000,
    target_macro_distribution: {
      p_perc: 25, // Within EFSA range (10-35%)
      f_perc: 30, // Within EFSA range (20-35%)
      c_perc: 45, // Within EFSA range (45-65%)
    },
    meal_names: "Breakfast, Lunch, Dinner",
  };
  
  const response = await createSession(
    command,
    userId,
    supabase,
    "en"
  );
  
  const aiMessage = response.message;
  const mealPlan = JSON.parse(aiMessage.content);
  
  // Verify macro distribution matches targets
  const totalMacros = mealPlan.meal_plan.daily_summary.proteins * 4 +
                       mealPlan.meal_plan.daily_summary.fats * 9 +
                       mealPlan.meal_plan.daily_summary.carbs * 4;
  
  expect(totalMacros).toBeCloseTo(2000, -2); // Within 100 kcal
});
```

---

## Manual Test Scenarios

### Scenario 1: Standard Healthy Adult

**Setup**:
- Patient: 30 years, 70 kg, 170 cm
- Activity: Moderate
- Target: 2000 kcal, Protein 25%, Fat 30%, Carbs 45%
- No dietary restrictions

**Expected**:
- Meal plan meets target calories and macros
- PAL factor 1.6-1.7 mentioned in user prompt
- EFSA range validation in user prompt
- AI response creates appropriate meals
- No condition-specific context in comments

**Validation**:
- Verify meal plan nutritional values match targets
- Check PAL factor mentioned in prompts
- Verify EFSA references in system prompt

---

### Scenario 2: CKD Patient

**Setup**:
- Patient: 60 years, 80 kg, 175 cm
- Activity: Sedentary
- Target: 1800 kcal, Protein 15% (low protein for CKD), Fat 30%, Carbs 55%
- Exclusions: "Chronic kidney disease stage 3, low protein, low phosphorus"

**Expected**:
- CLINICAL CONTEXT section in user prompt includes CKD and KDOQI
- AI response respects low protein target
- Comments field mentions KDOQI guidelines if applicable
- Meal plan avoids high-phosphorus foods

**Validation**:
- Verify CKD detection in user prompt
- Check KDOQI reference in clinical context
- Verify protein targets respected
- Check comments for guideline citations

---

### Scenario 3: Diabetic Patient

**Setup**:
- Patient: 50 years, 85 kg, 180 cm
- Activity: Light
- Target: 2000 kcal, Protein 20%, Fat 30%, Carbs 50%
- Exclusions: "Type 2 diabetes, carbohydrate counting, avoid high GI foods"

**Expected**:
- CLINICAL CONTEXT section includes diabetes and ADA/EASD
- AI response focuses on carbohydrate counting
- Meal plan includes carb amounts per meal
- Comments mention ADA/EASD if applicable

**Validation**:
- Verify diabetes detection in user prompt
- Check ADA/EASD reference in clinical context
- Verify carbohydrate amounts specified
- Check comments for guideline citations

---

### Scenario 4: Allergies/Intolerances

**Setup**:
- Patient: 35 years, 65 kg, 165 cm
- Activity: Moderate
- Target: 2000 kcal, Standard macro distribution
- Exclusions: "Severe peanut allergy, tree nut allergy, cross-contamination risk"

**Expected**:
- CLINICAL CONTEXT section includes allergies and EAACI
- AI response avoids allergens completely
- Preparation instructions consider cross-contamination
- Comments mention EAACI if applicable

**Validation**:
- Verify allergy detection in user prompt
- Check EAACI reference in clinical context
- Verify no allergens in ingredients
- Check preparation instructions for safety

---

### Scenario 5: Multiple Conditions

**Setup**:
- Patient: 65 years, 75 kg, 170 cm
- Activity: Sedentary
- Target: 1800 kcal, Low protein (15%)
- Exclusions: "CKD stage 3 and Type 2 diabetes, low protein and carb counting"

**Expected**:
- CLINICAL CONTEXT section includes both CKD and diabetes
- AI response respects both low protein and carb counting
- Comments mention both KDOQI and ADA/EASD if applicable
- Meal plan balances both requirements

**Validation**:
- Verify both conditions detected
- Check both guideline references in clinical context
- Verify meal plan meets both requirements
- Check comments for conflict warnings

---

### Scenario 6: Multi-Day Plan with Variety

**Setup**:
- Patient: 40 years, 70 kg, 175 cm
- Activity: Moderate
- Target: 2000 kcal, Standard macro distribution
- Number of days: 3
- Ensure meal variety: Yes
- No dietary restrictions

**Expected**:
- FBDG mentioned in system prompt for variety
- Multi-day structure in system prompt
- AI response creates varied meals across days
- Average macros match targets
- Day-to-day variation within guideline ranges

**Validation**:
- Verify FBDG reference in system prompt
- Check multi-day structure
- Verify meal variety across days
- Check average calculations

---

### Scenario 7: Non-Optimal Targets (Warning Test)

**Setup**:
- Patient: 30 years, 70 kg, 170 cm
- Activity: Moderate
- Target: 2000 kcal, Protein 50% (outside EFSA range 10-35%), Fat 20%, Carbs 30%
- No dietary restrictions

**Expected**:
- AI response creates meal plan
- Comments field includes warning about macro distribution outside EFSA ranges
- Meal plan still matches provided targets (dietitian's judgment)

**Validation**:
- Verify warning in comments field
- Check EFSA range violation mentioned
- Verify meal plan respects provided targets
- Confirm no automatic correction

---

## Performance Tests

### Test 1: Token Usage

**Objective**: Verify prompts stay under 2000 tokens

**Steps**:
1. Generate prompts for all language/plan type combinations
2. Calculate token count (rough estimate: 1 token ≈ 4 characters)
3. Verify all prompts < 2000 tokens

**Expected**: All prompts under 2000 tokens

---

### Test 2: Response Time

**Objective**: Verify response time not significantly impacted

**Steps**:
1. Create AI sessions with enhanced prompts
2. Measure response time
3. Compare to baseline response times

**Expected**: Response time < 5 seconds (same as current)

---

## Regression Tests

### Test 1: Backward Compatibility

**Objective**: Ensure existing functionality still works

**Steps**:
1. Create AI session with minimal data (just target_kcal)
2. Verify session created successfully
3. Send follow-up message
4. Verify conversation continues correctly

**Expected**: All existing functionality works

---

### Test 2: JSON Structure Preservation

**Objective**: Ensure JSON structure unchanged

**Steps**:
1. Generate meal plans with enhanced prompts
2. Parse JSON responses
3. Verify structure matches expected schema
4. Verify all required fields present

**Expected**: JSON structure unchanged, validation passes

---

## Test Data

### Reference Meal Plans

Create reference meal plans for comparison:

1. **Healthy Adult Reference**: Standard 2000 kcal plan with balanced macros
2. **CKD Reference**: 1800 kcal plan with low protein (15%)
3. **Diabetes Reference**: 2000 kcal plan with carb counting
4. **Allergies Reference**: 2000 kcal plan avoiding common allergens

These reference plans can be used for manual comparison and regression testing.

---

## Test Execution Schedule

1. **Unit Tests**: Run on every commit (CI/CD)
2. **Integration Tests**: Run on pull requests
3. **Manual Tests**: Run before production deployment
4. **Performance Tests**: Run weekly or after major changes
5. **Regression Tests**: Run before production deployment

---

**Last Updated**: 2025-01-26
**Status**: Ready for implementation

