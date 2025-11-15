# AI Conversation Redesign - Implementation Roadmap

This document provides a phased implementation roadmap for integrating evidence-based clinical guidelines into the AI conversation system, based on decisions in `decision-document.md` and templates in `enhanced-prompt-templates.md`.

## Overview

**Total Phases**: 4  
**Estimated Duration**: 6-8 weeks  
**Risk Level**: Low-Medium (enhancement of existing functionality, no breaking changes)

---

## Phase 1: Foundation & Core Integration (Week 1-2)

**Goal**: Implement core guideline integration into system prompts without condition detection.

### Deliverables
1. Enhanced system prompts (English, single-day and multi-day)
2. Enhanced system prompts (Polish, single-day and multi-day)
3. Unit tests for prompt generation
4. Token usage validation

### Tasks

#### 1.1 Update System Prompts (English)
- [ ] Modify `formatSystemPrompt()` in `src/lib/ai/session.service.ts`
- [ ] Add clinical guidelines section (EFSA, ESPEN, NICE, FAO/WHO/UNU, SACN)
- [ ] Add calculation methodology section (BMR equations, PAL factors)
- [ ] Add condition-specific guideline references (general framework)
- [ ] Update disclaimer and professional role definition
- [ ] Verify token count < 2000

**Files to Modify**:
- `src/lib/ai/session.service.ts` (lines 30-247)

**Estimated Effort**: 8 hours

#### 1.2 Update System Prompts (Polish)
- [ ] Translate enhanced English prompts to Polish
- [ ] Use standard Polish medical terminology
- [ ] Verify clinical accuracy of translations
- [ ] Review by Polish-speaking dietitian (if available)

**Files to Modify**:
- `src/lib/ai/session.service.ts` (lines 30-247)

**Estimated Effort**: 8 hours

#### 1.3 Unit Tests
- [ ] Test `formatSystemPrompt()` with all language/plan type combinations
- [ ] Verify guideline references are included
- [ ] Verify JSON structure requirements preserved
- [ ] Test token count calculation
- [ ] Test disclaimer inclusion

**Files to Create/Modify**:
- `src/test/unit/lib/ai/session.service.test.ts` (create or update)

**Estimated Effort**: 6 hours

### Success Criteria
- [ ] All system prompts include clinical guideline references
- [ ] Token count under 2000 for all prompts
- [ ] All unit tests pass
- [ ] No breaking changes to JSON structure

### Testing
- Unit tests for prompt generation
- Manual review of prompt content
- Token count verification

---

## Phase 2: User Prompt Enhancement & PAL Mapping (Week 2-3)

**Goal**: Enhance user prompts with clinical context and PAL factor mapping.

### Deliverables
1. Enhanced user prompts with structured clinical context
2. PAL factor mapping implementation
3. Macro calculation references in prompts
4. Unit tests for user prompt generation

### Tasks

#### 2.1 Create PAL Factor Mapping Helper
- [ ] Create `getPALFactorRange()` helper function
- [ ] Map activity levels to PAL ranges
- [ ] Add unit tests for PAL mapping

**Files to Create**:
- `src/lib/ai/clinical-context.helpers.ts` (new file)

**Files to Modify**:
- `src/lib/ai/session.service.ts` (import and use helper)

**Estimated Effort**: 4 hours

#### 2.2 Update User Prompts (English)
- [ ] Restructure patient demographics section
- [ ] Add PAL factor mapping to activity level section
- [ ] Add macro gram calculations as reference
- [ ] Add EFSA range validation notes
- [ ] Enhance instruction to apply guidelines

**Files to Modify**:
- `src/lib/ai/session.service.ts` (lines 256-396)

**Estimated Effort**: 6 hours

#### 2.3 Update User Prompts (Polish)
- [ ] Translate enhanced English user prompts
- [ ] Verify clinical context accuracy
- [ ] Maintain PAL factor terminology

**Files to Modify**:
- `src/lib/ai/session.service.ts` (lines 256-396)

**Estimated Effort**: 6 hours

#### 2.4 Unit Tests
- [ ] Test user prompt generation with various patient data combinations
- [ ] Verify PAL factor inclusion
- [ ] Verify macro calculation references
- [ ] Test optional fields handling

**Files to Modify**:
- `src/test/unit/lib/ai/session.service.test.ts`

**Estimated Effort**: 4 hours

### Success Criteria
- [ ] User prompts include PAL factor mappings
- [ ] Clinical context structured appropriately
- [ ] All optional fields handled gracefully
- [ ] All unit tests pass

### Testing
- Unit tests for user prompt generation
- Integration test: Create AI session and verify prompts
- Manual review of prompt content

---

## Phase 3: Condition Detection & Contextual Guidelines (Week 3-4)

**Goal**: Implement simple keyword-based condition detection and condition-specific guideline integration.

### Deliverables
1. Condition detection helper function
2. Condition-specific clinical context in user prompts
3. Unit tests for condition detection
4. Integration tests for condition-specific prompts

### Tasks

#### 3.1 Create Condition Detection Helper
- [ ] Create `detectConditions()` function
- [ ] Implement keyword matching for CKD, diabetes, allergies, illness
- [ ] Add unit tests for condition detection
- [ ] Test with various exclusion guideline texts

**Files to Create**:
- `src/lib/ai/clinical-context.helpers.ts` (add to existing file)

**Estimated Effort**: 6 hours

#### 3.2 Integrate Condition Detection into User Prompts
- [ ] Call `detectConditions()` in `formatUserPrompt()`
- [ ] Add CLINICAL CONTEXT section when conditions detected
- [ ] Add condition-specific guideline references
- [ ] Support both English and Polish

**Files to Modify**:
- `src/lib/ai/session.service.ts` (lines 256-396)

**Estimated Effort**: 8 hours

#### 3.3 Unit Tests
- [ ] Test condition detection with various texts
- [ ] Test condition detection with no exclusions
- [ ] Test condition detection with multiple conditions
- [ ] Test clinical context inclusion in prompts

**Files to Modify**:
- `src/test/unit/lib/ai/clinical-context.helpers.test.ts` (create)
- `src/test/unit/lib/ai/session.service.test.ts`

**Estimated Effort**: 6 hours

#### 3.4 Integration Tests
- [ ] Test AI session creation with CKD condition
- [ ] Test AI session creation with diabetes condition
- [ ] Test AI session creation with allergies
- [ ] Test AI session creation with multiple conditions
- [ ] Verify condition-specific context in prompts

**Files to Create/Modify**:
- `src/test/integration/ai/session-conditions.test.ts` (create)

**Estimated Effort**: 8 hours

### Success Criteria
- [ ] Condition detection correctly identifies common conditions
- [ ] Clinical context added to user prompts when conditions detected
- [ ] Condition-specific guideline references included
- [ ] All tests pass

### Testing
- Unit tests for condition detection
- Integration tests for condition-specific prompts
- Manual testing with real patient scenarios

---

## Phase 4: Comments Field Enhancement & Verification (Week 4-5)

**Goal**: Implement guideline citation and verification logic in comments field.

### Deliverables
1. Comments field guidance implementation
2. Target_kcal verification logic (comments only if discrepancy)
3. Macro distribution validation warnings (comments only)
4. Unit tests and integration tests

### Tasks

#### 4.1 Update Comments Field Guidance in System Prompt
- [ ] Clarify comments field usage for guideline citations
- [ ] Specify when to include warnings (significant deviations only)
- [ ] Update for both English and Polish

**Files to Modify**:
- `src/lib/ai/session.service.ts` (system prompt sections)

**Estimated Effort**: 2 hours

#### 4.2 Add Target_kcal Verification Instructions
- [ ] Add instruction to verify target_kcal if patient demographics provided
- [ ] Specify BMR calculation method (Mifflin-St Jeor)
- [ ] Instruction to mention discrepancies in comments only
- [ ] Threshold for "significant discrepancy" definition

**Files to Modify**:
- `src/lib/ai/session.service.ts` (system prompt)

**Estimated Effort**: 4 hours

#### 4.3 Add Macro Distribution Validation Instructions
- [ ] Add instruction to check if percentages sum to 100%
- [ ] Add instruction to check if percentages within EFSA ranges
- [ ] Instruction to warn in comments if issues found
- [ ] Do not auto-correct, only warn

**Files to Modify**:
- `src/lib/ai/session.service.ts` (system prompt)

**Estimated Effort**: 3 hours

#### 4.4 Unit Tests
- [ ] Test comments field guidance in system prompts
- [ ] Test verification instructions inclusion
- [ ] Verify token count still under 2000

**Files to Modify**:
- `src/test/unit/lib/ai/session.service.test.ts`

**Estimated Effort**: 3 hours

### Success Criteria
- [ ] Comments field guidance clearly specified
- [ ] Verification instructions included in prompts
- [ ] Token count remains acceptable
- [ ] All tests pass

### Testing
- Unit tests for prompt content
- Manual testing: Verify AI includes warnings in comments when appropriate
- Integration tests: Create sessions with non-optimal targets

---

## Phase 5: Polish Translation Review & Documentation (Week 5-6)

**Goal**: Ensure high-quality Polish translations and complete documentation.

### Deliverables
1. Polish translation review and refinement
2. Updated documentation
3. Developer guide for prompt maintenance

### Tasks

#### 5.1 Polish Translation Review
- [ ] Review all Polish prompts for clinical accuracy
- [ ] Verify medical terminology correctness
- [ ] Check consistency across prompts
- [ ] Review by Polish-speaking dietitian (if available)

**Files to Modify**:
- `src/lib/ai/session.service.ts` (Polish sections)

**Estimated Effort**: 6 hours

#### 5.2 Code Documentation
- [ ] Add JSDoc comments to enhanced functions
- [ ] Document guideline references and sources
- [ ] Document condition detection logic
- [ ] Document PAL factor mapping

**Files to Modify**:
- `src/lib/ai/session.service.ts`
- `src/lib/ai/clinical-context.helpers.ts`

**Estimated Effort**: 4 hours

#### 5.3 Developer Guide
- [ ] Create guide for updating guideline references
- [ ] Document token budget management
- [ ] Document prompt testing process
- [ ] Create guideline update checklist

**Files to Create**:
- `.ai/prompt-enhance/prompt-maintenance-guide.md`

**Estimated Effort**: 4 hours

### Success Criteria
- [ ] Polish translations reviewed and refined
- [ ] Code documentation complete
- [ ] Developer guide created
- [ ] Ready for production deployment

### Testing
- Manual review of Polish translations
- Documentation review

---

## Phase 6: Integration Testing & Refinement (Week 6-7)

**Goal**: Comprehensive testing and refinement based on real-world scenarios.

### Deliverables
1. Comprehensive integration test suite
2. Manual test scenarios
3. Performance validation
4. Refinement based on test results

### Tasks

#### 6.1 Integration Test Suite
- [ ] Test standard healthy adult scenario
- [ ] Test CKD patient scenario
- [ ] Test diabetes patient scenario
- [ ] Test allergies/intolerances scenario
- [ ] Test multiple conditions scenario
- [ ] Test extreme targets scenario

**Files to Create/Modify**:
- `src/test/integration/ai/guideline-compliance.test.ts` (create)

**Estimated Effort**: 12 hours

#### 6.2 Manual Test Scenarios
- [ ] Create meal plan for healthy adult → Verify clinical accuracy
- [ ] Create meal plan for CKD patient → Verify KDOQI compliance
- [ ] Create meal plan for diabetic patient → Verify diabetes guidelines
- [ ] Create meal plan with allergies → Verify EAACI compliance
- [ ] Create multi-day plan → Verify variety and clinical accuracy
- [ ] Test corrections → Verify AI maintains clinical context

**Estimated Effort**: 8 hours

#### 6.3 Performance Validation
- [ ] Monitor token usage across all scenarios
- [ ] Measure response time impact
- [ ] Verify token count under 2000
- [ ] Verify response time < 5 seconds

**Estimated Effort**: 4 hours

#### 6.4 Refinement
- [ ] Address any issues found in testing
- [ ] Optimize prompts if token count too high
- [ ] Refine condition detection if needed
- [ ] Improve clinical context if accuracy issues

**Estimated Effort**: 8 hours

### Success Criteria
- [ ] All integration tests pass
- [ ] Manual test scenarios show improved clinical accuracy
- [ ] Performance metrics acceptable
- [ ] Ready for production

### Testing
- Comprehensive integration test suite
- Manual test scenarios with real-world data
- Performance benchmarking

---

## Phase 7: Production Deployment & Monitoring (Week 7-8)

**Goal**: Deploy to production and establish monitoring.

### Deliverables
1. Production deployment
2. Monitoring setup
3. User feedback collection mechanism
4. Documentation updates

### Tasks

#### 7.1 Production Deployment
- [ ] Code review
- [ ] Merge to main branch
- [ ] Deploy to production
- [ ] Verify deployment success

**Estimated Effort**: 4 hours

#### 7.2 Monitoring Setup
- [ ] Monitor token usage in production
- [ ] Monitor response times
- [ ] Track guideline citation frequency
- [ ] Monitor error rates

**Estimated Effort**: 4 hours

#### 7.3 User Feedback Collection
- [ ] Monitor conversation corrections as implicit feedback
- [ ] Track guideline application accuracy
- [ ] Identify common issues
- [ ] Plan improvements

**Estimated Effort**: Ongoing

#### 7.4 Documentation Updates
- [ ] Update project summary with guideline integration
- [ ] Update README if needed
- [ ] Document deployment process
- [ ] Create user-facing documentation updates (if needed)

**Estimated Effort**: 4 hours

### Success Criteria
- [ ] Successfully deployed to production
- [ ] Monitoring established
- [ ] User feedback collection in place
- [ ] Documentation updated

### Testing
- Production smoke tests
- Monitoring verification

---

## Risk Management

### Identified Risks

1. **Token Count Exceeded**
   - **Mitigation**: Monitor token usage in each phase, optimize if needed
   - **Contingency**: Use prompt compression techniques

2. **Response Time Increase**
   - **Mitigation**: Monitor response times, optimize prompts if needed
   - **Contingency**: Accept slightly longer responses (< 10 seconds)

3. **Polish Translation Accuracy**
   - **Mitigation**: Review by Polish-speaking dietitian
   - **Contingency**: Iterative refinement based on feedback

4. **Condition Detection False Positives**
   - **Mitigation**: Conservative keyword matching, test extensively
   - **Contingency**: Refine keywords based on real-world usage

5. **AI Response Quality**
   - **Mitigation**: Comprehensive testing, iterative refinement
   - **Contingency**: A/B testing, prompt variations

### Rollback Plan

If issues are discovered:
1. Revert to previous prompt version
2. Investigate issue in staging
3. Fix and re-deploy
4. No data migration needed (prompts stored per session)

---

## Dependencies

### External Dependencies
- None (guidelines are reference materials, no API calls needed)

### Internal Dependencies
- `src/lib/ai/session.service.ts` (existing file)
- `src/lib/ai/openrouter.service.ts` (no changes needed)
- Test infrastructure (Vitest, existing test utilities)

### Documentation Dependencies
- `decision-document.md` (decisions must be finalized)
- `enhanced-prompt-templates.md` (templates must be finalized)

---

## Success Metrics

### Quantitative Metrics
- Token count: < 2000 per prompt
- Response time: < 5 seconds average
- Test coverage: > 80% for new code
- Condition detection accuracy: > 90% for common conditions

### Qualitative Metrics
- Improved clinical accuracy in AI responses
- Proper guideline citations in comments field
- Dietitian feedback on clinical relevance
- Reduction in manual corrections needed

---

## Future Enhancements (Out of Scope)

These enhancements are identified for future iterations:

1. **Server-side BMR calculation** - Calculate BMR in application, include in prompts
2. **NLP-based condition detection** - Use AI to detect conditions from free text
3. **Guideline customization** - Allow dietitians to prioritize guidelines
4. **Dynamic guideline retrieval** - Fetch latest guidelines from APIs
5. **Explicit feedback mechanism** - In-app feedback after meal plan generation
6. **Automated compliance validation** - Programmatically validate against guidelines

---

**Last Updated**: 2025-01-26
**Status**: Ready for implementation

