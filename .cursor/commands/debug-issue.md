# Debug Issue Command

This command provides a systematic approach to debugging issues in the Diet Planner MVP project.

## Command Usage

When you encounter an issue {issue-name}, use this command to:
1. Systematically analyze the problem
2. Create detailed documentation
3. Execute a structured debugging process
4. Generate a comprehensive report

## Prerequisites

Before starting, ensure you have access to:
- `.ai/project-summary.md` - Project overview and structure
- `.ai/prd.md` - Product requirements
- `.ai/techstack.md` - Technology stack details
- `.cursor/rules/*.mdc` - All coding rules and guidelines
- `.ai/DEPLOYMENT_DEBUG_REPORT.md` - Reference for debugging methodology
- `.ai/DEPLOYMENT_DEBUG.md` - Reference for debugging tracking

## Step 1: Initial Problem Understanding

**Agent must start by asking these 10 diagnostic questions:**

1. **What is the exact symptom you're experiencing?** (Describe what you see vs. what you expect)
2. **When did this issue first occur?** (After a specific change, deployment, or randomly?)
3. **In which environment does this occur?** (Local development, staging, production, or all?)
4. **Does it affect all users or specific users?** (User-specific, role-specific, or universal?)
5. **What actions trigger the issue?** (Specific user actions, API calls, page loads, etc.)
6. **Are there any error messages in the console/logs?** (Browser console, server logs, Cloudflare logs)
7. **What was the last change made before this issue appeared?** (Code changes, dependency updates, configuration changes)
8. **Does the issue occur consistently or intermittently?** (Always happens, sometimes happens, or random?)
9. **What is the expected behavior?** (What should happen in the ideal scenario?)
10. **What is the impact of this issue?** (Critical - app broken, High - major feature broken, Medium - minor issue, Low - cosmetic)

**Agent must wait for user responses before proceeding.**

## Step 2: Create Issue Analysis Document

After receiving answers, the agent must:

1. **Create issue directory**: `.ai/{issue-name}/`
   - Use a descriptive name based on the issue (e.g., `cloudflare-deployment`, `auth-login-error`)
   - Replace spaces with hyphens, use lowercase
   - Create the directory if it doesn't exist
   - All debugging documentation for this issue will be stored in this directory

2. **Create an issue analysis file**: `.ai/{issue-name}/issue-analysis.md`
   - This file will contain the initial problem analysis

3. **Structure the analysis file**:

```markdown
# Issue Analysis: {Issue Name}

**Date**: {Current Date}
**Reported By**: {User}
**Status**: 🔍 Investigating
**Environment**: {Local/Staging/Production/All}

---

## 1. Problem Statement

### 1.1 Symptom Description
{Detailed description based on question 1}

### 1.2 Environment Details
**Affected Environments**:
- {Environment}: {Status}
- {Environment}: {Status}

**Technical Stack**:
- Framework: {Version}
- Adapter: {Version}
- Runtime: {Runtime}
- Database: {Database}
- Build Tool: {Build Tool}

### 1.3 Error Details
**Error Messages**:
{Error messages from question 6}

**Console/Log Output**:
{Relevant log snippets}

### 1.4 Impact Assessment
**User Impact**: {Description}
**Business Impact**: {Description}
**Affected Features**: {List of features}

---

## 2. Initial Investigation

### 2.1 Timeline
- **First Occurrence**: {Answer from question 2}
- **Last Known Good State**: {If applicable}
- **Recent Changes**: {Answer from question 7}

### 2.2 Reproduction Steps
1. {Step 1}
2. {Step 2}
3. {Step 3}

### 2.3 Affected Components
Based on initial analysis, the following components may be involved:
- {Component 1}
- {Component 2}
- {Component 3}

---

## 3. Root Cause Hypothesis

### 3.1 Initial Hypothesis
{Initial theory about what might be causing the issue}

### 3.2 Areas to Investigate
1. {Area 1}
2. {Area 2}
3. {Area 3}

### 3.3 Related Issues
{Reference to similar issues or known problems}

---

## 4. Investigation Plan

### 4.1 Verification Steps
- [ ] {Verification step 1}
- [ ] {Verification step 2}
- [ ] {Verification step 3}

### 4.2 Debugging Strategy
{Strategy for systematic debugging}

### 4.3 Logging Plan
{Plan for adding debug logs}

---

## 5. Next Steps
{Initial next steps based on analysis}

---

**Analysis Created**: {Date}
**Next Review**: {Date}
```

## Step 3: Create Debugging Plan Document

After creating the issue analysis, the agent must create a debugging plan:

1. **Create debugging plan file**: `.ai/{issue-name}/debug-plan.md`
   - This file will be updated in real-time during debugging

2. **Structure the debugging plan**:

```markdown
# Debugging Plan: {Issue Name}

**Created**: {Date}
**Status**: 🚧 In Progress
**Related Analysis**: `issue-analysis.md` (in same directory)

---

## Debugging Methodology

This plan follows a systematic, multi-phase debugging approach:
1. **Infrastructure Verification**: Verify all configuration and environment
2. **Code Analysis**: Review application code for potential issues
3. **Logging Implementation**: Add comprehensive logging throughout
4. **Response/Behavior Inspection**: Implement detailed inspection points
5. **Version Testing**: Test different package versions if applicable
6. **Local vs Production Comparison**: Identify environment-specific differences

---

## Phase 1: Infrastructure Verification

### Step 1.1: Environment Configuration
- [ ] Verify environment variables are set correctly
- [ ] Check compatibility flags (if applicable)
- [ ] Verify build configuration
- [ ] Check deployment settings

**Status**: ⏳ Pending
**Findings**: _{Will be updated during debugging}_

### Step 1.2: Dependencies Verification
- [ ] Check package versions
- [ ] Verify dependency compatibility
- [ ] Check for known issues in dependencies

**Status**: ⏳ Pending
**Findings**: _{Will be updated during debugging}_

### Step 1.3: Build Verification
- [ ] Verify build completes without errors
- [ ] Check build output structure
- [ ] Verify all required files are generated

**Status**: ⏳ Pending
**Findings**: _{Will be updated during debugging}_

---

## Phase 2: Code Analysis

### Step 2.1: Related Code Review
- [ ] Review code in affected components
- [ ] Check for recent changes
- [ ] Look for common patterns/issues

**Status**: ⏳ Pending
**Findings**: _{Will be updated during debugging}_

### Step 2.2: Error Handling Review
- [ ] Check error handling in affected areas
- [ ] Verify error messages are informative
- [ ] Check for silent failures

**Status**: ⏳ Pending
**Findings**: _{Will be updated during debugging}_

---

## Phase 3: Logging Implementation

### Step 3.1: Add Debug Logs
- [ ] Add logging at entry points
- [ ] Add logging at critical decision points
- [ ] Add logging for data transformations
- [ ] Add logging for external calls

**Status**: ⏳ Pending
**Files Modified**: _{Will be updated during debugging}_

### Step 3.2: Response/Behavior Inspection
- [ ] Add inspection points for responses
- [ ] Add inspection points for state changes
- [ ] Add inspection points for data flow

**Status**: ⏳ Pending
**Files Modified**: _{Will be updated during debugging}_

---

## Phase 4: Testing & Verification

### Step 4.1: Local Testing
- [ ] Test in local environment
- [ ] Verify logs appear correctly
- [ ] Check for errors in logs

**Status**: ⏳ Pending
**Results**: _{Will be updated during debugging}_

### Step 4.2: Production Testing
- [ ] Deploy with debug logs
- [ ] Monitor production logs
- [ ] Compare local vs production behavior

**Status**: ⏳ Pending
**Results**: _{Will be updated during debugging}_

---

## Phase 5: Root Cause Identification

### Step 5.1: Analyze Findings
- [ ] Review all collected logs
- [ ] Identify patterns
- [ ] Formulate root cause hypothesis

**Status**: ⏳ Pending
**Findings**: _{Will be updated during debugging}_

### Step 5.2: Verify Root Cause
- [ ] Test hypothesis
- [ ] Confirm root cause
- [ ] Document findings

**Status**: ⏳ Pending
**Root Cause**: _{Will be updated during debugging}_

---

## Phase 6: Solution Implementation

### Step 6.1: Implement Fix
- [ ] Create fix
- [ ] Test fix locally
- [ ] Deploy fix

**Status**: ⏳ Pending
**Solution**: _{Will be updated during debugging}_

### Step 6.2: Verify Fix
- [ ] Test in affected environment
- [ ] Verify issue is resolved
- [ ] Check for regressions

**Status**: ⏳ Pending
**Verification**: _{Will be updated during debugging}_

---

## Debugging History

### {Date} - {Time}: {Action Taken}
**What was done**: {Description}
**Findings**: {What was discovered}
**Next steps**: {What to do next}
**Status**: {✅ Success / ❌ Failed / ⚠️ Partial}

---

## Current Status

**Current Phase**: {Phase number}
**Current Step**: {Step description}
**Blockers**: {Any blockers}
**Next Action**: {Next action to take}

---

**Last Updated**: {Date} {Time}
```

## Step 4: User Confirmation

**Agent must wait for user confirmation before proceeding with debugging.**

Present the plan to the user:
- Show the issue analysis summary
- Show the debugging plan overview
- Ask: "Do you want me to proceed with this debugging plan? (yes/no)"

**Only proceed after user confirms.**

## Step 5: Execute Debugging Plan

Once confirmed, the agent must:

1. **Follow the debugging plan systematically**
2. **Update the debugging plan file after each significant step**
3. **Add debug logs as planned**
4. **Document findings in real-time**

### Debugging Execution Rules

1. **One step at a time**: Complete each step before moving to the next
2. **Update plan file**: After each step, update the plan with:
   - Status (✅ Complete / ❌ Failed / ⚠️ Partial)
   - Findings
   - Files modified
   - Next steps
3. **Add logging strategically**: 
   - Entry points of functions
   - Critical decision points
   - Data transformations
   - External API calls
   - Error conditions
4. **Test incrementally**: Test after each significant change
5. **Document everything**: Keep detailed notes of what was tried and what was found

### Logging Best Practices

When adding debug logs, follow these patterns:

```typescript
// Entry point logging
console.log(`[ComponentName] Processing request: ${identifier}`);

// Data inspection
console.log(`[ComponentName] Data received:`, {
  type: typeof data,
  keys: Object.keys(data),
  preview: JSON.stringify(data).substring(0, 200)
});

// Decision point logging
console.log(`[ComponentName] Decision: ${condition} ? ${truePath} : ${falsePath}`);

// Error logging
console.error(`[ComponentName] Error occurred:`, {
  error: error.message,
  stack: error.stack,
  context: { /* relevant context */ }
});

// Response/Result logging
console.log(`[ComponentName] Result:`, {
  status: result.status,
  type: typeof result,
  preview: result.toString().substring(0, 200)
});
```

## Step 6: Update Plan File During Debugging

After each debugging action, update the plan file:

1. **Mark completed steps** with ✅
2. **Add findings** to the relevant step
3. **Update "Debugging History"** section with:
   - Date and time
   - What was done
   - What was found
   - Next steps
4. **Update "Current Status"** section

Example update:

```markdown
### Step 3.1: Add Debug Logs
- [x] Add logging at entry points ✅
- [x] Add logging at critical decision points ✅
- [ ] Add logging for data transformations
- [ ] Add logging for external calls

**Status**: ⚠️ Partial - Entry and decision points logged, data transformations pending
**Findings**: 
- Logs show request is received correctly
- Decision point reveals unexpected condition
- Need to add data transformation logging to trace data flow

**Files Modified**: 
- `src/middleware/index.ts` - Added request logging
- `src/pages/api/example.ts` - Added decision point logging

---

### 2025-01-25 - 14:30: Added Entry Point Logging
**What was done**: Added comprehensive logging at middleware entry point
**Findings**: 
- Requests are being received correctly
- Response object structure is correct
- Response body contains unexpected content
**Next steps**: Add logging for response body inspection
**Status**: ✅ Success
```

## Step 7: Root Cause Identification

When root cause is identified:

1. **Update issue analysis file** with root cause section
2. **Update debugging plan** with root cause findings
3. **Document the root cause** clearly

Example root cause documentation:

```markdown
## Root Cause Analysis

### Root Cause Identified: {Date}

**Root Cause**: {Clear description of the root cause}

**Why it happens**:
{Explanation of why this root cause leads to the observed symptoms}

**Evidence**:
- {Evidence point 1}
- {Evidence point 2}
- {Evidence point 3}

**Affected Components**:
- {Component 1}
- {Component 2}

**Why it wasn't caught earlier**:
{Explanation if applicable}
```

## Step 8: Solution Implementation

After identifying root cause:

1. **Implement the fix**
2. **Test the fix locally**
3. **Update plan file** with solution details
4. **Ask user to verify** the fix works

## Step 9: Generate Final Report

**Only after user confirms the issue is resolved**, generate the final report:

1. **Create report file**: `.ai/{issue-name}/debug-report-{date}.md`
   - Use format: `YYYY-MM-DD` for date (e.g., `debug-report-2025-01-25.md`)
   - This is the final comprehensive report documenting the entire debugging process

2. **Structure the report** (based on DEPLOYMENT_DEBUG_REPORT.md format):

```markdown
# Technical Report: {Issue Name} Analysis

**Report Date**: {Date}
**Project**: Diet Planner MVP
**Issue**: {Issue Name}
**Status**: ✅ Resolved
**Severity**: {Severity Level}

---

## Executive Summary

{2-3 paragraph summary of the issue, root cause, and solution}

**Key Findings**:
- {Finding 1}
- {Finding 2}
- {Finding 3}

**Impact**: {Impact description}

**Solution**: {Brief solution description}

---

## 1. Problem Statement

### 1.1 Symptom Description
{Detailed symptom description}

### 1.2 Environment Details
{Environment details}

### 1.3 Technical Stack
{Relevant technical stack information}

### 1.4 Error Details
{Error messages, logs, etc.}

---

## 2. Investigation Methodology

### 2.1 Debugging Approach
{Description of the debugging approach used}

### 2.2 Logging Strategy
{Description of logging strategy}

### 2.3 Verification Points
{List of verification points checked}

---

## 3. Root Cause Analysis

### 3.1 Root Cause
{Detailed root cause description}

### 3.2 Why It Happens
{Explanation}

### 3.3 Evidence
{Evidence supporting root cause}

### 3.4 Technical Explanation
{Technical explanation of the issue}

---

## 4. Detailed Findings

### 4.1 Verified Working Components
{List of components that were verified as working}

### 4.2 Verified Broken Component
{Description of the broken component}

### 4.3 Local vs Production Comparison
{Comparison if applicable}

---

## 5. Solution Implementation

### 5.1 Solution Description
{Detailed solution description}

### 5.2 Changes Made
{List of changes made}

### 5.3 Files Modified
{List of files modified with brief descriptions}

### 5.4 Testing Performed
{Description of testing performed}

---

## 6. Verification

### 6.1 Local Testing
{Local testing results}

### 6.2 Production Testing
{Production testing results}

### 6.3 Regression Testing
{Regression testing results}

---

## 7. Lessons Learned

### 7.1 What Went Well
{What worked well in the debugging process}

### 7.2 What Could Be Improved
{What could be improved}

### 7.3 Prevention Strategies
{How to prevent similar issues in the future}

---

## 8. Recommendations

### 8.1 Immediate Actions
{Immediate actions taken}

### 8.2 Short-Term Improvements
{Short-term improvements}

### 8.3 Long-Term Improvements
{Long-term improvements}

---

## 9. Appendices

### Appendix A: Log Samples
{Relevant log samples}

### Appendix B: Configuration Files
{Relevant configuration}

### Appendix C: Code Changes
{Summary of code changes}

---

**Report Prepared By**: AI Agent
**Review Status**: {Status}
**Resolution Confirmed**: {Date} by {User}
```

## Step 10: Cleanup

After generating the report:

1. **Remove debug logs** added during debugging (or mark them for removal)
2. **Update issue analysis** file status to "✅ Resolved"
3. **Update debugging plan** status to "✅ Complete"
4. **Archive files** if needed (move to `.ai/archive/` or similar)

## Important Notes

1. **Create directory first**: Always create `.ai/{issue-name}/` directory before creating any files
2. **Always update files in real-time**: Don't wait until the end to document findings
3. **Be systematic**: Follow the plan, don't skip steps
4. **Document everything**: Even failed attempts are valuable information
5. **Test incrementally**: Test after each significant change
6. **Ask for confirmation**: Before major changes or when stuck
7. **Reference project docs**: Always refer to project-summary.md, prd.md, and techstack.md
8. **Follow coding rules**: Adhere to all .mdc rules during debugging
9. **Keep user informed**: Update user on progress regularly
10. **All files in one place**: All debugging documentation for an issue is stored in `.ai/{issue-name}/` directory

## Command Execution Flow

```
1. Load all project documentation (@project-summary.md, @prd.md, @techstack.md, @DEPLOYMENT_DEBUG_REPORT.md, @DEPLOYMENT_DEBUG.md)
2. Ask 10 diagnostic questions
3. Create .ai/{issue-name}/ directory
4. Create .ai/{issue-name}/issue-analysis.md
5. Create .ai/{issue-name}/debug-plan.md
6. Wait for user confirmation
7. Execute debugging plan (updating .ai/{issue-name}/debug-plan.md in real-time)
8. Identify root cause
9. Implement solution
10. Wait for user confirmation of fix
11. Generate .ai/{issue-name}/debug-report-{date}.md
12. Cleanup debug logs
```

## File Structure

All debugging documentation for an issue is organized in a dedicated directory:

```
.ai/
└── {issue-name}/
    ├── issue-analysis.md      # Initial problem analysis
    ├── debug-plan.md          # Step-by-step debugging plan (updated in real-time)
    └── debug-report-{date}.md # Final comprehensive report (created after resolution)
```

**Benefits of this structure**:
- All related files are grouped together
- Easy to find all documentation for a specific issue
- Clean organization in the `.ai/` directory
- Can easily archive or reference entire issue directories

---

**Command Version**: 1.0
**Last Updated**: 2025-01-25
**Based On**: DEPLOYMENT_DEBUG_REPORT.md methodology

