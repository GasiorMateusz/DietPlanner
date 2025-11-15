# AI Conversation Redesign - Research Questions

This document contains a comprehensive list of questions that should be answered before redesigning the AI conversation system to incorporate evidence-based clinical guidelines from `dietitian-guidelines.md`.

## Purpose

Based on deep research of:
- Current AI conversation implementation (`src/lib/ai/session.service.ts`)
- Dietitian guidelines document (`.ai/dietitian-guidelines.md`)
- Existing prompt enhancement plan (`.ai/prompt-enhance/prompt-enhancement-implementation-plan.md`)
- Project structure and requirements (`project-summary.md`, `README.md`)

These questions aim to:
1. Identify gaps between current implementation and professional standards
2. Explore integration depth and scope of clinical guidelines
3. Determine practical implementation strategies
4. Consider user experience and workflow integration
5. Address edge cases and advanced scenarios

---

## 1. Clinical Guidelines Integration Depth

### 1.1 Prompt Structure & Token Usage
1. Should clinical guidelines be embedded directly in the system prompt, or referenced with brief citations that guide the AI to apply them?
   - a) Full text excerpts from guidelines in prompts (higher accuracy, more tokens)
   - b) Brief citations and key principles (moderate accuracy, fewer tokens)
   - c) Reference framework with links/names (lower accuracy, minimal tokens)

2. How should we handle guideline updates and versioning in prompts?
   - a) Hardcode current guideline versions in prompts (requires manual updates)
   - b) Reference guideline sources without specific versions (flexibility, less precision)
   - c) Include version dates in prompt citations (traceability)

3. Should we use dynamic prompt generation based on detected conditions, or always include all relevant guidelines?
   - a) Include all general guidelines always, add condition-specific ones when detected
   - b) Only include guidelines relevant to detected conditions
   - c) Two-tier system: brief overview always, detailed guidelines on-demand

### 1.2 Guideline Priority & Conflicts
4. How should the AI handle conflicts or variations between different guideline sources (e.g., EFSA vs ESPEN for protein needs)?
   - a) Prioritize EFSA for general nutrition, ESPEN for clinical conditions
   - b) Present both options and explain differences
   - c) Use the most recent or most specific guideline for the context

5. Should the AI be instructed to cite specific guideline sources in its responses, or apply them implicitly?
   - a) Always cite sources when applying guidelines (transparency, longer responses)
   - b) Apply guidelines implicitly unless asked (shorter responses, less verbose)
   - c) Cite sources only in comments field, not in meal plan structure

### 1.3 Evidence-Based Decision Making
6. How detailed should the AI's understanding of calculation methodologies be?
   - a) AI should understand when to use which BMR equation (Schofield vs Mifflin-St Jeor vs Harris-Benedict)
   - b) AI should know the equations but rely on provided target_kcal when available
   - c) AI should focus on meal planning, not energy calculations (already provided)

7. Should the AI verify provided target_kcal against calculated values using BMR equations, or trust the dietitian's input?
   - a) Always verify and suggest corrections if significant discrepancy found
   - b) Verify but only mention in comments field if discrepancy
   - c) Trust dietitian's input, only use equations if target_kcal not provided

---

## 2. Calculation Methodology Integration

### 2.1 BMR Calculation
8. Should the application calculate BMR automatically and include it in prompts, or leave calculation to the AI?
   - a) Calculate BMR server-side, include in prompt (consistency, accuracy)
   - b) Provide patient data, let AI calculate BMR (flexibility, more AI work)
   - c) Only include BMR if dietitian manually enters it in form

9. Which BMR equation should be the default/preferred method?
   - a) Mifflin-St Jeor (recommended for adults by current implementation plan)
   - b) Harris-Benedict (traditional, well-established)
   - c) Dynamic selection based on patient age/gender (most accurate but complex)

10. How should PAL (Physical Activity Level) factors be handled?
    - a) Map activity_level directly to PAL ranges in prompt (current plan approach)
    - b) Calculate estimated TEE (Total Energy Expenditure) from BMR × PAL and include in prompt
    - c) Let AI apply PAL factors mentally without explicit calculation

### 2.2 Illness Stress Factors
11. How should illness stress factors from ESPEN be integrated?
    - a) Automatically detect illness indicators in exclusions_guidelines and apply stress factors
    - b) Include general ESPEN illness factor guidance in prompts, let AI apply when relevant
    - c) Add explicit "illness/inflammation" field to startup form for clarity

12. Should illness stress factors adjust energy requirements, protein requirements, or both?
    - a) Both energy and protein adjustments
    - b) Only protein adjustments (energy already set by target_kcal)
    - c) Guidance only, let dietitian specify targets explicitly

### 2.3 Macronutrient Calculations
13. Should the AI recalculate macronutrient grams from percentages, or trust the dietitian's targets?
    - a) Verify calculations: if target_kcal and percentages provided, calculate and verify grams
    - b) Use target_kcal and percentages as-is, calculate grams for meals
    - c) Accept macro distribution as guidance, focus on meal planning

14. How should the AI handle situations where provided macro percentages don't sum to 100% or fall outside EFSA ranges?
    - a) Automatically correct percentages to sum to 100% and/or adjust to EFSA ranges
    - b) Warn in comments field about discrepancy
    - c) Trust dietitian's input, assume intentional deviation

---

## 3. Condition-Specific Guidance

### 3.1 Condition Detection
15. How sophisticated should condition detection from `exclusions_guidelines` be?
    - a) Simple keyword matching (CKD, diabetes, allergy, etc.) - implementable immediately
    - b) Natural language processing to detect conditions - requires AI/NLP
    - c) Structured dropdown/checkboxes in form for common conditions - UX change

16. Should we provide a separate field for clinical conditions, or continue using `exclusions_guidelines` for everything?
    - a) Add dedicated "clinical_conditions" field to form
    - b) Enhance `exclusions_guidelines` with structured format/sections
    - c) Keep free-text but improve detection logic

### 3.2 Condition-Specific Guidelines Application
17. For CKD (Chronic Kidney Disease), should the AI apply KDOQI protein restrictions automatically or wait for explicit guidance?
    - a) Automatically apply KDOQI protein restrictions when CKD detected
    - b) Mention KDOQI guidelines in comments, let dietitian specify exact targets
    - c) Include KDOQI reference but trust exclusions_guidelines for specifics

18. For diabetes, should the AI focus on carbohydrate counting, glycemic index, or both?
    - a) Carbohydrate counting (ADA/EASD primary focus)
    - b) Both carb counting and GI considerations
    - c) Follow dietitian's exclusions_guidelines, use ADA/EASD for general framework

19. For allergies/intolerances, should the AI follow EAACI cross-contamination prevention guidelines implicitly?
    - a) Yes, automatically include cross-contamination warnings in preparation instructions
    - b) Only when explicitly mentioned in exclusions_guidelines
    - c) Include general EAACI guidance, let dietitian specify details

### 3.3 Multi-Condition Handling
20. How should the AI prioritize guidelines when a patient has multiple conditions (e.g., CKD + diabetes)?
    - a) Apply most restrictive guidelines for each macro (conservative approach)
    - b) Apply condition-specific guidelines separately, warn about conflicts
    - c) Require explicit prioritization from dietitian in exclusions_guidelines

---

## 4. User Experience & Workflow Integration

### 4.1 Form Enhancements
21. Should we add calculated fields (BMI, estimated BMR, estimated TEE) to the startup form for dietitian review?
    - a) Yes, calculate and display automatically when age/weight/height provided
    - b) Calculate but don't display, only include in prompts
    - c) No, keep form minimal, let dietitian calculate externally

22. Should we provide macro distribution presets based on condition (e.g., "Diabetic", "CKD", "Athletic")?
    - a) Yes, dropdown with condition-based presets
    - b) Yes, but only as suggestions/helpers, not defaults
    - c) No, keep manual entry, rely on AI to apply guidelines

### 4.2 AI Response Format
23. Should the AI's `comments` field include educational notes about guidelines applied?
    - a) Yes, always include brief notes about guidelines used (educational value)
    - b) Only include if guidelines conflict with provided targets
    - c) Minimal comments, let dietitian request explanations if needed

24. Should the AI explain its reasoning for macro distribution or meal choices in comments?
    - a) Yes, include clinical reasoning in comments (educational, longer responses)
    - b) Only when corrections/modifications are made
    - c) No, focus on meal plan structure, reasoning available on request

### 4.3 Conversation Flow
25. Should the AI proactively suggest improvements if provided targets seem non-optimal according to guidelines?
    - a) Yes, always suggest improvements in comments field
    - b) Only suggest when targets are significantly outside guideline ranges
    - c) No, trust dietitian's judgment, only apply guidelines when creating meals

26. How should follow-up conversations handle guideline applications?
    - a) AI should maintain same guideline context throughout conversation
    - b) AI should re-apply guidelines if modifications change patient profile
    - c) AI should focus on modifications, not re-apply all guidelines

---

## 5. Implementation & Technical Considerations

### 5.1 Prompt Engineering
27. Should we use few-shot examples of guideline-compliant meal plans in prompts?
    - a) Yes, include 1-2 examples showing guideline application (improves accuracy, more tokens)
    - b) No, rely on guidelines text alone (fewer tokens, may need more iterations)
    - c) Use examples only for complex conditions (selective approach)

28. How should we structure the prompt to balance guideline integration with JSON structure requirements?
    - a) Guidelines first, then JSON structure (emphasizes clinical accuracy)
    - b) JSON structure first, then guidelines (emphasizes format compliance)
    - c) Interleaved: guidelines within relevant sections of requirements

29. Should we use chain-of-thought prompting (e.g., "First calculate BMR, then apply PAL...")?
    - a) Yes, explicitly guide calculation steps in prompt
    - b) No, trust AI to apply guidelines without explicit steps
    - c) Only for complex multi-condition cases

### 5.2 Multi-Day Plans
30. How should guideline application differ for multi-day vs single-day plans?
    - a) Apply guidelines consistently across all days (ensures compliance)
    - b) Allow day-to-day variation within guideline ranges (more flexibility)
    - c) Apply guidelines to averages/summary, individual days can vary

31. Should variety requirements (ensure_meal_variety) be informed by guidelines (e.g., food-based dietary guidelines)?
    - a) Yes, include FBDG variety recommendations in prompts
    - b) No, variety is a separate concern from guidelines
    - c) Reference FBDGs but let dietitian's ensure_meal_variety flag control it

### 5.3 Language & Localization
32. Are there language-specific guideline considerations (e.g., Polish vs EU guidelines)?
    - a) EFSA applies to all EU, no language-specific differences
    - b) Include national Polish guidelines in addition to EFSA
    - c) Use same guidelines, only language of explanation differs

33. How should clinical terminology be handled in Polish translations?
    - a) Use standard Polish medical terminology (requires medical translation)
    - b) Use direct translations with English terms in parentheses
    - c) Use English terms for guidelines (EFSA, ESPEN), translate explanations

---

## 6. Validation & Quality Assurance

### 6.1 Response Validation
34. Should we validate AI responses against guideline compliance programmatically?
    - a) Yes, validate macro distributions against EFSA ranges
    - b) Validate only structure, trust AI for guideline compliance
    - c) No validation, rely on dietitian review

35. How should we handle cases where AI responses don't comply with specified guidelines?
    - a) Retry with stronger guideline emphasis in prompt
    - b) Accept response, flag in comments field
    - c) Let dietitian correct through follow-up conversation

### 6.2 Testing Strategy
36. What test scenarios should we prioritize for guideline compliance?
    - a) Standard healthy adult scenarios (most common)
    - b) Condition-specific scenarios (CKD, diabetes, allergies) - highest risk
    - c) Edge cases (multiple conditions, extreme targets) - quality assurance

37. Should we maintain a test suite of guideline-compliant meal plans for comparison?
    - a) Yes, create reference meal plans based on guidelines for regression testing
    - b) Yes, but use manual review, not automated comparison
    - c) No, rely on manual testing and dietitian feedback

---

## 7. Advanced Features & Future Considerations

### 7.1 Dynamic Guideline Retrieval
38. Should we integrate with Europe PMC or PubMed APIs to fetch latest guidelines dynamically?
    - a) Yes, fetch latest guidelines at prompt generation time (most current, complex)
    - b) Yes, but cache guidelines and update periodically (balance of current vs performance)
    - c) No, manual guideline updates sufficient for MVP (simplest, current approach)

### 7.2 User Customization
39. Should dietitians be able to specify which guidelines to prioritize in their preferences?
    - a) Yes, add guideline preference settings to user preferences
    - b) Yes, but only for advanced users, keep simple for most
    - c) No, standard guideline application for all users (consistency)

40. Should we allow dietitians to add custom guidelines or calculation methods?
    - a) Yes, full customization support (powerful but complex)
    - b) Yes, but limited to predefined guideline sets
    - c) No, standard guidelines only (MVP simplicity)

### 7.3 Analytics & Feedback
41. Should we track which guidelines are most frequently applied for analytics?
    - a) Yes, log guideline applications for future improvements
    - b) Yes, but anonymized and aggregated
    - c) No, focus on functionality over analytics

42. How should we collect feedback on guideline application accuracy?
    - a) In-app feedback mechanism after meal plan generation
    - b) Periodic surveys to dietitians
    - c) Monitor conversation corrections as implicit feedback

---

## 8. Risk & Compliance Considerations

### 8.1 Clinical Liability
43. How should we disclaim that AI-generated plans are tools, not replacements for clinical judgment?
    - a) Include disclaimer in system prompt (guides AI responses)
    - b) Display disclaimer in UI before plan generation
    - c) Both prompt and UI disclaimers

44. Should we require dietitian confirmation of guideline applications before saving plans?
    - a) Yes, show summary of guidelines applied and require confirmation
    - b) No, trust dietitian's review of final plan
    - c) Optional, allow dietitian to toggle guideline auto-application

### 8.2 Data Privacy
45. Are there privacy considerations for storing guideline application logic in prompts (contains patient data)?
    - a) Guidelines are reference material, no patient data concerns
    - b) Need to ensure prompts don't inadvertently store sensitive patient information
    - c) Current approach (storing prompts in database) acceptable if guidelines are references only

---

## 9. Performance & Scalability

### 9.1 Token Usage
46. What is the target token budget for enhanced prompts?
    - a) Under 2000 tokens (current + ~500 for guidelines)
    - b) Under 4000 tokens (more detailed guidelines)
    - c) No strict limit, optimize for accuracy over tokens

47. Should we use prompt compression techniques (summarization, key points only)?
    - a) Yes, compress guideline references to key principles only
    - b) No, use full guideline excerpts for maximum accuracy
    - c) Hybrid: full guidelines for system prompt, compressed for follow-ups

### 9.2 Response Time
48. How much additional response time is acceptable for guideline-enhanced prompts?
    - a) Same as current (<5 seconds)
    - b) Up to 10 seconds acceptable for better accuracy
    - c) No strict limit, prioritize accuracy

---

## 10. Integration with Existing Features

### 10.1 Edit Mode
49. How should guideline application work when editing existing plans?
    - a) Re-apply guidelines to modified plan (ensures continued compliance)
    - b) Maintain original guideline context, only apply to new modifications
    - c) Let dietitian decide: "re-apply guidelines" option in edit mode

### 10.2 Export
50. Should exported documents include references to guidelines used?
    - a) Yes, include guideline citations in exported .doc files
    - b) Optional, allow dietitian to include/exclude citations
    - c) No, keep exports focused on meal plan content only

---

## Next Steps

After answering these questions, the following documents should be created:

1. **Decision Document**: Record all answers to guide implementation
2. **Enhanced Prompt Templates**: Updated system and user prompts based on decisions
3. **Implementation Roadmap**: Phased approach prioritizing high-impact, low-risk enhancements
4. **Testing Plan**: Comprehensive test scenarios based on priority decisions
5. **Guideline Reference Library**: Structured reference materials for prompt generation

---

## Related Documents

- Current Implementation: `src/lib/ai/session.service.ts`
- Dietitian Guidelines: `.ai/dietitian-guidelines.md`
- Previous Enhancement Plan: `.ai/prompt-enhance/prompt-enhancement-implementation-plan.md`
- Project Summary: `.ai/docs/project-summary.md`
- API Endpoints: `src/pages/api/ai/sessions.ts`, `src/pages/api/ai/sessions/[id]/message.ts`

