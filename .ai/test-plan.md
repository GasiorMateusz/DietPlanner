# Test Plan for Diet Planner MVP

## Document Information

- **Project Name**: Diet Planner (MVP)
- **Document Version**: 1.0
- **Date**: 2025-01-23

---

## 1. Introduction and Testing Objectives

### 1.1 Project Overview

Diet Planner is a Minimum Viable Product (MVP) web application designed to assist dietitians in creating personalized, 1-day meal plans. The application integrates with AI (via OpenRouter.ai) to generate initial meal plans through a conversational interface, after which dietitians can manually edit, save, and export plans as `.doc` files.

### 1.2 Testing Objectives

The primary objectives of this test plan are to:

1. **Validate Functional Requirements**: Ensure all core features (authentication, meal plan CRUD operations, AI chat, editor, export) work as specified in the PRD.
2. **Ensure Security**: Verify authentication, authorization, and data isolation mechanisms (Row-Level Security policies) protect user data.
3. **Verify Integration Points**: Test Supabase integration, OpenRouter AI service integration, and file export functionality.
4. **Assess User Experience**: Validate UI/UX flows, form validations, error handling, and responsive design.
5. **Performance Validation**: Ensure acceptable response times for API calls, AI generation, and page loads.
6. **Browser Compatibility**: Verify the application works across major browsers.
7. **Data Integrity**: Validate data validation, storage, retrieval, and export accuracy.

### 1.3 Scope of Testing

**In Scope:**

- User authentication (registration, login, password reset, account management)
- Meal plan CRUD operations (create, read, update, delete, list, search)
- AI chat session creation and messaging
- Meal plan editor functionality
- Document export (.doc generation)
- API endpoint validation
- Database operations and RLS policies
- Form validations (client and server-side)
- Error handling and edge cases
- Middleware and route protection
- UI component functionality

**Out of Scope (MVP Boundaries):**

- Multi-day meal plans
- Recipe database integration
- Social features (sharing, commenting)
- Mobile application testing
- Load testing (production-scale)
- Accessibility audit (WCAG compliance - future enhancement)
- Third-party service penetration testing

---

## 2. Test Scope

### 2.1 Functional Testing Areas

#### 2.1.1 Authentication Module

- User registration with email/password
- Terms and conditions acceptance validation
- Login/logout functionality
- Password reset flow (forgot password → email → reset)
- Account password change
- Account deletion
- Session management and token refresh
- Route protection (authenticated vs. unauthenticated access)

#### 2.1.2 Dashboard Module

- Meal plans list display
- Search functionality (live filtering)
- Sorting options (by name, created_at, updated_at)
- Empty state handling
- Delete confirmation dialog
- Navigation to editor and creation flows
- Responsive layout

#### 2.1.3 AI Chat Module

- Startup form data collection
- AI session creation
- Initial meal plan generation
- Follow-up message sending
- Message history display
- Error handling (AI service unavailable, rate limits)
- Loading states and streaming (if applicable)
- Accept/reject meal plan flow
- Session state management

#### 2.1.4 Meal Plan Editor Module

- Create mode (from AI chat)
- Edit mode (existing plan)
- Plan name editing
- Meal addition/removal
- Meal field editing (name, ingredients, preparation, nutrition)
- Daily summary editing
- Save functionality (create/update)
- Form validation and readiness checks
- Error handling and recovery

#### 2.1.5 Export Module

- `.doc` file generation
- Document structure validation
- Filename sanitization
- Download functionality
- File content accuracy (data mapping)

#### 2.1.6 API Endpoints

**Meal Plans API (`/api/meal-plans`):**

- `GET /api/meal-plans` - List with search/sort
- `POST /api/meal-plans` - Create
- `GET /api/meal-plans/{id}` - Get by ID
- `PUT /api/meal-plans/{id}` - Update
- `DELETE /api/meal-plans/{id}` - Delete
- `GET /api/meal-plans/{id}/export` - Export

**AI Sessions API (`/api/ai/sessions`):**

- `POST /api/ai/sessions` - Create session
- `POST /api/ai/sessions/{id}/message` - Send message

### 2.2 Non-Functional Testing Areas

#### 2.2.1 Security Testing

- Authentication token validation
- Authorization checks (RLS policies)
- SQL injection prevention (via Supabase SDK)
- XSS prevention (input sanitization)
- CSRF protection (same-site cookies)
- API key security (server-side only)
- Session timeout and refresh

#### 2.2.2 Performance Testing

- API response times
- AI generation latency
- Page load times
- Search performance (trigram index)
- Database query optimization
- Client-side rendering performance

#### 2.2.3 Usability Testing

- Form validation feedback
- Error message clarity
- Loading state indicators
- Navigation flow intuitiveness
- Responsive design (desktop, tablet, mobile viewports)

#### 2.2.4 Compatibility Testing

- Browser testing (Chrome, Firefox, Safari, Edge - latest versions)
- Viewport sizes (desktop: 1920x1080, laptop: 1366x768, tablet: 768x1024, mobile: 375x667)

---

## 3. Types of Tests to be Performed

### 3.1 Unit Tests

**Purpose**: Test individual functions, methods, and components in isolation.

**Scope:**

- Validation schemas (Zod)
- Utility functions (`date.ts`, `meal-plan-parser.ts`, `utils.ts`)
- Service classes (`OpenRouterService`, `AiSessionService`, `MealPlanService`, `DocumentGeneratorService`)
- Error classes (`errors.ts`)
- React hooks (`useDebounce`, `useMealPlansList`)
- React components (individual component logic, state management)

**Tools**: Vitest, React Testing Library, Jest (if configured)

### 3.2 Integration Tests

**Purpose**: Test interactions between components, services, and external systems.

**Scope:**

- API route handlers with service layer
- Database operations with RLS policies
- Supabase client integration
- OpenRouter API integration (mocked)
- Form submission flows (frontend → API → database)
- Authentication flows (Supabase Auth)
- Middleware → API → Database chain

**Tools**: Vitest, Supertest (for API testing), MSW (Mock Service Worker) for external APIs

### 3.3 End-to-End (E2E) Tests

**Purpose**: Test complete user workflows from start to finish.

**Scope:**

- User registration → login → dashboard
- Create meal plan (startup form → AI chat → accept → editor → save)
- Edit existing meal plan → save
- Search and filter meal plans
- Delete meal plan (with confirmation)
- Export meal plan to `.doc`
- Password reset flow
- Account deletion flow

**Tools**: Playwright, Cypress, or Puppeteer

### 3.4 Security Tests

**Purpose**: Validate security mechanisms and identify vulnerabilities.

**Scope:**

- Authentication bypass attempts
- Authorization checks (accessing other users' data)
- Input validation (SQL injection, XSS attempts)
- Token manipulation (expired, invalid, tampered)
- API key exposure checks
- RLS policy enforcement verification
- Session hijacking prevention

**Tools**: Manual testing, OWASP ZAP (optional), Postman (for API security testing)

### 3.5 Performance Tests

**Purpose**: Assess application responsiveness and resource usage.

**Scope:**

- API endpoint response times (target: < 500ms for most endpoints)
- AI generation latency (target: < 30s, depends on model)
- Page load times (target: < 2s initial load)
- Search query performance (with large datasets)
- Concurrent user simulation (if applicable)

**Tools**: Lighthouse, WebPageTest, Apache JMeter (for API load testing)

### 3.6 Regression Tests

**Purpose**: Ensure new changes don't break existing functionality.

**Scope:**

- Smoke test suite (critical paths)
- Full functional test suite on each release
- Automated test execution in CI/CD pipeline

**Tools**: Test automation framework (integrated with GitHub Actions)

---

## 4. Test Scenarios for Key Functionalities

### 4.1 Authentication Scenarios

#### TC-AUTH-001: User Registration - Success

**Priority**: High  
**Steps**:

1. Navigate to `/auth/register`
2. Enter valid email address
3. Enter password (min 6 characters)
4. Confirm password (matches)
5. Check "I accept terms and conditions" checkbox
6. Submit form

**Expected Result**: User registered, redirected to `/app/dashboard`, session established

#### TC-AUTH-002: User Registration - Validation Errors

**Priority**: High  
**Steps**:

1. Navigate to `/auth/register`
2. Attempt submission with:
   - Invalid email format
   - Password < 6 characters
   - Non-matching passwords
   - Unchecked terms checkbox

**Expected Result**: Appropriate validation errors displayed, form not submitted

#### TC-AUTH-003: User Login - Success

**Priority**: Critical  
**Steps**:

1. Navigate to `/auth/login`
2. Enter valid credentials
3. Submit form

**Expected Result**: User logged in, redirected to `/app/dashboard`

#### TC-AUTH-004: User Login - Invalid Credentials

**Priority**: High  
**Steps**:

1. Navigate to `/auth/login`
2. Enter invalid email or password
3. Submit form

**Expected Result**: Error message displayed, user remains on login page

#### TC-AUTH-005: Password Reset Flow

**Priority**: Medium  
**Steps**:

1. Navigate to `/auth/forgot-password`
2. Enter registered email
3. Submit form
4. Check email for reset link
5. Click reset link (navigate to `/auth/reset-password`)
6. Enter new password
7. Submit form

**Expected Result**: Password reset, user can login with new password

#### TC-AUTH-006: Session Expiry Handling

**Priority**: High  
**Steps**:

1. Log in to application
2. Wait for token expiration (or manually expire token)
3. Attempt API call

**Expected Result**: 401 Unauthorized response, redirect to `/auth/login`

#### TC-AUTH-007: Route Protection - Unauthenticated Access

**Priority**: Critical  
**Steps**:

1. Clear browser cookies/session
2. Navigate to `/app/dashboard`

**Expected Result**: Redirected to `/auth/login`

#### TC-AUTH-008: Route Protection - Authenticated Access to Auth Pages

**Priority**: Medium  
**Steps**:

1. Log in to application
2. Navigate to `/auth/login` or `/auth/register`

**Expected Result**: Redirected to `/app/dashboard`

---

### 4.2 Dashboard Scenarios

#### TC-DASH-001: Display Meal Plans List

**Priority**: Critical  
**Steps**:

1. Log in to application
2. Navigate to `/app/dashboard`
3. Verify meal plans are displayed (if any exist)

**Expected Result**: List of meal plans shown with name, dates, and action buttons

#### TC-DASH-002: Empty State Display

**Priority**: Medium  
**Steps**:

1. Log in as new user (no meal plans)
2. Navigate to `/app/dashboard`

**Expected Result**: Empty state message displayed with "Create new meal plan" option

#### TC-DASH-003: Search Functionality

**Priority**: High  
**Steps**:

1. Navigate to dashboard with multiple meal plans
2. Enter search query in search field
3. Verify filtered results update in real-time

**Expected Result**: Only matching meal plans displayed, case-insensitive partial match

#### TC-DASH-004: Sorting Functionality

**Priority**: Medium  
**Steps**:

1. Navigate to dashboard with multiple meal plans
2. Change sort option (name, created_at, updated_at)
3. Change order (asc/desc)

**Expected Result**: Meal plans sorted according to selected criteria

#### TC-DASH-005: Delete Meal Plan - With Confirmation

**Priority**: High  
**Steps**:

1. Navigate to dashboard
2. Click "Delete" on a meal plan
3. Confirm deletion in dialog
4. Verify meal plan removed from list

**Expected Result**: Confirmation dialog shown, meal plan deleted after confirmation

#### TC-DASH-006: Delete Meal Plan - Cancel

**Priority**: Medium  
**Steps**:

1. Navigate to dashboard
2. Click "Delete" on a meal plan
3. Cancel deletion in dialog

**Expected Result**: Dialog closed, meal plan remains in list

#### TC-DASH-007: Navigate to Create Meal Plan

**Priority**: Critical  
**Steps**:

1. Navigate to dashboard
2. Click "Create new meal plan" button

**Expected Result**: Startup form dialog opened

---

### 4.3 AI Chat Scenarios

#### TC-AI-001: Create AI Session - Success

**Priority**: Critical  
**Steps**:

1. Click "Create new meal plan"
2. Fill startup form with valid data
3. Submit form
4. Wait for AI response

**Expected Result**: AI session created, initial meal plan displayed in chat interface

#### TC-AI-002: AI Session Creation - Validation Errors

**Priority**: High  
**Steps**:

1. Click "Create new meal plan"
2. Fill form with invalid data (e.g., negative age, invalid enum)
3. Submit form

**Expected Result**: Validation errors displayed, form not submitted

#### TC-AI-003: Send Follow-up Message

**Priority**: High  
**Steps**:

1. In active AI chat session
2. Enter message in input field
3. Send message
4. Wait for AI response

**Expected Result**: Message sent, AI response displayed, conversation history updated

#### TC-AI-004: AI Service Unavailable (502 Error)

**Priority**: High  
**Steps**:

1. Create AI session (with mock/disabled OpenRouter)
2. Observe error handling

**Expected Result**: User-friendly error message displayed, option to retry

#### TC-AI-005: Message Validation

**Priority**: Medium  
**Steps**:

1. In AI chat interface
2. Attempt to send empty message
3. Attempt to send message exceeding max length

**Expected Result**: Send button disabled for empty, error for too long

#### TC-AI-006: Accept Meal Plan

**Priority**: Critical  
**Steps**:

1. Receive AI-generated meal plan
2. Click "Accept" button
3. Verify navigation to editor

**Expected Result**: Meal plan data transferred to editor, session ID preserved

---

### 4.4 Meal Plan Editor Scenarios

#### TC-EDIT-001: Create Meal Plan from AI Chat

**Priority**: Critical  
**Steps**:

1. Accept meal plan from AI chat
2. Navigate to editor (create mode)
3. Verify all fields populated
4. Edit plan name
5. Edit meal details
6. Click "Save"

**Expected Result**: Meal plan saved, redirected to dashboard, new plan visible in list

#### TC-EDIT-002: Edit Existing Meal Plan

**Priority**: Critical  
**Steps**:

1. Navigate to dashboard
2. Click "Edit/View" on existing meal plan
3. Modify fields
4. Click "Save"

**Expected Result**: Changes saved, `updated_at` timestamp updated

#### TC-EDIT-003: Add Meal to Plan

**Priority**: High  
**Steps**:

1. In editor, click "Add Meal"
2. Fill meal fields (name, ingredients, preparation, nutrition)
3. Save meal plan

**Expected Result**: New meal added, daily summary updated (if auto-calculated)

#### TC-EDIT-004: Remove Meal from Plan

**Priority**: High  
**Steps**:

1. In editor, click "Remove" on a meal
2. Confirm removal
3. Save meal plan

**Expected Result**: Meal removed, plan saved successfully

#### TC-EDIT-005: Form Validation - Incomplete Data

**Priority**: High  
**Steps**:

1. In editor, attempt to save with:
   - Empty plan name
   - Empty meal name
   - Missing required fields

**Expected Result**: Validation errors displayed, save disabled until valid

#### TC-EDIT-006: Editor - Load Existing Plan

**Priority**: Critical  
**Steps**:

1. Navigate to `/app/editor/{id}` with valid meal plan ID
2. Verify all data loaded correctly

**Expected Result**: All fields populated with existing plan data

#### TC-EDIT-007: Editor - Invalid Plan ID

**Priority**: Medium  
**Steps**:

1. Navigate to `/app/editor/{invalid-id}`
2. Verify error handling

**Expected Result**: Error message displayed, option to return to dashboard

---

### 4.5 Export Scenarios

#### TC-EXPORT-001: Export Meal Plan to .doc

**Priority**: High  
**Steps**:

1. Navigate to dashboard
2. Click "Export to .doc" on a meal plan
3. Verify file download
4. Open file in Microsoft Word

**Expected Result**: `.doc` file downloaded, content matches meal plan data, proper formatting

#### TC-EXPORT-002: Export - Document Structure Validation

**Priority**: Medium  
**Steps**:

1. Export a meal plan with full data
2. Verify document contains:
   - Plan name as title
   - Patient information section
   - Daily summary table
   - All meals with details

**Expected Result**: All sections present, data accurate

#### TC-EXPORT-003: Export - Filename Sanitization

**Priority**: Low  
**Steps**:

1. Create meal plan with special characters in name
2. Export to .doc
3. Verify filename

**Expected Result**: Filename sanitized, no special characters, valid file system name

---

### 4.6 API Endpoint Scenarios

#### TC-API-001: GET /api/meal-plans - Unauthenticated

**Priority**: Critical  
**Steps**:

1. Send GET request without Authorization header

**Expected Result**: 401 Unauthorized response

#### TC-API-002: GET /api/meal-plans - Authenticated

**Priority**: Critical  
**Steps**:

1. Log in, obtain JWT token
2. Send GET request with valid token

**Expected Result**: 200 OK, array of meal plans (empty if none)

#### TC-API-003: GET /api/meal-plans - With Search Query

**Priority**: High  
**Steps**:

1. Send GET request with `?search=query`
2. Verify filtered results

**Expected Result**: Only matching meal plans returned

#### TC-API-004: POST /api/meal-plans - Create Success

**Priority**: Critical  
**Steps**:

1. Send POST with valid meal plan data
2. Verify response

**Expected Result**: 201 Created, complete meal plan object returned

#### TC-API-005: POST /api/meal-plans - Validation Error

**Priority**: High  
**Steps**:

1. Send POST with invalid data (missing required fields, wrong types)
2. Verify error response

**Expected Result**: 400 Bad Request, validation error details in response

#### TC-API-006: GET /api/meal-plans/{id} - Access Other User's Plan

**Priority**: Critical  
**Steps**:

1. Log in as User A
2. Obtain meal plan ID from User B
3. Attempt to GET User B's plan

**Expected Result**: 404 Not Found (RLS policy prevents access)

#### TC-API-007: PUT /api/meal-plans/{id} - Update Success

**Priority**: High  
**Steps**:

1. Send PUT with partial update data
2. Verify response

**Expected Result**: 200 OK, updated meal plan returned, `updated_at` changed

#### TC-API-008: DELETE /api/meal-plans/{id} - Success

**Priority**: High  
**Steps**:

1. Send DELETE request
2. Verify deletion
3. Attempt to GET same ID

**Expected Result**: 204 No Content, subsequent GET returns 404

#### TC-API-009: POST /api/ai/sessions - Create Session

**Priority**: Critical  
**Steps**:

1. Send POST with startup data
2. Verify response

**Expected Result**: 201 Created, session ID and initial AI message returned

#### TC-API-010: POST /api/ai/sessions/{id}/message - Send Message

**Priority**: High  
**Steps**:

1. Create session, obtain session ID
2. Send follow-up message
3. Verify response

**Expected Result**: 200 OK, assistant message returned, prompt_count incremented

---

## 5. Test Environment

### 5.1 Test Environment Setup

#### 5.1.1 Development Environment

- **Purpose**: Manual testing, development debugging
- **URL**: `http://localhost:4321` (or configured port)
- **Database**: Local Supabase instance or development Supabase project
- **AI Service**: OpenRouter.ai with test API key
- **Access**: Developers, QA team

#### 5.1.2 Staging Environment

- **Purpose**: Pre-production testing, integration validation
- **URL**: Staging server URL (TBD)
- **Database**: Staging Supabase project
- **AI Service**: OpenRouter.ai with staging API key
- **Access**: QA team, stakeholders

#### 5.1.3 Production Environment

- **Purpose**: Final acceptance testing only
- **URL**: Production URL (TBD)
- **Database**: Production Supabase project
- **AI Service**: OpenRouter.ai with production API key
- **Access**: Limited, read-only testing recommended

### 5.2 Test Data Management

#### 5.2.1 Test User Accounts

- Create dedicated test accounts for various scenarios:
  - `test-dietitian-1@example.com` - Primary test user
  - `test-dietitian-2@example.com` - Multi-user testing
  - `test-dietitian-empty@example.com` - Empty state testing

#### 5.2.2 Test Meal Plans

- Create sample meal plans with:
  - Various patient profiles (different ages, weights, activity levels)
  - Different macro distributions
  - Multiple meals (1-5 meals)
  - Edge cases (minimal data, maximum data)

#### 5.2.3 Test Data Cleanup

- Implement data cleanup procedures:
  - Delete test meal plans after test runs
  - Reset test user accounts if needed
  - Clear AI session telemetry (if allowed)

### 5.3 Environment Variables

Required environment variables for testing:

```env
# Supabase
SUPABASE_URL=<test-project-url>
SUPABASE_ANON_KEY=<test-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<test-service-role-key>

# OpenRouter
OPENROUTER_API_KEY=<test-api-key>

# Application
APP_URL=http://localhost:4321
```

---

## 6. Testing Tools

### 6.1 Unit Testing Tools

- **Vitest**: Primary test runner for unit and integration tests
- **React Testing Library**: Component testing utilities
- **@testing-library/jest-dom**: DOM matchers
- **MSW (Mock Service Worker)**: API mocking for unit tests

### 6.2 Integration Testing Tools

- **Supertest**: HTTP assertions for API testing
- **MSW**: Mock external services (OpenRouter API)
- **Vitest**: Test execution framework

### 6.3 End-to-End Testing Tools

- **Playwright** (Recommended): Cross-browser E2E testing
  - Supports Chromium, Firefox, WebKit
  - Built-in test runner and reporting
  - Screenshot and video capture

### 6.4 API Testing Tools

- **Postman**: Manual API testing and collection management
- **cURL**: Command-line API testing
- **REST Client** (VS Code extension): Lightweight API testing

### 6.5 Performance Testing Tools

- **Lighthouse**: Performance auditing (integrated with Chrome DevTools)
- **WebPageTest**: Web performance analysis
- **Chrome DevTools Performance Tab**: Profiling and analysis

### 6.6 Security Testing Tools

- **OWASP ZAP**: Security vulnerability scanning (optional)
- **Browser DevTools**: Security headers inspection
- **Postman**: Token manipulation testing

### 6.7 Test Management

- **GitHub Issues**: Test case tracking and bug reporting
- **GitHub Actions**: Automated test execution in CI/CD
- **Test Documentation**: Markdown files in repository

---

## 7. Test Schedule

### 7.1 Testing Phases

#### Phase 1: Unit Testing (Week 1-2)

- **Duration**: 2 weeks
- **Focus**: Individual functions, services, components
- **Responsibility**: Development team
- **Exit Criteria**: 80% code coverage, all critical paths covered

#### Phase 2: Integration Testing (Week 3)

- **Duration**: 1 week
- **Focus**: API endpoints, database operations, service interactions
- **Responsibility**: QA team, Development team
- **Exit Criteria**: All API endpoints tested, integration issues resolved

#### Phase 3: System Testing (Week 4)

- **Duration**: 1 week
- **Focus**: End-to-end workflows, UI/UX, cross-browser testing
- **Responsibility**: QA team
- **Exit Criteria**: All critical user flows pass, browser compatibility verified

#### Phase 4: Security Testing (Week 5)

- **Duration**: 3-5 days
- **Focus**: Authentication, authorization, RLS policies, input validation
- **Responsibility**: QA team, Security review
- **Exit Criteria**: No critical security vulnerabilities, RLS policies verified

#### Phase 5: Performance Testing (Week 5)

- **Duration**: 2-3 days
- **Focus**: API response times, page load performance, AI generation latency
- **Responsibility**: QA team
- **Exit Criteria**: Performance benchmarks met

#### Phase 6: Regression Testing (Ongoing)

- **Duration**: Before each release
- **Focus**: Smoke tests, critical path verification
- **Responsibility**: QA team
- **Exit Criteria**: All smoke tests pass

### 7.2 Test Execution Timeline

| Phase               | Start Date | End Date | Status  |
| ------------------- | ---------- | -------- | ------- |
| Unit Testing        | TBD        | TBD      | Pending |
| Integration Testing | TBD        | TBD      | Pending |
| System Testing      | TBD        | TBD      | Pending |
| Security Testing    | TBD        | TBD      | Pending |
| Performance Testing | TBD        | TBD      | Pending |
| Regression Testing  | TBD        | Ongoing  | Pending |

### 7.3 Milestones

- **M1**: Unit tests complete, integration tests started
- **M2**: Integration tests complete, system tests started
- **M3**: System tests complete, security review started
- **M4**: All testing phases complete, ready for production

---

## 8. Test Acceptance Criteria

### 8.1 Functional Acceptance Criteria

1. **Authentication Module**:
   - ✅ Users can register with valid email and password
   - ✅ Users can log in with valid credentials
   - ✅ Users cannot access protected routes without authentication
   - ✅ Password reset flow completes successfully
   - ✅ Account deletion removes all user data

2. **Dashboard Module**:
   - ✅ Meal plans list displays correctly
   - ✅ Search filters results in real-time
   - ✅ Sorting works for all sortable fields
   - ✅ Delete confirmation prevents accidental deletion

3. **AI Chat Module**:
   - ✅ AI session creation generates initial meal plan
   - ✅ Follow-up messages receive AI responses
   - ✅ Error handling displays user-friendly messages
   - ✅ Accept button transfers data to editor

4. **Meal Plan Editor Module**:
   - ✅ Create mode loads data from AI chat
   - ✅ Edit mode loads existing plan data
   - ✅ Save creates new or updates existing plan
   - ✅ Form validation prevents invalid submissions

5. **Export Module**:
   - ✅ `.doc` file generates successfully
   - ✅ Document content matches meal plan data
   - ✅ File downloads with correct name

### 8.2 Non-Functional Acceptance Criteria

1. **Security**:
   - ✅ All API endpoints require authentication (except public auth endpoints)
   - ✅ RLS policies prevent cross-user data access
   - ✅ Input validation prevents injection attacks
   - ✅ API keys are never exposed client-side

2. **Performance**:
   - ✅ API endpoints respond within 500ms (p95)
   - ✅ Page loads within 2 seconds (initial load)
   - ✅ AI generation completes within 30 seconds (p95)
   - ✅ Search queries complete within 200ms

3. **Usability**:
   - ✅ Form validation provides clear error messages
   - ✅ Loading states indicate progress
   - ✅ Error messages are user-friendly and actionable
   - ✅ Navigation flows are intuitive

4. **Compatibility**:
   - ✅ Application works in Chrome, Firefox, Safari, Edge (latest versions)
   - ✅ Responsive design works on desktop, tablet, mobile viewports

### 8.3 Quality Gates

**Blocking Criteria** (Must Pass for Release):

- All critical test cases (Priority: Critical) pass
- No P1 (Critical) bugs open
- Security review approved
- RLS policies verified
- Authentication/authorization tested and validated

**Non-Blocking Criteria** (Should Pass for Release):

- All high-priority test cases pass
- P2 (High) bugs < 5 open
- Performance benchmarks met
- Cross-browser compatibility verified

**Nice-to-Have** (May Defer):

- P3 (Medium) and P4 (Low) bugs documented
- Performance optimizations beyond benchmarks
- Additional edge case coverage

---

## 9. Roles and Responsibilities

### 9.1 Testing Team Roles

#### QA Engineer

- **Responsibilities**:
  - Create and maintain test cases
  - Execute manual and automated tests
  - Report bugs and track resolution
  - Validate fixes and verify regressions
  - Maintain test documentation

#### Development Team

- **Responsibilities**:
  - Write unit tests for new features
  - Fix bugs identified by QA
  - Provide test data and test accounts
  - Assist with environment setup
  - Review and approve test plans

#### QA Lead / Test Manager

- **Responsibilities**:
  - Oversee test plan creation and execution
  - Coordinate testing phases
  - Report test status to stakeholders
  - Make go/no-go decisions based on quality gates
  - Manage test resources and schedules

#### Product Owner / Stakeholder

- **Responsibilities**:
  - Define acceptance criteria
  - Prioritize test scenarios
  - Review and approve test plans
  - Provide feedback on test coverage
  - Approve production releases

### 9.2 Communication Plan

- **Daily Standups**: Brief test status updates
- **Weekly Test Reports**: Summary of test execution, bugs found, blockers
- **Bug Triage Meetings**: Prioritize and assign bugs
- **Test Review Sessions**: Review test plans and coverage
- **Release Readiness Meetings**: Final go/no-go decision

---

## 10. Bug Reporting Procedures

### 10.1 Bug Classification

#### Priority Levels

**P1 - Critical**:

- Blocks core functionality
- Security vulnerabilities
- Data loss or corruption
- Application crashes
- **Response Time**: Immediate

**P2 - High**:

- Major feature broken or degraded
- Significant usability issues
- Performance degradation
- **Response Time**: Within 24 hours

**P3 - Medium**:

- Minor feature issues
- Cosmetic issues with workaround
- Non-critical edge cases
- **Response Time**: Within 1 week

**P4 - Low**:

- Enhancement suggestions
- Minor UI polish
- Documentation improvements
- **Response Time**: Next release cycle

#### Severity Levels

**S1 - Blocker**: Application unusable, blocks testing
**S2 - Major**: Feature significantly impaired
**S3 - Minor**: Feature works with workaround
**S4 - Trivial**: Cosmetic or minor issue

### 10.2 Bug Report Template

```markdown
**Bug ID**: BUG-XXX
**Title**: [Brief description]

**Priority**: P1/P2/P3/P4
**Severity**: S1/S2/S3/S4

**Environment**:

- Browser: [Chrome/Firefox/Safari/Edge]
- Version: [Version number]
- OS: [Windows/Mac/Linux]
- Test Environment: [Dev/Staging/Prod]

**Steps to Reproduce**:

1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**: [What should happen]

**Actual Result**: [What actually happens]

**Screenshots/Videos**: [Attach if applicable]

**Console Logs**: [If applicable]

**Additional Context**: [Any other relevant information]
```

### 10.3 Bug Tracking

- **Tool**: GitHub Issues
- **Labels**:
  - `bug`
  - `priority:p1`, `priority:p2`, `priority:p3`, `priority:p4`
  - `severity:s1`, `severity:s2`, `severity:s3`, `severity:s4`
  - `module:auth`, `module:dashboard`, `module:ai-chat`, `module:editor`, `module:export`, `module:api`

### 10.4 Bug Lifecycle

1. **New**: Bug reported, awaiting triage
2. **Assigned**: Bug assigned to developer
3. **In Progress**: Developer working on fix
4. **Fixed**: Fix implemented, awaiting QA verification
5. **Verified**: QA verified fix, bug resolved
6. **Closed**: Bug closed, no further action needed
7. **Reopened**: Bug still exists after fix attempt
8. **Won't Fix**: Bug will not be fixed (with justification)
9. **Duplicate**: Bug is duplicate of existing issue

### 10.5 Bug Verification Process

1. QA verifies bug fix in designated environment
2. Execute original test case to confirm fix
3. Perform regression testing on related areas
4. Update bug status to "Verified" or "Reopened"
5. Close bug if verified

---

## 11. Test Metrics and Reporting

### 11.1 Test Metrics

#### Test Execution Metrics

- **Total Test Cases**: Count of all test cases
- **Test Cases Executed**: Number of tests run
- **Test Cases Passed**: Number of passing tests
- **Test Cases Failed**: Number of failing tests
- **Test Cases Blocked**: Number of tests blocked by bugs
- **Test Execution Rate**: (Executed / Total) × 100%
- **Test Pass Rate**: (Passed / Executed) × 100%

#### Defect Metrics

- **Total Bugs Found**: Count of all reported bugs
- **Bugs by Priority**: Distribution (P1, P2, P3, P4)
- **Bugs by Severity**: Distribution (S1, S2, S3, S4)
- **Bugs by Module**: Distribution across modules
- **Bugs Fixed**: Number of resolved bugs
- **Bugs Open**: Number of unresolved bugs
- **Bug Density**: Bugs per test case or per feature

#### Coverage Metrics

- **Code Coverage**: Percentage of code covered by unit tests
- **Functional Coverage**: Percentage of requirements covered by tests
- **API Coverage**: Percentage of API endpoints tested

### 11.2 Test Reporting

#### Daily Test Status Report

- Test cases executed (pass/fail/blocked)
- New bugs found
- Bugs fixed/verified
- Blockers and risks

#### Weekly Test Summary Report

- Test execution progress
- Defect summary and trends
- Coverage metrics
- Risks and recommendations

#### Test Completion Report

- Final test execution summary
- Defect summary and closure rate
- Quality assessment
- Release recommendation

---

## 12. Risk Assessment and Mitigation

### 12.1 Testing Risks

#### Risk 1: OpenRouter AI Service Unavailability

- **Impact**: High - Blocks AI chat functionality
- **Probability**: Medium
- **Mitigation**:
  - Mock AI responses in unit/integration tests
  - Implement retry logic and graceful error handling
  - Monitor API status and have fallback plans
  - Use test API keys with rate limits

#### Risk 2: Supabase Database Connectivity Issues

- **Impact**: High - Blocks all data operations
- **Probability**: Low
- **Mitigation**:
  - Use local Supabase instance for development
  - Implement connection retry logic
  - Monitor database health
  - Have backup test database

#### Risk 3: RLS Policy Misconfiguration

- **Impact**: Critical - Security vulnerability
- **Probability**: Medium
- **Mitigation**:
  - Comprehensive RLS policy testing
  - Security review of policies
  - Automated tests for authorization scenarios
  - Regular policy audits

#### Risk 4: Test Environment Data Contamination

- **Impact**: Medium - Invalid test results
- **Probability**: Medium
- **Mitigation**:
  - Isolated test data sets
  - Automated cleanup procedures
  - Test data management guidelines
  - Environment reset procedures

#### Risk 5: Incomplete Test Coverage

- **Impact**: Medium - Undetected bugs
- **Probability**: Medium
- **Mitigation**:
  - Regular test plan reviews
  - Requirement traceability matrix
  - Peer reviews of test cases
  - Code coverage monitoring

#### Risk 6: Browser Compatibility Issues

- **Impact**: Medium - User experience degradation
- **Probability**: Low
- **Mitigation**:
  - Early browser testing
  - Cross-browser test automation
  - Progressive enhancement approach
  - Regular browser update testing

### 12.2 Contingency Plans

- **If AI service is down**: Focus on non-AI features, mock AI responses for UI testing
- **If database issues occur**: Use backup environment, delay testing until resolved
- **If critical bugs found late**: Extend testing phase, prioritize bug fixes, consider phased release
- **If test schedule slips**: Prioritize critical test cases, extend timeline if needed

---

## 13. Appendices

### 13.1 Test Case Template

```markdown
**Test Case ID**: TC-XXX-XXX
**Test Case Name**: [Descriptive name]
**Module**: [Module name]
**Priority**: Critical/High/Medium/Low
**Type**: Functional/Non-Functional
**Preconditions**: [Conditions that must be met]

**Test Steps**:

1. [Step 1]
2. [Step 2]
3. [Step 3]

**Test Data**: [Required test data]

**Expected Result**: [Expected outcome]

**Actual Result**: [To be filled during execution]
**Status**: Pass/Fail/Blocked/Skipped
**Comments**: [Any additional notes]
```

### 13.2 Traceability Matrix

| Requirement ID | Test Case ID             | Status |
| -------------- | ------------------------ | ------ |
| US-001         | TC-AUTH-001, TC-AUTH-002 | TBD    |
| US-002         | TC-AUTH-003, TC-AUTH-004 | TBD    |
| US-003         | TC-DASH-001, TC-DASH-002 | TBD    |
| ...            | ...                      | ...    |

### 13.3 Glossary

- **RLS**: Row-Level Security (PostgreSQL feature)
- **JWT**: JSON Web Token
- **MVP**: Minimum Viable Product
- **BaaS**: Backend-as-a-Service
- **E2E**: End-to-End
- **API**: Application Programming Interface
- **CRUD**: Create, Read, Update, Delete
- **DTO**: Data Transfer Object

**Document Version History**

| Version | Date       | Author  | Changes                    |
| ------- | ---------- | ------- | -------------------------- |
| 1.0     | 2025-01-23 | QA Team | Initial test plan creation |
