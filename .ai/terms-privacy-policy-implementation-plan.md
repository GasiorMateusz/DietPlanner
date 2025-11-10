# Implementation Plan: Terms and Privacy Policy

## 1. Overview

The Terms and Privacy Policy feature implements comprehensive legal documentation and user consent management for the Diet Planner application. This feature addresses GDPR compliance requirements for processing health-related data (special category data under Article 9) in Poland, establishes the platform's role as a data processor, and shifts maximum legal responsibility to users (dietitians) who act as data controllers for their clients' information.

**Key Objectives:**
- Provide bilingual Terms of Service and Privacy Policy documents (Polish and English) in a single markdown file
- Require explicit consent during registration with checkboxes for important sections (UX only, not stored)
- Store only boolean acceptance flag in `user_preferences` table
- Allow users to view current terms from their account profile
- Enable future terms updates with email notifications
- Disclaim platform liability for AI-generated content, data breaches caused by users, and misuse
- Establish data processor role and user responsibilities for GDPR compliance
- Support future transition to paid model

**Simplifications:**
- Single markdown file for Terms and Privacy Policy (reused in frontend)
- Checkboxes are UX-only to ensure users read important sections (not stored in database)
- Only store boolean `terms_accepted` flag in `user_preferences` table (no versioning, no section tracking)

**User Stories:**
- US-XXX: Users must accept Terms and Privacy Policy during registration
- US-XXX: Users can view Terms and Privacy Policy from their account profile
- US-XXX: Users are notified of terms updates via email
- US-XXX: Users can delete their account from account profile

## 2. View Routing

### Registration Flow (Updated)
- **Path**: `/auth/register` (existing, will be updated)
- **Layout**: Public Layout (`src/layouts/Layout.astro`)
- **Access Control**: If authenticated, redirect to `/app/dashboard`
- **New Component**: Terms and Privacy Policy Modal displayed during registration

### Account Profile (New)
- **Path**: `/app/account` (new page)
- **Layout**: Private Layout (`src/layouts/PrivateLayout.astro`)
- **Access Control**: Requires authentication, redirects to `/auth/login` if not authenticated
- **Navigation**: Accessible from navigation bar (new "My Account" button/link)

## 3. Component Structure

```
register.astro (Astro Page - Updated)
└── Layout.astro (Public Layout)
    └── RegisterForm (React Component - Updated)
        ├── Alert (Error Display)
        ├── Alert (Success Display)
        ├── Input (Email Field)
        ├── Input (Password Field)
        ├── Input (Confirm Password Field)
        ├── TermsAndPrivacyModal (React Component - New)
        │   ├── Dialog (Shadcn/ui Dialog)
        │   ├── DialogHeader
        │   │   ├── DialogTitle
        │   │   └── DialogDescription
        │   ├── Tabs (Shadcn/ui Tabs - Terms / Privacy Policy)
        │   │   ├── TabsList
        │   │   ├── TabsTrigger (Terms)
        │   │   ├── TabsTrigger (Privacy Policy)
        │   │   ├── TabsContent (Terms Content)
        │   │   │   ├── ScrollArea (Shadcn/ui ScrollArea)
        │   │   │   ├── Markdown Content (Rendered from markdown file)
        │   │   │   ├── Checkbox (Section 1: Service Description) - UX only
        │   │   │   ├── Checkbox (Section 2: User Responsibilities) - UX only
        │   │   │   ├── Checkbox (Section 3: Data Processing) - UX only
        │   │   │   ├── Checkbox (Section 4: AI Content Disclaimer) - UX only
        │   │   │   ├── Checkbox (Section 5: Liability Limitations) - UX only
        │   │   │   └── Checkbox (Section 6: Terms Modifications) - UX only
        │   │   └── TabsContent (Privacy Policy Content)
        │   │       ├── ScrollArea
        │   │       ├── Markdown Content (Rendered from markdown file)
        │   │       ├── Checkbox (Section 1: Data Controller vs Processor) - UX only
        │   │       ├── Checkbox (Section 2: Data Categories) - UX only
        │   │       ├── Checkbox (Section 3: Third-Party Services) - UX only
        │   │       ├── Checkbox (Section 4: Data Retention) - UX only
        │   │       ├── Checkbox (Section 5: User Rights) - UX only
        │   │       └── Checkbox (Section 6: Data Security) - UX only
        │   └── DialogFooter
        │       ├── Button (Cancel)
        │       └── Button (Accept All) - Enabled when all checkboxes checked
        ├── Checkbox (Terms Acceptance - Updated)
        └── Button (Submit)

account.astro (Astro Page - New)
└── PrivateLayout.astro
    └── AccountProfile (React Component - New)
        ├── Card (Account Information)
        │   ├── CardHeader
        │   │   └── CardTitle (Email)
        │   └── CardContent
        │       └── Text (Email address)
        ├── Card (Terms and Privacy Policy)
        │   ├── CardHeader
        │   │   └── CardTitle (Terms and Privacy Policy)
        │   └── CardContent
        │       ├── Text (Accepted at: {terms_accepted_at})
        │       └── Button (View Current Terms)
        │           └── TermsAndPrivacyModal (Reused in view mode - read-only, no checkboxes)
        ├── Card (Account Management)
        │   ├── CardHeader
        │   │   └── CardTitle (Account Management)
        │   └── CardContent
        │       ├── Button (Change Password)
        │       └── Button (Delete Account)
        │           └── DeleteAccountConfirmationDialog (Reused)
        └── Card (Legal Information)
            ├── CardHeader
            │   └── CardTitle (Legal Information)
            └── CardContent
                ├── Text (Data Processor Notice)
                └── Text (Contact Information)
```

## 4. Component Details

### TermsAndPrivacyModal (React Component - New)

- **Component description**: A modal dialog component that displays the Terms of Service and Privacy Policy documents in a tabbed interface. Users can switch between Terms and Privacy Policy tabs, scroll through content, and check off important sections. The modal can be opened from registration form or account profile. Supports both Polish and English languages based on user's language preference.

- **Main elements**:
  - `<Dialog>`: Root dialog component with `open` and `onOpenChange` props
  - `<DialogHeader>`: Contains title and description
  - `<DialogTitle>`: "Terms and Privacy Policy" (translated)
  - `<DialogDescription>`: Brief explanation of what users are agreeing to
  - `<Tabs>`: Tab container for switching between Terms and Privacy Policy
  - `<TabsList>`: Container for tab triggers
  - `<TabsTrigger value="terms">`: "Terms of Service" tab
  - `<TabsTrigger value="privacy">`: "Privacy Policy" tab
  - `<TabsContent value="terms">`: Terms content area
  - `<ScrollArea>`: Scrollable container for long content
  - `<div className="space-y-6">`: Content sections with checkboxes
  - `<Checkbox>`: Individual checkboxes for each important section (6 for Terms, 6 for Privacy)
  - `<Label>`: Section titles and descriptions
  - `<TabsContent value="privacy">`: Privacy Policy content area
  - `<DialogFooter>`: Action buttons
  - `<Button variant="outline">`: "Cancel" button
  - `<Button>`: "Accept All" button (only enabled when all checkboxes are checked)

- **Handled interactions**:
  - Modal open/close: Controlled by `open` prop, closes on backdrop click or Cancel button
  - Tab switching: User can switch between Terms and Privacy Policy tabs
  - Checkbox toggling: Each important section has a checkbox that must be checked
  - Accept All button: Enabled only when all checkboxes are checked, triggers `onAccept` callback
  - Language switching: Content updates based on current language preference
  - Scroll: Content is scrollable within the modal

- **Handled validation**:
  - All checkboxes must be checked before "Accept All" button is enabled
  - Visual feedback (disabled state) when checkboxes are not all checked

- **Types**:
```typescript
interface TermsAndPrivacyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  mode?: "registration" | "view"; // "registration" shows checkboxes, "view" is read-only
}
```

### RegisterForm (React Component - Updated)

- **Component description**: Updated registration form that integrates the Terms and Privacy Policy modal. The terms acceptance checkbox now opens the modal instead of just being a simple checkbox. Users must view and accept all sections before they can proceed with registration.

- **Main elements** (additions/updates):
  - `<TermsAndPrivacyModal>`: New modal component integrated into form
  - Updated terms checkbox: Now opens modal instead of simple acceptance
  - Link/button: "View Terms and Privacy Policy" that opens the modal

- **Handled interactions** (additions):
  - Terms link click: Opens `TermsAndPrivacyModal` in registration mode
  - Modal acceptance: When all checkboxes are checked and user clicks "Accept All", closes modal and checks the terms acceptance checkbox
  - Form submission: Only proceeds if terms are accepted (existing validation)

- **Handled validation** (additions):
  - Terms must be accepted via modal (all checkboxes checked) before form can be submitted
  - Existing validation for `termsAccepted: z.literal(true)` remains

### AccountProfile (React Component - New)

- **Component description**: A comprehensive account management page component that displays user account information, provides access to Terms and Privacy Policy, and includes account management features (change password, delete account). This component consolidates account-related functionality in one place.

- **Main elements**:
  - `<Card>`: Account Information card
  - `<CardHeader>`: Contains "Account Information" title
  - `<CardContent>`: Displays user email address
  - `<Card>`: Terms and Privacy Policy card
  - `<CardHeader>`: Contains "Terms and Privacy Policy" title
  - `<CardContent>`: Displays accepted version info and "View Current Terms" button
  - `<TermsAndPrivacyModal>`: Reused modal component in "view" mode (read-only)
  - `<Card>`: Account Management card
  - `<CardHeader>`: Contains "Account Management" title
  - `<CardContent>`: Contains "Change Password" and "Delete Account" buttons
  - `<ChangePasswordForm>`: Form component for changing password (if implemented separately)
  - `<DeleteAccountConfirmationDialog>`: Reused dialog component
  - `<Card>`: Legal Information card
  - `<CardHeader>`: Contains "Legal Information" title
  - `<CardContent>`: Displays data processor notice and contact information

- **Handled interactions**:
  - View Terms button click: Opens `TermsAndPrivacyModal` in view mode (read-only, no checkboxes)
  - Change Password button click: Opens change password form/dialog
  - Delete Account button click: Opens `DeleteAccountConfirmationDialog`
  - Language switching: Content updates based on current language preference

- **Handled validation**:
  - None (display-only component, validation handled by child components)

- **Types**:
```typescript
interface AccountProfileProps {
  userEmail: string;
  termsAccepted: boolean;
  termsAcceptedAt: string | null;
}
```

## 5. Types

### Database Types

```typescript
// Extended user_preferences table (migration adds these columns)
interface UserPreferencesRow {
  user_id: string; // UUID, primary key, foreign key to auth.users.id
  language: "en" | "pl";
  terms_accepted: boolean; // NEW: Boolean flag indicating user accepted terms
  terms_accepted_at: string | null; // NEW: Timestamp of acceptance
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}
```

### API DTOs (add to `src/types.ts`)

```typescript
/**
 * **DTO**: The response for retrieving user's terms acceptance status.
 * @Endpoint `GET /api/user-preferences` (extended response)
 */
export interface GetUserPreferencesResponseDto {
  language: "en" | "pl";
  theme: Theme;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
}

/**
 * **Command**: The request payload for accepting terms.
 * @Endpoint `PUT /api/user-preferences` (with terms_accepted: true)
 */
export interface UpdateUserPreferencesCommand {
  language?: "en" | "pl";
  theme?: Theme;
  terms_accepted?: boolean; // Set to true when accepting terms
}
```

### Component Prop Types

```typescript
// TermsAndPrivacyModal props
interface TermsAndPrivacyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  mode?: "registration" | "view";
}

// AccountProfile props
interface AccountProfileProps {
  userEmail: string;
  termsAcceptedVersion: string | null;
  termsAcceptedAt: string | null;
}
```

## 6. State Management

### TermsAndPrivacyModal State

- **Local state** (React `useState`):
  - `checkedSections`: `Set<string>` - Tracks which section checkboxes are checked (UX only, not sent to API)
  - `activeTab`: `"terms" | "privacy"` - Current active tab
  - `markdownContent`: `string | null` - Loaded markdown content (from static file)

- **State flow**:
  1. Component mounts or `open` changes to `true`
  2. Loads markdown file based on current language (`/terms-privacy-policy.en.md` or `/terms-privacy-policy.pl.md`)
  3. User checks/unchecks section checkboxes (UX only, ensures user reads important sections)
  4. `checkedSections` state updates
  5. "Accept All" button enabled/disabled based on all required sections being checked
  6. On "Accept All" click, `onAccept` callback fires, modal closes (only boolean acceptance is stored)

### RegisterForm State (Updates)

- **Existing state**: Form state managed by React Hook Form
- **New state**:
  - `isTermsModalOpen`: `boolean` - Controls Terms modal visibility
  - `termsAccepted`: `boolean` - Updated when user accepts via modal

- **State flow**:
  1. User clicks "View Terms and Privacy Policy" link
  2. `isTermsModalOpen` set to `true`
  3. User checks all required sections and clicks "Accept All"
  4. `onAccept` callback sets `termsAccepted` to `true` (form field) and closes modal
  5. Form validation passes, user can submit
  6. On successful registration, API call sets `terms_accepted: true` in `user_preferences` table

### AccountProfile State

- **Local state** (React `useState`):
  - `isTermsModalOpen`: `boolean` - Controls Terms modal visibility in view mode
  - `isChangePasswordOpen`: `boolean` - Controls change password form/dialog
  - `isDeleteDialogOpen`: `boolean` - Controls delete account confirmation dialog

- **Props state**:
  - `userEmail`: From server-side props
  - `termsAccepted`: From API response (`GET /api/user-preferences`)
  - `termsAcceptedAt`: From API response (`GET /api/user-preferences`)

## 7. API Integration

### Extended API Endpoints

#### `GET /api/user-preferences` (Extended)

- **Description**: Retrieves user preferences including terms acceptance status
- **Authentication**: Required (Bearer token)
- **Request**: None
- **Response**: `GetUserPreferencesResponseDto` (extended)
  ```typescript
  {
    language: "en" | "pl";
    theme: "light" | "dark";
    terms_accepted: boolean; // NEW
    terms_accepted_at: string | null; // NEW
  }
  ```
- **Success Codes**: `200 OK`
- **Error Codes**: 
  - `401 Unauthorized`: User not authenticated
  - `500 Internal Server Error`: Database error

#### `PUT /api/user-preferences` (Extended)

- **Description**: Updates user preferences, including terms acceptance
- **Authentication**: Required (Bearer token)
- **Request**: `UpdateUserPreferencesCommand` (extended)
  ```typescript
  {
    language?: "en" | "pl";
    theme?: "light" | "dark";
    terms_accepted?: boolean; // NEW: Set to true when accepting terms
  }
  ```
- **Response**: `UpdatePreferencesResponseDto` (extended)
  ```typescript
  {
    language: "en" | "pl";
    theme: "light" | "dark";
    terms_accepted: boolean; // NEW
    terms_accepted_at: string | null; // NEW (set automatically when terms_accepted changes to true)
  }
  ```
- **Success Codes**: `200 OK`
- **Error Codes**:
  - `400 Bad Request`: Validation error
  - `401 Unauthorized`: User not authenticated
  - `500 Internal Server Error`: Database error

### Terms Content (Static Files)

- **Description**: Terms and Privacy Policy content is served as static markdown files
- **Location**: `public/terms-privacy-policy.en.md` and `public/terms-privacy-policy.pl.md`
- **Access**: Direct file access via URL (e.g., `/terms-privacy-policy.en.md`)
- **No API Endpoint**: Content is loaded directly in frontend component via fetch or import

### Existing API Endpoints (Used)

#### `DELETE /api/account` (Existing)

- **Description**: Deletes user account (moved from NavBar to AccountProfile)
- **Usage**: Called from AccountProfile's DeleteAccountConfirmationDialog

### API Client Functions (Updated)

```typescript
// src/lib/api/user-preferences.client.ts (extend existing)

// Existing function, now returns extended response
export async function getPreferences(): Promise<GetUserPreferencesResponseDto> {
  // GET /api/user-preferences
  // Now includes terms_accepted and terms_accepted_at
}

// Existing function, now accepts terms_accepted parameter
export async function updatePreferences(
  command: UpdateUserPreferencesCommand
): Promise<UpdatePreferencesResponseDto> {
  // PUT /api/user-preferences
  // Can now include terms_accepted: true
}
```

## 8. User Interactions

### Registration Flow

1. **User visits registration page** (`/auth/register`)
   - **Expected Outcome**: Registration form is displayed
   - **Implementation**: Existing `register.astro` page renders `RegisterForm` component

2. **User clicks "View Terms and Privacy Policy" link**
   - **Expected Outcome**: Terms and Privacy Policy modal opens in registration mode with checkboxes
   - **Implementation**: `RegisterForm` sets `isTermsModalOpen` to `true`, renders `TermsAndPrivacyModal` with `mode="registration"`

3. **User switches between Terms and Privacy Policy tabs**
   - **Expected Outcome**: Content switches between Terms and Privacy Policy sections
   - **Implementation**: `TermsAndPrivacyModal` manages `activeTab` state, renders appropriate `TabsContent`

4. **User checks section checkboxes**
   - **Expected Outcome**: Checkboxes are checked, "Accept All" button becomes enabled when all required sections are checked
   - **Implementation**: `TermsAndPrivacyModal` updates `checkedSections` Set, validates all required sections are checked

5. **User clicks "Accept All" button**
   - **Expected Outcome**: Modal closes, terms acceptance checkbox in form is checked, form can be submitted
   - **Implementation**: `onAccept` callback fires, `RegisterForm` sets `termsAccepted` to `true` via form.setValue, closes modal

6. **User submits registration form**
   - **Expected Outcome**: If terms accepted, registration proceeds; if not, validation error is shown
   - **Implementation**: Existing validation ensures `termsAccepted === true`, after successful Supabase registration, API call to `PUT /api/user-preferences` sets `terms_accepted: true`

### Account Profile Flow

1. **User navigates to account profile** (`/app/account`)
   - **Expected Outcome**: Account profile page displays with user email, terms acceptance info, and account management options
   - **Implementation**: `account.astro` page fetches user data and terms acceptance, renders `AccountProfile` component

2. **User clicks "View Current Terms" button**
   - **Expected Outcome**: Terms and Privacy Policy modal opens in view mode (read-only, no checkboxes)
   - **Implementation**: `AccountProfile` sets `isTermsModalOpen` to `true`, renders `TermsAndPrivacyModal` with `mode="view"`

3. **User clicks "Change Password" button**
   - **Expected Outcome**: Change password form/dialog opens
   - **Implementation**: Opens change password form (implementation depends on existing or new component)

4. **User clicks "Delete Account" button**
   - **Expected Outcome**: Delete account confirmation dialog opens
   - **Implementation**: `AccountProfile` sets `isDeleteDialogOpen` to `true`, renders `DeleteAccountConfirmationDialog`

5. **User confirms account deletion**
   - **Expected Outcome**: Account is deleted, user is signed out and redirected to home page
   - **Implementation**: Calls `DELETE /api/account`, handles response, redirects to home

## 9. Conditions and Validation

### Registration Form Validation

- **Terms Acceptance**:
  - **Condition**: `termsAccepted` must be `true` (literal)
  - **Validation**: Zod schema `z.literal(true)`
  - **Error Message**: "You must accept the terms to continue." (translated)
  - **Trigger**: On form submission

- **All Required Sections Checked**:
  - **Condition**: All required section checkboxes in modal must be checked
  - **Validation**: Client-side check in `TermsAndPrivacyModal`
  - **Error Message**: "Accept All" button is disabled until all checked
  - **Trigger**: Real-time as user checks/unchecks boxes

### Terms Acceptance API Validation

- **Boolean Validation**:
  - **Condition**: `terms_accepted` must be a boolean value
  - **Validation**: Server-side Zod schema validation
  - **Error Code**: `400 Bad Request` if invalid type
  - **Error Message**: "Invalid terms acceptance value."

- **Note**: No version or section tracking validation needed - only boolean acceptance is stored

### Access Control Conditions

- **Account Profile Page**:
  - **Condition**: User must be authenticated
  - **Implementation**: Middleware or page-level check
  - **Redirect**: `/auth/login` if not authenticated

- **User Preferences Endpoint**:
  - **Condition**: User must be authenticated
  - **Implementation**: API middleware checks Authorization header
  - **Error Code**: `401 Unauthorized` if not authenticated

## 10. Error Handling

### Registration Flow Errors

- **Terms Not Accepted**:
  - **Error Type**: Validation error
  - **Display**: Inline error message below terms checkbox
  - **User Message**: "You must accept the terms to continue." (translated)
  - **Recovery**: User must open modal and accept all sections

- **Terms Acceptance API Failure**:
  - **Error Type**: API error (network or server)
  - **Display**: Root-level error alert in registration form
  - **User Message**: "Failed to record terms acceptance. Please try again." (translated)
  - **Recovery**: User can retry registration (account is created but terms acceptance may need to be set manually)

### Account Profile Errors

- **Failed to Load Terms Acceptance**:
  - **Error Type**: API error
  - **Display**: Error message in Terms card
  - **User Message**: "Failed to load terms information. Please refresh the page." (translated)
  - **Recovery**: User can refresh page

- **Failed to Load Terms Content**:
  - **Error Type**: File loading error (when opening modal)
  - **Display**: Error message in modal
  - **User Message**: "Failed to load terms content. Please try again." (translated)
  - **Recovery**: User can close and reopen modal, or refresh page

### Terms Content Loading Errors

- **Network Error**:
  - **Error Type**: Network failure
  - **Display**: Error state in modal with retry button
  - **User Message**: "Unable to load terms. Please check your connection and try again." (translated)
  - **Recovery**: Retry button or close and reopen

- **Invalid Language**:
  - **Error Type**: API validation error
  - **Display**: Falls back to English content
  - **User Message**: None (silent fallback)
  - **Recovery**: Automatic fallback

## 11. Terms and Privacy Policy Content Structure

### Terms of Service Sections (6 Required Checkboxes)

1. **Service Description**
   - Content: Description of Diet Planner service, free for professional dietitians, AI-powered meal plan generation
   - Disclaimer: Service may transition to paid model in future

2. **User Responsibilities**
   - Content: Dietitians are responsible for:
     - Obtaining client consent before entering client data
     - Compliance with GDPR and Polish data protection laws
     - Verifying AI-generated content before use
     - Professional liability for meal plans provided to clients
     - Compliance with professional dietitian regulations

3. **Data Processing**
   - Content: Platform acts as data processor, dietitians are data controllers
   - Content: Data is stored in Supabase (EU region), processed by OpenRouter (third-party AI service)
   - Content: Users must ensure they have legal basis for processing client health data

4. **AI Content Disclaimer**
   - Content: AI-generated content is provided "as-is" without warranty
   - Content: Users must verify all information before using with patients
   - Content: Platform is not liable for accuracy, completeness, or suitability of AI-generated meal plans

5. **Liability Limitations**
   - Content: Platform disclaims all warranties, express or implied
   - Content: Platform is not liable for:
     - Data breaches caused by user negligence
     - Misuse of the platform
     - Professional liability arising from meal plans
     - Loss of data or business interruption
   - Content: Maximum liability limited to service fees paid (currently $0)

6. **Terms Modifications**
   - Content: Terms may be updated at any time
   - Content: Users will be notified via email of material changes
   - Content: Continued use of service constitutes acceptance of new terms
   - Content: Users can terminate account if they disagree with changes

### Privacy Policy Sections (6 Required Checkboxes)

1. **Data Controller vs Processor**
   - Content: Platform is data processor, dietitians are data controllers for client data
   - Content: Platform processes data only as instructed by users
   - Content: Users are responsible for GDPR compliance for client data

2. **Data Categories**
   - Content: Account data: email address
   - Content: Client data: may include names, medical conditions, dietary restrictions, health information (entered by users in meal plan labels/content)
   - Content: Meal plans: stored in database, associated with user account
   - Content: AI conversation history: stored permanently for analytics, not accessible to users

3. **Third-Party Services**
   - Content: Supabase: Database and authentication (EU region)
   - Content: OpenRouter: AI service provider (processes prompts and generates responses)
   - Content: General notice that data may be processed by third parties
   - Content: Users should review third-party privacy policies

4. **Data Retention**
   - Content: Account data: retained until account deletion
   - Content: Meal plans: retained until deleted by user or account deletion
   - Content: AI conversation history: retained permanently, even after account deletion
   - Content: Users can delete meal plans and accounts at any time

5. **User Rights**
   - Content: Users have right to access, rectify, and delete their data
   - Content: Users can delete account via account profile
   - Content: Users cannot access or delete AI conversation history
   - Content: Users are responsible for handling client data subject rights requests

6. **Data Security**
   - Content: Platform implements reasonable security measures
   - Content: Data is encrypted in transit and at rest
   - Content: Users are responsible for maintaining account security (password)
   - Content: Platform is not liable for breaches caused by user negligence

## 12. Database Schema

### Extended Table: `user_preferences`

```sql
-- Migration: Add terms acceptance columns to existing user_preferences table
ALTER TABLE "public"."user_preferences"
ADD COLUMN "terms_accepted" boolean NOT NULL DEFAULT false,
ADD COLUMN "terms_accepted_at" timestamptz;

-- Add comment for documentation
COMMENT ON COLUMN "public"."user_preferences"."terms_accepted" IS 'Boolean flag indicating user has accepted Terms and Privacy Policy';
COMMENT ON COLUMN "public"."user_preferences"."terms_accepted_at" IS 'Timestamp when user accepted terms (set automatically when terms_accepted changes to true)';

-- Create trigger to automatically set terms_accepted_at when terms_accepted changes to true
CREATE OR REPLACE FUNCTION "public"."handle_terms_accepted_at"()
RETURNS TRIGGER AS $$
BEGIN
  -- Set terms_accepted_at when terms_accepted changes from false to true
  IF NEW.terms_accepted = true AND (OLD.terms_accepted IS NULL OR OLD.terms_accepted = false) THEN
    NEW.terms_accepted_at = now();
  END IF;
  -- Clear terms_accepted_at when terms_accepted changes to false
  IF NEW.terms_accepted = false THEN
    NEW.terms_accepted_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "on_user_preferences_terms_accepted"
BEFORE UPDATE ON "public"."user_preferences"
FOR EACH ROW
WHEN (OLD.terms_accepted IS DISTINCT FROM NEW.terms_accepted)
EXECUTE FUNCTION "public"."handle_terms_accepted_at"();
```

**Note**: No new RLS policies needed - existing policies on `user_preferences` table already cover these new columns.

### Terms Configuration (Simplified)

```typescript
// src/lib/terms/terms.config.ts
export const TERMS_CONFIG = {
  // List of required section IDs for UX checkboxes (not stored in DB)
  requiredTermsSections: [
    "service-description",
    "user-responsibilities",
    "data-processing",
    "ai-content-disclaimer",
    "liability-limitations",
    "terms-modifications",
  ],
  requiredPrivacySections: [
    "data-controller",
    "data-categories",
    "third-party-services",
    "data-retention",
    "user-rights",
    "data-security",
  ],
} as const;
```

## 13. Translation Keys

### New Translation Keys (add to `src/lib/i18n/types.ts` and translation files)

```typescript
// Add to TranslationKey type
| "terms.title"
| "terms.privacyTitle"
| "terms.viewTerms"
| "terms.acceptAll"
| "terms.acceptedVersion"
| "terms.acceptedAt"
| "terms.currentVersion"
| "terms.section.serviceDescription"
| "terms.section.userResponsibilities"
| "terms.section.dataProcessing"
| "terms.section.aiContentDisclaimer"
| "terms.section.liabilityLimitations"
| "terms.section.termsModifications"
| "privacy.section.dataController"
| "privacy.section.dataCategories"
| "privacy.section.thirdPartyServices"
| "privacy.section.dataRetention"
| "privacy.section.userRights"
| "privacy.section.dataSecurity"
| "account.title"
| "account.accountInformation"
| "account.email"
| "account.termsAndPrivacy"
| "account.viewCurrentTerms"
| "account.accountManagement"
| "account.changePassword"
| "account.deleteAccount"
| "account.legalInformation"
| "account.dataProcessorNotice"
| "account.contactInformation"
| "account.termsLoadError"
| "account.termsAcceptError"
```

### Terms Content Files Structure

Terms and Privacy Policy content will be stored as single markdown files (one per language):

- `public/terms-privacy-policy.en.md` - English Terms of Service and Privacy Policy (combined in one file)
- `public/terms-privacy-policy.pl.md` - Polish Terms of Service and Privacy Policy (combined in one file)

**File Structure**: Each markdown file contains both Terms of Service and Privacy Policy sections, separated by headers. The frontend component will parse the markdown and split it into two tabs (Terms / Privacy Policy) based on section headers.

## 14. Email Notifications (Future Implementation)

### Terms Update Notification Email

- **Trigger**: When terms version is updated
- **Recipients**: All active users (users with accounts)
- **Content**:
  - Subject: "Terms and Privacy Policy Updated - Action Required" (translated)
  - Body: Notification that terms have been updated, link to view new terms, notice that continued use constitutes acceptance
- **Implementation**: Background job or manual trigger that sends emails via Supabase or email service

**Note**: Email notification functionality is out of scope for initial implementation but should be designed to support this future requirement.

## 15. Implementation Steps

### Phase 1: Database and API Foundation

1. **Create database migration**
   - Create `supabase/migrations/YYYYMMDDHHMMSS_add_terms_acceptance_to_preferences.sql`
   - Add `terms_accepted` and `terms_accepted_at` columns to `user_preferences` table
   - Add trigger to automatically set `terms_accepted_at` timestamp
   - Run migration and update `database.types.ts`

2. **Create terms configuration**
   - Create `src/lib/terms/terms.config.ts` with required section IDs (for UX checkboxes only)
   - No version tracking needed

3. **Extend existing API endpoints**
   - Update `src/pages/api/user-preferences/index.ts` to handle `terms_accepted` field
   - Update validation schemas in `src/lib/validation/user-preferences.schemas.ts`
   - Update service functions in `src/lib/user-preferences/user-preference.service.ts`

4. **Update API client functions**
   - Update `src/lib/api/user-preferences.client.ts`
   - Extend `getPreferences()` and `updatePreferences()` to include `terms_accepted` and `terms_accepted_at`

5. **Add types to `src/types.ts`**
   - Update `GetUserPreferencesResponseDto` to include `terms_accepted` and `terms_accepted_at`
   - Update `UpdateUserPreferencesCommand` to include optional `terms_accepted` field
   - Update `UpdatePreferencesResponseDto` to include `terms_accepted` and `terms_accepted_at`

### Phase 2: Terms Content Creation

6. **Create Terms and Privacy Policy content**
   - Write comprehensive Terms of Service in English (6 sections)
   - Write comprehensive Privacy Policy in English (6 sections)
   - Combine both into single markdown file: `public/terms-privacy-policy.en.md`
   - Translate to Polish: `public/terms-privacy-policy.pl.md`
   - Use markdown headers to separate Terms and Privacy Policy sections

7. **Create markdown parser utility (optional)**
   - Create `src/lib/terms/markdown-parser.ts` to split markdown into Terms/Privacy sections
   - Parse markdown headers to identify section boundaries
   - Or use simple string splitting based on "# Terms of Service" and "# Privacy Policy" headers

### Phase 3: UI Components

8. **Create TermsAndPrivacyModal component**
   - Create `src/components/terms/TermsAndPrivacyModal.tsx`
   - Implement tabbed interface (Terms/Privacy)
   - Load markdown file from `/terms-privacy-policy.{lang}.md` based on current language
   - Parse markdown to split into Terms and Privacy Policy sections
   - Render markdown content (use a markdown renderer like `react-markdown` or `marked`)
   - Implement checkboxes for required sections (UX only, not stored)
   - Implement "Accept All" button logic (enabled when all checkboxes checked)
   - Support both "registration" (with checkboxes) and "view" (read-only, no checkboxes) modes
   - Add translations for UI elements

9. **Update RegisterForm component**
   - Update `src/components/auth/RegisterForm.tsx`
   - Add state for terms modal (`isTermsModalOpen`)
   - Integrate `TermsAndPrivacyModal` component
   - Update terms checkbox label to include link/button to open modal
   - Handle modal acceptance callback (sets `termsAccepted` form field to `true`)
   - After successful Supabase registration, call `PUT /api/user-preferences` with `terms_accepted: true`

10. **Create AccountProfile component**
    - Create `src/components/account/AccountProfile.tsx`
    - Implement account information card
    - Implement terms and privacy policy card
    - Implement account management card (change password, delete account)
    - Implement legal information card
    - Integrate `TermsAndPrivacyModal` in view mode
    - Integrate `DeleteAccountConfirmationDialog` (reuse existing)

11. **Create account.astro page**
    - Create `src/pages/app/account.astro`
    - Add authentication check and redirect
    - Fetch user data and terms acceptance
    - Render `AccountProfile` component with props
    - Add page title and metadata

12. **Update navigation**
    - Add "My Account" link/button to navigation (NavBar or PrivateLayout)
    - Link to `/app/account`

### Phase 4: Translations

13. **Add translation keys**
    - Update `src/lib/i18n/types.ts` with new translation keys
    - Add English translations to `src/lib/i18n/translations/en.json`
    - Add Polish translations to `src/lib/i18n/translations/pl.json`

### Phase 5: Testing

14. **Test registration flow**
    - Test terms modal opens and closes
    - Test markdown content loads correctly based on language
    - Test all checkboxes must be checked (UX validation)
    - Test "Accept All" button enables/disables correctly
    - Test terms acceptance boolean is recorded in database (not which sections were checked)
    - Test `terms_accepted_at` timestamp is set automatically
    - Test form validation prevents submission without acceptance

15. **Test account profile**
    - Test account profile page loads with user data
    - Test "View Current Terms" opens modal in view mode
    - Test terms acceptance info displays correctly
    - Test delete account flow (moved from NavBar)

16. **Test API endpoints**
    - Test `GET /api/user-preferences` returns `terms_accepted` and `terms_accepted_at`
    - Test `PUT /api/user-preferences` with `terms_accepted: true` sets timestamp correctly
    - Test trigger automatically sets `terms_accepted_at` when `terms_accepted` changes to true
    - Test error handling for all endpoints

17. **Test error handling**
    - Test network errors during markdown file loading
    - Test API errors during terms acceptance
    - Test validation errors for invalid boolean values
    - Test markdown file not found errors (fallback to English)

18. **Test accessibility**
    - Test keyboard navigation in modal
    - Test screen reader announcements
    - Test focus management when modal opens/closes
    - Test ARIA attributes

19. **Test responsive design**
    - Test modal on mobile devices
    - Test account profile page on mobile
    - Test scrolling behavior in modal

### Phase 6: Integration and Polish

20. **Move account deletion from NavBar to AccountProfile**
    - Remove delete account button from `NavBar.tsx`
    - Ensure `DeleteAccountConfirmationDialog` is accessible from AccountProfile
    - Update navigation to include "My Account" link

21. **Add legal review checkpoints**
    - Document that terms content should be reviewed by legal counsel
    - Add TODO comments for legal review
    - Ensure GDPR compliance language is accurate

22. **Final testing**
    - End-to-end user flow testing
    - Cross-browser testing
    - Performance testing (terms content loading)
    - Security testing (RLS policies, authentication)

## 16. Legal Compliance Notes

### GDPR Compliance Considerations

1. **Data Processor Role**: Terms must clearly state platform is data processor, users are data controllers
2. **Special Category Data**: Privacy Policy must address processing of health data (Article 9 GDPR)
3. **Legal Basis**: Users must be informed they need explicit consent or other legal basis for processing client health data
4. **Third-Party Processing**: Must disclose Supabase and OpenRouter as data processors
5. **Data Retention**: Must clearly state conversation history is retained permanently
6. **User Rights**: Must explain user rights and how to exercise them
7. **Data Security**: Must describe security measures implemented

### Polish Law Considerations

1. **Polish Personal Data Protection Act (PDPA)**: Terms must comply with Polish implementation of GDPR
2. **Medical Data Regulations**: If applicable, must reference Polish medical data processing regulations
3. **Professional Secrecy**: May need to address professional secrecy obligations for dietitians

### Recommendations

1. **Legal Review**: Terms and Privacy Policy content should be reviewed by legal counsel familiar with:
   - GDPR and Polish data protection law
   - Medical/health data processing regulations
   - Software-as-a-Service (SaaS) terms and conditions

2. **Version Control**: Implement proper versioning system for terms updates
3. **Audit Trail**: Database table tracks acceptance with timestamps for audit purposes
4. **Email Notifications**: Implement email notification system for terms updates (future phase)

## 17. Future Enhancements

1. **Email Notifications**: Implement automated email notifications when terms are updated
2. **Terms History**: Allow users to view previous versions of terms they accepted
3. **Re-acceptance Flow**: Force re-acceptance for major terms changes
4. **Paid Model Transition**: Update terms to reflect paid subscription model when implemented
5. **Multi-language Support**: Extend to additional languages if needed
6. **Terms Analytics**: Track acceptance rates and section-specific analytics
7. **Export Terms**: Allow users to download terms as PDF

