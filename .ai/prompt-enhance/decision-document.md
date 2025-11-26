# AI Conversation Redesign - Decision Document

This document records all decisions made for the AI conversation redesign based on the research questions in `ai-conversation-redesign-questions.md`.

## Decision Rationale

Decisions are made considering:
- **MVP Scope**: Focus on core functionality, avoid over-engineering
- **Clinical Accuracy**: Balance between guideline compliance and practical implementation
- **User Experience**: Maintain simple workflow for dietitians
- **Technical Feasibility**: Prioritize implementable solutions within current architecture
- **Token Budget**: Keep prompts efficient while maintaining accuracy
- **Maintainability**: Choose approaches that are sustainable and updatable

---

## 1. Clinical Guidelines Integration Depth

### 1.1 Prompt Structure & Token Usage

**Question 1**: Should clinical guidelines be embedded directly in the system prompt, or referenced with brief citations?
**Decision**: **b) Brief citations and key principles**
**Rationale**: 
- Balances accuracy with token efficiency
- Allows for more comprehensive coverage without exceeding token limits
- Citations provide traceability while principles ensure application
- Easier to update when guidelines change

**Question 2**: How should we handle guideline updates and versioning in prompts?
**Decision**: **c) Include version dates in prompt citations**
**Rationale**:
- Provides traceability for clinical audit
- Helps dietitians understand guideline currency
- Allows for future version tracking
- Format: "EFSA DRVs (2023)", "ESPEN Guidelines 2023"

**Question 3**: Should we use dynamic prompt generation based on detected conditions?
**Decision**: **a) Include all general guidelines always, add condition-specific ones when detected**
**Rationale**:
- General guidelines (EFSA, FAO/WHO) are universally applicable
- Condition-specific guidelines only add when relevant
- Two-tier approach: foundation + context-specific additions
- Reduces token waste while maintaining completeness

### 1.2 Guideline Priority & Conflicts

**Question 4**: How should the AI handle conflicts between guideline sources?
**Decision**: **a) Prioritize EFSA for general nutrition, ESPEN for clinical conditions**
**Rationale**:
- Clear hierarchy prevents confusion
- EFSA is authoritative for general population nutrition
- ESPEN is authoritative for clinical/malnutrition scenarios
- Explicit priority rules ensure consistent application

**Question 5**: Should the AI cite specific guideline sources in responses?
**Decision**: **c) Cite sources only in comments field, not in meal plan structure**
**Rationale**:
- Keeps meal plan JSON structure clean
- Comments field is appropriate for educational/citation content
- Allows transparency without cluttering meal data
- Dietitian can review citations separately

### 1.3 Evidence-Based Decision Making

**Question 6**: How detailed should the AI's understanding of calculation methodologies be?
**Decision**: **b) AI should know the equations but rely on provided target_kcal when available**
**Rationale**:
- Respects dietitian's professional judgment
- AI has knowledge for verification/suggestions if needed
- Primary focus remains meal planning, not energy calculation
- Prevents over-automation in sensitive clinical decisions

**Question 7**: Should the AI verify provided target_kcal against calculated values?
**Decision**: **b) Verify but only mention in comments field if discrepancy**
**Rationale**:
- Provides helpful verification without overriding dietitian
- Comments field is non-intrusive notification
- Allows dietitian to review and decide
- Respects clinical judgment while providing safety net

---

## 2. Calculation Methodology Integration

### 2.1 BMR Calculation

**Question 8**: Should the application calculate BMR automatically and include in prompts?
**Decision**: **b) Provide patient data, let AI calculate BMR**
**Rationale**:
- Maintains current architecture (no server-side calculation needed yet)
- AI can calculate when needed for verification
- Future enhancement can add server-side calculation if desired
- Reduces complexity for MVP

**Question 9**: Which BMR equation should be the default/preferred method?
**Decision**: **a) Mifflin-St Jeor (recommended for adults)**
**Rationale**:
- Most accurate for general adult population
- Recommended in current implementation plan
- Well-established and widely accepted
- Note in prompt that this is preferred when calculation needed

**Question 10**: How should PAL factors be handled?
**Decision**: **a) Map activity_level directly to PAL ranges in prompt**
**Rationale**:
- Simple, implementable immediately
- Maps to existing form fields
- Provides AI with clear guidance
- No additional calculations needed for MVP

### 2.2 Illness Stress Factors

**Question 11**: How should illness stress factors from ESPEN be integrated?
**Decision**: **b) Include general ESPEN illness factor guidance in prompts, let AI apply when relevant**
**Rationale**:
- Doesn't require complex detection logic
- AI can identify illness indicators from exclusions_guidelines
- Provides guidance without forcing application
- Future enhancement: explicit form field if needed

**Question 12**: Should illness stress factors adjust energy requirements, protein requirements, or both?
**Decision**: **b) Only protein adjustments (energy already set by target_kcal)**
**Rationale**:
- Respects dietitian's energy target setting
- Protein adjustments are critical for clinical conditions
- Energy target_kcal is already dietitian-specified
- Focus on protein needs which are more condition-specific

### 2.3 Macronutrient Calculations

**Question 13**: Should the AI recalculate macronutrient grams from percentages?
**Decision**: **b) Use target_kcal and percentages as-is, calculate grams for meals**
**Rationale**:
- Trusts dietitian's macro distribution percentages
- AI's job is to create meals matching those targets
- Calculations needed for individual meals, not verification of targets
- Simpler implementation

**Question 14**: How should the AI handle macro percentages that don't sum to 100% or fall outside EFSA ranges?
**Decision**: **b) Warn in comments field about discrepancy**
**Rationale**:
- Non-intrusive notification
- Respects dietitian's clinical judgment
- Provides safety net for potential errors
- Allows dietitian to verify or correct

---

## 3. Condition-Specific Guidance

### 3.1 Condition Detection

**Question 15**: How sophisticated should condition detection from `exclusions_guidelines` be?
**Decision**: **a) Simple keyword matching (CKD, diabetes, allergy, etc.) - implementable immediately**
**Rationale**:
- MVP-appropriate solution
- Immediately implementable
- Covers common conditions
- Future enhancement: NLP-based detection if needed

**Question 16**: Should we provide a separate field for clinical conditions?
**Decision**: **c) Keep free-text but improve detection logic**
**Rationale**:
- No form changes needed (MVP scope)
- Maintains current workflow
- Simple keyword detection sufficient for now
- Future: structured field if detection proves insufficient

### 3.2 Condition-Specific Guidelines Application

**Question 17**: For CKD, should the AI apply KDOQI protein restrictions automatically?
**Decision**: **b) Mention KDOQI guidelines in comments, let dietitian specify exact targets**
**Rationale**:
- KDOQI targets vary by CKD stage
- Dietitian knows patient's specific stage
- AI provides framework, dietitian provides specifics
- Safer approach respecting clinical expertise

**Question 18**: For diabetes, should the AI focus on carbohydrate counting, glycemic index, or both?
**Decision**: **a) Carbohydrate counting (ADA/EASD primary focus)**
**Rationale**:
- ADA/EASD consensus emphasizes carb counting
- GI is supplementary consideration
- Primary focus on carb counting is clearer
- Can mention GI in comments if relevant

**Question 19**: For allergies/intolerances, should the AI follow EAACI cross-contamination prevention guidelines?
**Decision**: **c) Include general EAACI guidance, let dietitian specify details**
**Rationale**:
- Cross-contamination severity varies
- Some patients need strict protocols, others don't
- General guidance provides framework
- Dietitian tailors to patient's specific needs

### 3.3 Multi-Condition Handling

**Question 20**: How should the AI prioritize guidelines when a patient has multiple conditions?
**Decision**: **b) Apply condition-specific guidelines separately, warn about conflicts**
**Rationale**:
- Transparent approach shows all considerations
- Dietitian can see potential conflicts
- Allows for clinical judgment in resolution
- Safer than automatic prioritization

---

## 4. User Experience & Workflow Integration

### 4.1 Form Enhancements

**Question 21**: Should we add calculated fields (BMI, estimated BMR, estimated TEE) to the startup form?
**Decision**: **b) Calculate but don't display, only include in prompts**
**Rationale**:
- Reduces form clutter
- Calculations available to AI for verification
- Can be added to form in future if dietitians request
- Keeps MVP simple

**Question 22**: Should we provide macro distribution presets based on condition?
**Decision**: **c) No, keep manual entry, rely on AI to apply guidelines**
**Rationale**:
- Maintains current form simplicity
- Presets might not match patient-specific needs
- AI can guide through prompts
- Future: presets as optional helpers if needed

### 4.2 AI Response Format

**Question 23**: Should the AI's `comments` field include educational notes about guidelines applied?
**Decision**: **b) Only include if guidelines conflict with provided targets**
**Rationale**:
- Avoids unnecessary verbosity in standard cases
- Educational when there's a discrepancy to explain
- Keeps responses concise
- Dietitian can ask for explanation if needed

**Question 24**: Should the AI explain its reasoning for macro distribution or meal choices?
**Decision**: **c) No, focus on meal plan structure, reasoning available on request**
**Rationale**:
- Focuses on primary deliverable: meal plan
- Conversation allows for follow-up questions
- Reduces token usage and response length
- Maintains clean, actionable responses

### 4.3 Conversation Flow

**Question 25**: Should the AI proactively suggest improvements if targets seem non-optimal?
**Decision**: **b) Only suggest when targets are significantly outside guideline ranges**
**Rationale**:
- Respects dietitian's judgment for minor variations
- Flags potentially problematic deviations
- Non-intrusive but safety-focused
- Allows for intentional deviations when justified

**Question 26**: How should follow-up conversations handle guideline applications?
**Decision**: **a) AI should maintain same guideline context throughout conversation**
**Rationale**:
- Consistency in guideline application
- Context from initial prompt remains relevant
- Stored system prompt maintains context
- Follow-up modifications should still respect original guidelines

---

## 5. Implementation & Technical Considerations

### 5.1 Prompt Engineering

**Question 27**: Should we use few-shot examples of guideline-compliant meal plans in prompts?
**Decision**: **b) No, rely on guidelines text alone (fewer tokens, may need more iterations)**
**Rationale**:
- Token efficiency is important
- Guidelines text provides sufficient guidance
- Examples can be added in future if needed
- Can test without examples first, add if accuracy insufficient

**Question 28**: How should we structure the prompt to balance guideline integration with JSON structure requirements?
**Decision**: **c) Interleaved: guidelines within relevant sections of requirements**
**Rationale**:
- Guidelines contextualized where they apply
- JSON structure requirements remain clear
- Clinical accuracy embedded in practical requirements
- More natural flow for AI understanding

**Question 29**: Should we use chain-of-thought prompting?
**Decision**: **b) No, trust AI to apply guidelines without explicit steps**
**Rationale**:
- Modern AI models handle guideline application well
- Chain-of-thought adds tokens without clear benefit
- Simpler prompts are easier to maintain
- Can add if testing shows reasoning errors

### 5.2 Multi-Day Plans

**Question 30**: How should guideline application differ for multi-day vs single-day plans?
**Decision**: **b) Allow day-to-day variation within guideline ranges (more flexibility)**
**Rationale**:
- Provides flexibility for dietary variety
- Daily averages should meet guidelines
- More realistic meal planning
- Better patient adherence through variety

**Question 31**: Should variety requirements be informed by food-based dietary guidelines?
**Decision**: **c) Reference FBDGs but let dietitian's ensure_meal_variety flag control it**
**Rationale**:
- Respects dietitian's explicit variety request
- FBDGs provide general framework
- Flag provides clear instruction
- Balanced approach

### 5.3 Language & Localization

**Question 32**: Are there language-specific guideline considerations?
**Decision**: **a) EFSA applies to all EU, no language-specific differences**
**Rationale**:
- EFSA is pan-European authority
- Same guidelines apply regardless of language
- Clinical terminology consistent across EU
- Translation is only for explanations, not guidelines

**Question 33**: How should clinical terminology be handled in Polish translations?
**Decision**: **a) Use standard Polish medical terminology (requires medical translation)**
**Rationale**:
- Professional standards require proper medical terminology
- Ensures accuracy and credibility
- Dietitians expect proper terminology
- May require review by Polish-speaking dietitian

---

## 6. Validation & Quality Assurance

### 6.1 Response Validation

**Question 34**: Should we validate AI responses against guideline compliance programmatically?
**Decision**: **b) Validate only structure, trust AI for guideline compliance**
**Rationale**:
- JSON structure validation is critical for system functionality
- Guideline compliance is complex to validate programmatically
- Dietitian review is appropriate for clinical compliance
- Future: add guideline validation if patterns emerge

**Question 35**: How should we handle cases where AI responses don't comply with specified guidelines?
**Decision**: **c) Let dietitian correct through follow-up conversation**
**Rationale**:
- Iterative conversation is natural workflow
- Dietitian review catches non-compliance
- Follow-up corrections build on context
- Less complex than automated retry logic

### 6.2 Testing Strategy

**Question 36**: What test scenarios should we prioritize for guideline compliance?
**Decision**: **b) Condition-specific scenarios (CKD, diabetes, allergies) - highest risk**
**Rationale**:
- Highest clinical risk if guidelines misapplied
- Standard healthy adult scenarios lower risk
- Edge cases important but secondary priority
- Focus on scenarios where guideline compliance is critical

**Question 37**: Should we maintain a test suite of guideline-compliant meal plans?
**Decision**: **b) Yes, but use manual review, not automated comparison**
**Rationale**:
- Reference meal plans provide quality benchmarks
- Manual review allows for nuanced evaluation
- Automated comparison difficult for clinical compliance
- Use for regression testing and quality assurance

---

## 7. Advanced Features & Future Considerations

### 7.1 Dynamic Guideline Retrieval

**Question 38**: Should we integrate with Europe PMC or PubMed APIs to fetch latest guidelines dynamically?
**Decision**: **c) No, manual guideline updates sufficient for MVP (simplest, current approach)**
**Rationale**:
- MVP scope: avoid over-engineering
- Manual updates ensure quality control
- API integration adds complexity and potential failures
- Future enhancement if guideline currency becomes critical

### 7.2 User Customization

**Question 39**: Should dietitians be able to specify which guidelines to prioritize in preferences?
**Decision**: **c) No, standard guideline application for all users (consistency)**
**Rationale**:
- MVP simplicity: standard approach
- Consistency ensures quality
- Complexity of guideline prioritization
- Future: customization if users strongly request

**Question 40**: Should we allow dietitians to add custom guidelines or calculation methods?
**Decision**: **c) No, standard guidelines only (MVP simplicity)**
**Rationale**:
- Beyond MVP scope
- Adds significant complexity
- Validation and quality control challenges
- Future feature if high demand

### 7.3 Analytics & Feedback

**Question 41**: Should we track which guidelines are most frequently applied for analytics?
**Decision**: **b) Yes, but anonymized and aggregated**
**Rationale**:
- Provides insights for improvement
- Privacy-compliant approach
- Helps identify most relevant guidelines
- Non-intrusive implementation

**Question 42**: How should we collect feedback on guideline application accuracy?
**Decision**: **c) Monitor conversation corrections as implicit feedback**
**Rationale**:
- Non-intrusive approach
- Natural workflow provides feedback
- Dietitian corrections indicate issues
- Future: explicit feedback mechanism if needed

---

## 8. Risk & Compliance Considerations

### 8.1 Clinical Liability

**Question 43**: How should we disclaim that AI-generated plans are tools, not replacements for clinical judgment?
**Decision**: **c) Both prompt and UI disclaimers**
**Rationale**:
- Prompt disclaimer guides AI behavior
- UI disclaimer ensures user awareness
- Comprehensive protection
- Standard practice for clinical tools

**Question 44**: Should we require dietitian confirmation of guideline applications before saving plans?
**Decision**: **b) No, trust dietitian's review of final plan**
**Rationale**:
- Dietitian reviews plan before saving
- Additional confirmation step reduces UX flow
- Saving implies acceptance
- Future: optional confirmation if legal requirements change

### 8.2 Data Privacy

**Question 45**: Are there privacy considerations for storing guideline application logic in prompts?
**Decision**: **c) Current approach (storing prompts in database) acceptable if guidelines are references only**
**Rationale**:
- Guidelines are reference material, not patient data
- Patient data already stored in prompts (current approach)
- No additional privacy concerns from guideline references
- Existing privacy measures apply

---

## 9. Performance & Scalability

### 9.1 Token Usage

**Question 46**: What is the target token budget for enhanced prompts?
**Decision**: **a) Under 2000 tokens (current + ~500 for guidelines)**
**Rationale**:
- Current prompts ~1500 tokens
- ~500 tokens for guideline integration is reasonable
- Maintains efficiency
- Can optimize further if needed

**Question 47**: Should we use prompt compression techniques?
**Decision**: **a) Yes, compress guideline references to key principles only**
**Rationale**:
- Key principles sufficient for application
- Full excerpts unnecessary for AI understanding
- Maintains token budget
- Easier to maintain

### 9.2 Response Time

**Question 48**: How much additional response time is acceptable for guideline-enhanced prompts?
**Decision**: **a) Same as current (<5 seconds)**
**Rationale**:
- User experience should not degrade
- Additional tokens should not significantly impact response time
- Monitor and optimize if response time increases
- Modern AI models handle enhanced prompts efficiently

---

## 10. Integration with Existing Features

### 10.1 Edit Mode

**Question 49**: How should guideline application work when editing existing plans?
**Decision**: **b) Maintain original guideline context, only apply to new modifications**
**Rationale**:
- Preserves original plan intent
- Modifications respect original clinical context
- Less disruptive to dietitian workflow
- Re-application can be confusing

### 10.2 Export

**Question 50**: Should exported documents include references to guidelines used?
**Decision**: **b) Optional, allow dietitian to include/exclude citations**
**Rationale**:
- Flexibility for different use cases
- Some dietitians want citations, others don't
- Optional export options already exist (format, content sections)
- Future: default inclusion with toggle

---

## Summary of Key Decisions

### High-Level Approach
- **Brief citations and key principles** for guidelines (not full text)
- **Include general guidelines always**, condition-specific when detected
- **Prioritize EFSA for general**, ESPEN for clinical conditions
- **Cite sources in comments field** only
- **Trust dietitian's targets**, verify only in comments if discrepancy

### Implementation Priorities
1. **MVP Focus**: Simple keyword-based condition detection, no form changes
2. **Token Efficiency**: Compressed guideline references, under 2000 tokens
3. **User Experience**: Non-intrusive, respect dietitian judgment
4. **Clinical Safety**: Warnings in comments, not automatic corrections

### Future Enhancements (Out of Scope for MVP)
- Server-side BMR calculation
- NLP-based condition detection
- Guideline prioritization customization
- Dynamic guideline retrieval from APIs
- Explicit feedback mechanisms
- Automated guideline compliance validation

---

## Implementation Impact

### Files to Modify
- `src/lib/ai/session.service.ts` - `formatSystemPrompt()` and `formatUserPrompt()` functions

### No Breaking Changes
- All decisions maintain backward compatibility
- JSON structure unchanged
- API endpoints unchanged
- Form structure unchanged

### Testing Focus
- Condition-specific scenarios (CKD, diabetes, allergies)
- Guideline citation accuracy in comments
- Token usage monitoring
- Response time monitoring

---

**Last Updated**: 2025-01-26
**Status**: Decisions finalized, ready for implementation

