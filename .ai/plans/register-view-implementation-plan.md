# View Implementation Plan: Register

## 1. Overview

The Register view is a public-facing authentication page that allows new users (dietitians) to create an account in the Diet Planner application. The view implements user story US-001 and provides a form-based registration interface with client-side validation, terms acceptance requirement, and automatic login upon successful registration. The view uses Supabase Auth (BaaS) for account creation, not a custom API endpoint. After successful registration, users are automatically authenticated and redirected to the Dashboard.

## 2. View Routing

- **Path**: `/auth/register` (Astro page at `src/pages/auth/register.astro`)
- **Layout**: Public Layout (`src/layouts/Layout.astro`)
- **Access Control**: If a user is already authenticated, they are automatically redirected to `/app/dashboard`
- **Navigation**: Accessible from the Login page via "Don't have an account?" link

## 3. Component Structure

```
register.astro (Astro Page)
└── Layout.astro (Public Layout)
    └── RegisterForm (React Component)
        ├── Alert (Error Display)
        ├── Alert (Success Display)
        ├── Input (Email Field)
        ├── Input (Password Field)
        ├── Input (Confirm Password Field)
        ├── Checkbox (Terms Acceptance)
        ├── Button (Submit)
        └── Link (To Login Page)
```

## 4. Component Details

### RegisterForm (React Component)

- **Component description**: A client-side React form component that handles user registration. It manages form state using React Hook Form with Zod validation, displays validation errors inline, handles Supabase Auth registration, and manages success/error states. The component is fully self-contained and handles all registration logic.

- **Main elements**:
  - `<form>`: Main form element with `onSubmit` handler
  - `<Alert>`: Error alert displayed when registration fails (root-level errors)
  - `<Alert>`: Success alert displayed when account is created (if email confirmation is required)
  - `<div className="grid gap-2">`: Container for email input field with label and error message
  - `<Label>`: "Email" label with `htmlFor` attribute linked to input
  - `<Input>`: Email input field with `type="email"`, `inputMode="email"`, `autoComplete="email"`
  - `<p>`: Error message for email field (conditionally rendered)
  - `<div className="grid gap-2">`: Container for password input field
  - `<Label>`: "Password" label
  - `<Input>`: Password input field with `type="password"`, `autoComplete="new-password"`
  - `<p>`: Error message or helper text for password field
  - `<div className="grid gap-2">`: Container for confirm password input field
  - `<Label>`: "Confirm password" label
  - `<Input>`: Confirm password input field with `type="password"`, `autoComplete="new-password"`
  - `<p>`: Error message for confirm password field
  - `<div className="flex items-start gap-2">`: Container for terms checkbox
  - `<input type="checkbox">`: Terms acceptance checkbox
  - `<Label>`: Terms acceptance label with clickable text
  - `<p>`: Error message for terms checkbox
  - `<Button>`: Submit button with loading state ("Creating account..." / "Create account")
  - `<div className="text-center text-sm">`: Container for navigation link
  - `<a>`: Link to login page ("Already have an account? Log in")

- **Handled interactions**:
  - Form submission (`onSubmit`): Validates form data, calls Supabase `auth.signUp()`, handles success/error states
  - Field blur events: Triggers validation via React Hook Form's `mode: "onBlur"`
  - Checkbox change: Updates form state for terms acceptance
  - Link click: Navigates to `/auth/login`

- **Handled validation**:
  - **Email field**:
    - Required: Email cannot be empty (validated by `emailSchema.min(1)`)
    - Format: Must be a valid email address (validated by `emailSchema.email()`)
    - Validation triggers on blur
  - **Password field**:
    - Required: Password cannot be empty (validated by `passwordSchema`)
    - Minimum length: At least 8 characters (validated by `passwordSchema.min(8)`)
    - Complexity: Must contain at least one letter and one number (validated by `passwordSchema.refine()`)
    - Validation triggers on blur
  - **Confirm Password field**:
    - Required: Confirm password cannot be empty (validated by `confirmPassword.min(1)`)
    - Match: Must match the password field exactly (validated by `registerSchema.refine()`)
    - Validation triggers on blur and form submission
  - **Terms Checkbox**:
    - Required: Must be checked (validated by `termsAccepted: z.literal(true)`)
    - Validation triggers on form submission
  - **Form-level validation**:
    - Password match validation runs on form submission
    - All field validations must pass before submission

- **Types**:
  - `RegisterInput`: Type inferred from `registerSchema` (from `@/lib/validation/auth.schemas`)
    - `email: string`
    - `password: string`
    - `confirmPassword: string`
    - `termsAccepted: true` (literal type)
  - `Props`: Component props interface
    - `className?: string` (optional)

- **Props**:
  - `className?: string`: Optional CSS class name for styling the form container

### register.astro (Astro Page)

- **Component description**: Server-side Astro page that renders the Register view. It checks for existing authentication and redirects authenticated users to the dashboard. It uses the Public Layout and renders the RegisterForm React component.

- **Main elements**:
  - Server-side authentication check using Supabase server client
  - Conditional redirect to `/app/dashboard` if user is authenticated
  - `<Layout>`: Public layout wrapper
  - `<main>`: Main content container with centered layout
  - `<section>`: Card container for the form
  - `<header>`: Page header with title and subtitle
  - `<RegisterForm>`: React component with `client:load` directive

- **Handled interactions**: None (server-side only)

- **Handled validation**: None (validation handled by React component)

- **Types**: None (Astro template)

- **Props**: None

## 5. Types

### RegisterInput

Type inferred from `registerSchema` in `src/lib/validation/auth.schemas.ts`:

```typescript
type RegisterInput = {
  email: string;
  password: string;
  confirmPassword: string;
  termsAccepted: true; // Literal type, must be exactly true
}
```

**Field Details**:
- `email: string`: User's email address. Must be a valid email format and non-empty.
- `password: string`: User's password. Must be at least 8 characters and contain both letters and numbers.
- `confirmPassword: string`: Confirmation of the password. Must match the `password` field exactly.
- `termsAccepted: true`: Boolean literal that must be `true`. Represents acceptance of terms and conditions.

### RegisterForm Props

```typescript
interface Props {
  className?: string;
}
```

**Field Details**:
- `className?: string`: Optional CSS class name to apply custom styling to the form container. Used for layout adjustments or theme customization.

### Supabase Auth Response Types

The component uses Supabase Auth types from `@supabase/supabase-js`:

- `AuthResponse`: Return type from `supabase.auth.signUp()`
  - `data: { user: User | null, session: Session | null }`
  - `error: AuthError | null`

## 6. State Management

State is managed locally within the `RegisterForm` React component using React Hook Form and React's `useState`:

### React Hook Form State

Managed by `useForm<RegisterInput>` hook:

- **Form values**: `email`, `password`, `confirmPassword`, `termsAccepted`
- **Form errors**: Field-level errors and root-level errors
- **Form state**: `isSubmitting`, `isValid`, `isDirty`
- **Validation mode**: `onBlur` (validates fields when they lose focus)

### Local React State

- `success: string | null`: Stores success message when account is created but email confirmation is required. Initialized as `null`.

### State Flow

1. **Initial state**: All form fields are empty, `termsAccepted` is `false`, `success` is `null`
2. **User input**: Form values update via React Hook Form's `register()` method
3. **Validation**: Errors are set automatically by React Hook Form when validation fails (on blur)
4. **Submission**: `isSubmitting` becomes `true`, form is disabled
5. **Success path**: If email confirmation is required, `success` is set to a message string. If auto-login, user is redirected.
6. **Error path**: Root error is set via `form.setError("root", ...)`, `isSubmitting` becomes `false`

### No Custom Hooks Required

The component does not require custom hooks. All state management is handled by:
- React Hook Form for form state
- React `useState` for success message
- Supabase client for authentication (no state management needed)

## 7. API Integration

The Register view does not use a custom REST API endpoint. Instead, it integrates directly with Supabase Auth (Backend-as-a-Service) using the Supabase client SDK.

### Supabase Auth Integration

**Method**: `supabase.auth.signUp()`

**Request**:
```typescript
await supabase.auth.signUp({
  email: string,
  password: string
})
```

**Response Types**:
- **Success (with session)**: `{ data: { user: User, session: Session }, error: null }`
  - User is automatically logged in
  - Redirect to `/app/dashboard`
- **Success (no session)**: `{ data: { user: User, session: null }, error: null }`
  - Email confirmation required
  - Display success message asking user to check email
- **Error**: `{ data: { user: null, session: null }, error: AuthError }`
  - Handle specific error cases:
    - Email already exists: "An account with this email already exists."
    - Password requirements: "Password does not meet security requirements."
    - Generic error: "Unable to register right now. Please try again later."

### Client Configuration

The Supabase client is imported from `@/db/supabase.client`:

```typescript
import { supabaseClient as supabase } from "@/db/supabase.client";
```

The client is configured with:
- `PUBLIC_SUPABASE_URL`: Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

### No Custom API Endpoint

According to the API plan, registration is handled by Supabase's built-in authentication (BaaS approach), not by a custom API endpoint. The frontend communicates directly with Supabase Auth.

## 8. User Interactions

### 8.1. Form Field Input

**Interaction**: User types in email, password, or confirm password fields

**Expected Outcome**:
- Field value updates in real-time
- Validation runs when field loses focus (on blur)
- Error messages appear below fields if validation fails
- Helper text may appear (e.g., password requirements)

**Implementation**: Handled by React Hook Form's `register()` method and `mode: "onBlur"` configuration

### 8.2. Terms Checkbox Toggle

**Interaction**: User clicks the terms acceptance checkbox

**Expected Outcome**:
- Checkbox state toggles between checked and unchecked
- If unchecked and form is submitted, validation error appears: "You must accept the terms to continue."

**Implementation**: Handled by React Hook Form's `register("termsAccepted")` with `z.literal(true)` validation

### 8.3. Form Submission (Happy Path)

**Interaction**: User fills all fields correctly, checks terms, and clicks "Create account"

**Expected Outcome**:
1. Button shows loading state: "Creating account..."
2. Form is disabled during submission
3. Supabase `auth.signUp()` is called
4. If email confirmation is disabled:
   - User is automatically logged in
   - Full page reload to `/app/dashboard` (ensures cookies are synced)
5. If email confirmation is required:
   - Success message appears: "Account created! Please check your email to confirm your account before signing in."
   - Form remains visible (user can navigate to login)

**Implementation**: `onSubmit` handler calls `form.handleSubmit(async (data) => { ... })`

### 8.4. Form Submission (Error: Email Already Exists)

**Interaction**: User submits form with an email that already has an account

**Expected Outcome**:
1. Button shows loading state, then returns to normal
2. Error alert appears at top of form: "Unable to register" with message "An account with this email already exists."
3. Form remains editable, user can correct email or navigate to login

**Implementation**: Error handling in `onSubmit` checks `error.message` for "already registered" or "already exists"

### 8.5. Form Submission (Error: Password Requirements)

**Interaction**: User submits form with a password that doesn't meet Supabase's security requirements

**Expected Outcome**:
1. Button shows loading state, then returns to normal
2. Error alert appears: "Password does not meet security requirements."
3. Form remains editable

**Implementation**: Error handling checks for "Password" or "password" in error message

### 8.6. Form Submission (Error: Generic)

**Interaction**: User submits form but Supabase returns an unexpected error

**Expected Outcome**:
1. Button shows loading state, then returns to normal
2. Error alert appears: "Unable to register right now. Please try again later."
3. Form remains editable

**Implementation**: Generic error handler in `onSubmit`

### 8.7. Navigation to Login

**Interaction**: User clicks "Already have an account? Log in" link

**Expected Outcome**:
- User is navigated to `/auth/login` page
- Current form state is lost (expected behavior for public auth pages)

**Implementation**: Standard HTML `<a>` tag with `href="/auth/login"`

### 8.8. Field Validation on Blur

**Interaction**: User clicks into a field, enters data, then clicks away (blur event)

**Expected Outcome**:
- Validation runs for that specific field
- If validation fails, error message appears below the field
- If validation passes, any existing error message is cleared
- Form submission is still blocked if other fields are invalid

**Implementation**: React Hook Form's `mode: "onBlur"` configuration

## 9. Conditions and Validation

### 9.1. Client-Side Validation Conditions

All validation is performed client-side using Zod schemas before form submission:

#### Email Field Validation

**Condition**: Email must be valid and non-empty

**Validation Rules**:
- Field cannot be empty (`.min(1, "Email is required.")`)
- Must be valid email format (`.email("Please enter a valid email address.")`)

**Component**: `RegisterForm` email input field

**Interface Impact**:
- If invalid: Red border on input, error message displayed below field
- If valid: Normal border, no error message
- Validation triggers on blur

#### Password Field Validation

**Condition**: Password must meet security requirements

**Validation Rules**:
- Minimum 8 characters (`.min(8, ...)`)
- Must contain at least one letter (`.refine((val) => /[A-Za-z]/.test(val), ...)`)
- Must contain at least one number (`.refine((val) => /\d/.test(val), ...)`)

**Component**: `RegisterForm` password input field

**Interface Impact**:
- If invalid: Red border, error message: "Password must be at least 8 characters and include letters and numbers."
- If valid: Normal border, helper text: "At least 8 characters with letters and numbers."
- Validation triggers on blur

#### Confirm Password Field Validation

**Condition**: Confirm password must match password

**Validation Rules**:
- Field cannot be empty (`.min(1, "Please confirm your password.")`)
- Must exactly match `password` field (`.refine((data) => data.password === data.confirmPassword, ...)`)

**Component**: `RegisterForm` confirm password input field

**Interface Impact**:
- If invalid: Red border, error message: "Passwords do not match." or "Please confirm your password."
- If valid: Normal border, no error message
- Validation triggers on blur and form submission

#### Terms Acceptance Validation

**Condition**: Terms checkbox must be checked

**Validation Rules**:
- Must be exactly `true` (`.literal(true, ...)`)

**Component**: `RegisterForm` terms checkbox

**Interface Impact**:
- If unchecked: Error message appears: "You must accept the terms to continue."
- If checked: No error message
- Validation triggers on form submission (not on blur)

### 9.2. Form Submission Conditions

**Condition**: All fields must pass validation before submission

**Validation Rules**:
- All individual field validations must pass
- Password match validation must pass
- Terms must be accepted

**Component**: `RegisterForm` submit button

**Interface Impact**:
- If any validation fails: Form submission is blocked, React Hook Form prevents `onSubmit` from being called
- If all validations pass: Form submission proceeds, button shows loading state

### 9.3. Server-Side Validation (Supabase)

**Condition**: Supabase may enforce additional password requirements beyond client-side validation

**Validation Rules**: Supabase's built-in password policy (may vary by project configuration)

**Component**: `RegisterForm` error handling

**Interface Impact**:
- If Supabase rejects password: Error alert appears with message about password requirements
- This is a fallback for cases where client-side validation passes but server rejects

### 9.4. Authentication State Condition

**Condition**: If user is already authenticated, redirect to dashboard

**Validation Rules**: Check `supabase.auth.getUser()` on page load

**Component**: `register.astro` server-side code

**Interface Impact**:
- If authenticated: User never sees the registration form, immediately redirected to `/app/dashboard`
- If not authenticated: Registration form is displayed

## 10. Error Handling

### 10.1. Validation Errors

**Scenario**: User enters invalid data in form fields

**Handling**:
- Errors are displayed inline below each field
- Error messages are user-friendly and specific
- Form submission is prevented until all errors are resolved
- Errors clear automatically when field becomes valid

**Implementation**: React Hook Form automatically manages validation errors via Zod resolver

**User Experience**: Clear, immediate feedback without requiring form submission

### 10.2. Email Already Exists Error

**Scenario**: User tries to register with an email that already has an account

**Handling**:
- Error is caught in `onSubmit` handler
- Specific error message: "An account with this email already exists."
- Error is displayed in root-level Alert component at top of form
- Form remains editable, user can correct email or navigate to login

**Implementation**: Check `error.message` for "already registered" or "already exists" strings

**User Experience**: Clear error message guides user to either use a different email or log in with existing account

### 10.3. Password Requirements Error

**Scenario**: Password doesn't meet Supabase's server-side requirements (even if client-side validation passed)

**Handling**:
- Error is caught in `onSubmit` handler
- Specific error message: "Password does not meet security requirements."
- Error is displayed in root-level Alert component
- Form remains editable

**Implementation**: Check `error.message` for "Password" or "password" strings

**User Experience**: User is informed that password needs to be stronger, can update and retry

### 10.4. Generic Registration Error

**Scenario**: Unexpected error from Supabase (network issues, server errors, etc.)

**Handling**:
- Error is caught in generic error handler
- Generic error message: "Unable to register right now. Please try again later."
- Error is displayed in root-level Alert component
- Form remains editable

**Implementation**: Fallback error handler in `onSubmit`

**User Experience**: User is informed of temporary issue, can retry later

### 10.5. Email Confirmation Required

**Scenario**: Account is created but email confirmation is enabled in Supabase

**Handling**:
- Success message is displayed: "Account created! Please check your email to confirm your account before signing in."
- Success Alert is shown (green styling)
- Form remains visible (user hasn't been logged in yet)
- User can navigate to login page after confirming email

**Implementation**: Check `signUpData.session === null` to detect email confirmation requirement

**User Experience**: Clear instructions on next steps (check email, then log in)

### 10.6. Network Errors

**Scenario**: Network request fails (no internet, timeout, etc.)

**Handling**:
- Supabase client will return an error
- Error is caught by generic error handler
- Generic error message is displayed
- User can retry when network is available

**Implementation**: Handled by Supabase client error handling

**User Experience**: User is informed of issue, can retry when connectivity is restored

### 10.7. Supabase Client Initialization Error

**Scenario**: Supabase client fails to initialize (missing environment variables)

**Handling**:
- Error is thrown at module import time (in `supabase.client.ts`)
- Application will fail to load (expected behavior)
- Error message: "PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY must be set as environment variables."

**Implementation**: Environment variable checks in `src/db/supabase.client.ts`

**User Experience**: Developer error (should not occur in production with proper configuration)

### 10.8. Error Message Display Priority

**Priority Order**:
1. Root-level error (from Supabase) - displayed in Alert at top
2. Success message (if email confirmation required) - displayed in green Alert
3. Field-level errors - displayed below each field

**Implementation**: Conditional rendering based on `form.formState.errors.root` and `success` state

**User Experience**: Most important errors (root) are most visible, field errors provide specific guidance

## 11. Implementation Steps

1. **Create Validation Schema** (if not already exists)
   - Ensure `registerSchema` exists in `src/lib/validation/auth.schemas.ts`
   - Schema should validate: email format, password strength (8+ chars, letters + numbers), password match, terms acceptance (literal true)
   - Export `RegisterInput` type from schema

2. **Create RegisterForm React Component**
   - Create `src/components/auth/RegisterForm.tsx`
   - Import required dependencies: React, React Hook Form, Zod resolver, UI components (Input, Label, Button, Alert), validation schema, Supabase client
   - Set up React Hook Form with `useForm<RegisterInput>()`:
     - Configure `resolver: zodResolver(registerSchema)`
     - Set `mode: "onBlur"` for validation timing
     - Set default values: empty strings for text fields, `false` for checkbox (cast to satisfy literal type)
   - Create `onSubmit` handler:
     - Clear previous errors and success messages
     - Call `supabase.auth.signUp()` with email and password
     - Handle error cases (email exists, password requirements, generic)
     - Handle success cases (auto-login vs email confirmation)
   - Implement form JSX:
     - Root-level error Alert (conditionally rendered)
     - Success Alert (conditionally rendered)
     - Email input field with label, error message, ARIA attributes
     - Password input field with label, error message/helper text, ARIA attributes
     - Confirm password input field with label, error message, ARIA attributes
     - Terms checkbox with label and error message
     - Submit button with loading state
     - Navigation link to login page
   - Add unique IDs using `React.useId()` for accessibility
   - Add proper ARIA attributes (`aria-invalid`, `aria-describedby`)

3. **Create register.astro Page**
   - Create `src/pages/auth/register.astro`
   - Import Layout component and RegisterForm
   - Import Supabase server client
   - Add server-side authentication check:
     - Create Supabase client from cookies
     - Call `supabase.auth.getUser()`
     - If user exists, redirect to `/app/dashboard`
     - Handle errors gracefully (continue to show form if client creation fails)
   - Set page title: "Create account – Diet Planner"
   - Render Layout with title prop
   - Render centered main content with card container
   - Add page header with title and subtitle
   - Render RegisterForm with `client:load` directive

4. **Test Client-Side Validation**
   - Test email validation: empty, invalid format, valid format
   - Test password validation: too short, no letters, no numbers, valid password
   - Test password match: mismatched passwords, matching passwords
   - Test terms checkbox: unchecked submission, checked submission
   - Verify error messages appear correctly
   - Verify validation triggers on blur

5. **Test Registration Flow (Happy Path)**
   - Test successful registration with email confirmation disabled:
     - Fill form correctly
     - Submit form
     - Verify redirect to `/app/dashboard`
     - Verify user is logged in
   - Test successful registration with email confirmation enabled:
     - Fill form correctly
     - Submit form
     - Verify success message appears
     - Verify no redirect occurs

6. **Test Error Handling**
   - Test email already exists error:
     - Try to register with existing email
     - Verify specific error message appears
   - Test password requirements error:
     - Use password that passes client validation but fails server validation (if applicable)
     - Verify error message appears
   - Test generic error handling:
     - Simulate network error or server error
     - Verify generic error message appears

7. **Test Accessibility**
   - Verify all form fields have proper labels
   - Verify error messages are associated with fields via `aria-describedby`
   - Verify `aria-invalid` is set correctly
   - Test keyboard navigation (Tab through fields, Enter to submit)
   - Test screen reader compatibility

8. **Test Responsive Design**
   - Verify form layout works on mobile devices
   - Verify form is centered and readable on all screen sizes
   - Test form on different viewport widths

9. **Test Navigation**
   - Verify "Already have an account? Log in" link navigates to `/auth/login`
   - Verify authenticated users are redirected from register page
   - Test navigation from login page to register page

10. **Integration Testing**
    - Test full user journey: Register → Dashboard
    - Test error recovery: Failed registration → Correct error → Successful registration
    - Test edge cases: Very long email, special characters in password, etc.

