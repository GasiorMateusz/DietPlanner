# Implementation Plan: Account Removal

## 1. Overview

The Account Removal feature allows authenticated users to permanently delete their account from the Diet Planner application. The feature implements user story US-004 (Account management) and provides a secure, confirmation-based account deletion flow accessible from the navigation bar. When a user deletes their account, all associated meal plans are permanently removed, but conversation history (AI chat sessions) is preserved for analytical purposes. After successful deletion, the user is automatically signed out and redirected to the home page.

## 2. Feature Scope

- **User Story**: US-004 (Account management - Delete account)
- **Access Point**: Navigation bar (NavBar component)
- **Deletion Scope**:
  - User account (Supabase Auth user)
  - All meal plans associated with the user (`meal_plans` table)
  - **Preserved**: AI chat sessions (`ai_chat_sessions` table) - conversation history is kept for analytics
- **Confirmation**: Required via confirmation dialog before deletion
- **Post-Deletion**: User is automatically signed out and redirected to home page

## 3. Component Structure

```
NavBar (React Component)
└── Delete Account Button (in user menu)
    └── DeleteAccountConfirmationDialog (React Component)
        ├── Dialog (Shadcn/ui Dialog)
        ├── DialogHeader
        │   ├── DialogTitle ("Delete Account")
        │   └── DialogDescription (Warning message)
        ├── Alert (Destructive variant - Warning message)
        └── DialogFooter
            ├── Button (Cancel)
            └── Button (Delete - Destructive variant)
```

## 4. Component Details

### DeleteAccountConfirmationDialog (React Component)

- **Component description**: A confirmation dialog component that warns users about the permanent nature of account deletion. It displays a clear warning message explaining that all meal plans will be deleted, but conversation history will be preserved. The dialog requires explicit confirmation before proceeding with account deletion.

- **Main elements**:
  - `<Dialog>`: Shadcn/ui Dialog component with `open` and `onOpenChange` props
  - `<DialogContent>`: Container for dialog content
  - `<DialogHeader>`: Header section containing title and description
  - `<DialogTitle>`: "Delete Account" title
  - `<DialogDescription>`: Warning message explaining the consequences of deletion
  - `<Alert variant="destructive">`: Additional warning alert emphasizing the irreversible nature
  - `<DialogFooter>`: Footer section with action buttons
  - `<Button variant="outline">`: Cancel button that closes the dialog
  - `<Button variant="destructive">`: Delete button that triggers account deletion

- **Handled interactions**:
  - Dialog open/close: Controlled by `open` prop
  - Cancel button click: Calls `onClose` callback
  - Delete button click: Calls `onConfirm` callback
  - Dialog overlay click: Closes dialog (via `onOpenChange`)
  - Escape key: Closes dialog (default Dialog behavior)

- **Handled validation**:
  - Prevents confirmation if deletion is in progress (`isDeleting` prop)
  - Disables buttons during deletion process

- **Types**:
  ```typescript
  interface DeleteAccountConfirmationDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isDeleting?: boolean;
  }
  ```

- **Props**:
  - `open: boolean`: Controls dialog visibility
  - `onClose: () => void`: Callback when dialog should close (cancel or overlay click)
  - `onConfirm: () => void`: Callback when user confirms deletion
  - `isDeleting?: boolean`: Optional loading state flag to disable buttons during deletion

### NavBar (React Component - Extended)

- **Component description**: The existing navigation bar component is extended to include a "Delete Account" option in the user menu. The option is only visible when a user is authenticated. Clicking the option opens the DeleteAccountConfirmationDialog.

- **New elements** (added to existing NavBar):
  - `<Button variant="ghost" variant="destructive">`: "Delete Account" button in user menu (only visible when authenticated)
  - State: `isDeleteDialogOpen: boolean` - Controls dialog visibility
  - State: `isDeletingAccount: boolean` - Tracks deletion in progress
  - State: `deleteError: string | null` - Stores error message if deletion fails
  - `<DeleteAccountConfirmationDialog>`: Confirmation dialog component

- **Handled interactions**:
  - Delete Account button click: Opens confirmation dialog (`setIsDeleteDialogOpen(true)`)
  - Dialog confirmation: Calls `handleDeleteAccount` function
  - Dialog cancel: Closes dialog (`setIsDeleteDialogOpen(false)`)

- **Existing elements** (unchanged):
  - Logo/Brand link
  - User email display
  - Logout button
  - Authentication state management

## 5. Types

### DeleteAccountConfirmationDialogProps

```typescript
interface DeleteAccountConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}
```

**Field Details**:
- `open: boolean`: Controls whether the dialog is visible. When `true`, the dialog is displayed.
- `onClose: () => void`: Callback function called when the dialog should be closed (cancel button, overlay click, or escape key).
- `onConfirm: () => void`: Callback function called when the user confirms account deletion by clicking the "Delete" button.
- `isDeleting?: boolean`: Optional flag indicating that account deletion is in progress. When `true`, buttons are disabled and the delete button shows "Deleting..." text.

### NavBar Extended State

```typescript
// New state added to NavBar component
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);
const [deleteError, setDeleteError] = useState<string | null>(null);
```

## 6. State Management

State is managed locally within the `NavBar` React component using React's `useState`:

### Local React State

- `isDeleteDialogOpen: boolean`: Controls visibility of the DeleteAccountConfirmationDialog. Initialized as `false`.
- `isDeletingAccount: boolean`: Tracks whether account deletion is in progress. Initialized as `false`. Used to disable buttons and show loading state.
- `deleteError: string | null`: Stores error message if account deletion fails. Initialized as `null`. Displayed in an Alert component if present.

### State Flow

1. **Initial state**: Dialog is closed (`isDeleteDialogOpen = false`), deletion not in progress (`isDeletingAccount = false`), no errors (`deleteError = null`)
2. **User clicks "Delete Account"**: `isDeleteDialogOpen` is set to `true`, dialog opens
3. **User confirms deletion**: `isDeletingAccount` is set to `true`, dialog buttons are disabled
4. **API call in progress**: Loading state is active
5. **Success path**: 
   - API returns 204 No Content
   - User is signed out via `supabase.auth.signOut()`
   - Redirect to home page (`/`)
   - Dialog closes automatically (component unmounts)
6. **Error path**: 
   - `isDeletingAccount` is set to `false`
   - `deleteError` is set to error message
   - Error Alert is displayed
   - Dialog remains open, user can retry or cancel
7. **User cancels**: `isDeleteDialogOpen` is set to `false`, dialog closes, error state is cleared

### No Custom Hooks Required

The component does not require custom hooks. All state management is handled by:
- React `useState` for dialog state, loading state, and error state
- Supabase client for authentication and sign-out
- Fetch API for account deletion request

## 7. API Integration

The Account Removal feature uses a custom REST API endpoint to handle account deletion on the server.

### API Endpoint

**Method**: `DELETE /api/account`

**Request**:
- **Headers**:
  - `Authorization: Bearer <SUPABASE_JWT>` (required)
  - `Content-Type: application/json`
- **Body**: None (no request payload)

**Response Types**:
- **Success (204 No Content)**: Account and associated data successfully deleted
  - Empty response body
  - User should be signed out and redirected
- **Error (401 Unauthorized)**: User is not authenticated
  - Response: `{ error: "Unauthorized" }`
  - Redirect to `/auth/login`
- **Error (500 Internal Server Error)**: Server error during deletion
  - Response: `{ error: string, details?: unknown }`
  - Display error message to user

### Client Implementation

The client makes the API request from the `NavBar` component:

```typescript
const handleDeleteAccount = async () => {
  setIsDeletingAccount(true);
  setDeleteError(null);

  try {
    const token = await getAuthToken();
    if (!token) {
      window.location.href = "/auth/login";
      return;
    }

    const response = await fetch("/api/account", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      window.location.href = "/auth/login";
      return;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Failed to delete account",
      }));
      throw new Error(errorData.error || "Failed to delete account");
    }

    // Success: Sign out and redirect
    await supabase.auth.signOut();
    window.location.href = "/";
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An error occurred. Please try again.";
    setDeleteError(errorMessage);
    console.error("Error deleting account:", err);
  } finally {
    setIsDeletingAccount(false);
  }
};
```

### Client Configuration

The authentication token is obtained using the existing helper:

```typescript
import { getAuthToken } from "@/lib/auth/get-auth-token";
```

The Supabase client is imported from:

```typescript
import { supabaseClient as supabase } from "@/db/supabase.client";
```

## 8. Backend Implementation

### API Endpoint: `DELETE /api/account`

**File**: `src/pages/api/account/index.ts`

**Description**: Permanently deletes the authenticated user's account and all associated meal plans. AI chat sessions are preserved for analytical purposes.

**Implementation Steps**:

1. **Extract user from request**:
   - Read `Authorization` header
   - Validate JWT token using Supabase
   - Extract `userId` from authenticated user
   - Return 401 if authentication fails

2. **Delete user-owned data**:
   - Delete all meal plans where `user_id = userId` from `meal_plans` table
   - **Preserve** `ai_chat_sessions` records (do not delete)
   - Handle database errors gracefully

3. **Delete auth user**:
   - Use Supabase Admin client (service role key) to delete user from `auth.users`
   - This requires `SUPABASE_SERVICE_ROLE_KEY` environment variable
   - Handle errors if deletion fails

4. **Return response**:
   - Success: `204 No Content` (empty response)
   - Error: Appropriate HTTP status code with error message

**Error Handling**:
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Database error or Supabase Admin API error
- Log errors for debugging but return user-friendly messages

**Dependencies**:
- `src/lib/auth/session.service.ts`: Helper to extract user from request
- `src/db/supabase.admin.ts`: Admin client for deleting auth user
- `src/lib/errors.ts`: Custom error classes (ValidationError, DatabaseError, etc.)

### Service Layer (Optional)

If a service layer pattern is used, create:

**File**: `src/lib/account/account.service.ts`

```typescript
export async function deleteUserAccount(
  userId: string,
  supabase: SupabaseClient<Database>,
  adminSupabase: SupabaseClient<Database>
): Promise<void> {
  // 1. Delete meal plans
  // 2. Preserve ai_chat_sessions (no action needed)
  // 3. Delete auth user via admin client
}
```

## 9. User Interactions

### 9.1. Open Delete Account Dialog

**Interaction**: User clicks "Delete Account" button in navigation bar

**Expected Outcome**:
- DeleteAccountConfirmationDialog opens
- Warning message is displayed
- Cancel and Delete buttons are visible and enabled

**Implementation**: `setIsDeleteDialogOpen(true)` in NavBar component

### 9.2. Cancel Account Deletion

**Interaction**: User clicks "Cancel" button or clicks outside the dialog

**Expected Outcome**:
- Dialog closes
- No account deletion occurs
- User remains authenticated and on current page

**Implementation**: `setIsDeleteDialogOpen(false)` in NavBar component

### 9.3. Confirm Account Deletion (Happy Path)

**Interaction**: User clicks "Delete" button in confirmation dialog

**Expected Outcome**:
1. Delete button shows "Deleting..." and is disabled
2. Cancel button is disabled
3. API request is sent to `DELETE /api/account`
4. On success:
   - User is automatically signed out
   - User is redirected to home page (`/`)
   - Dialog closes (component unmounts)

**Implementation**: `handleDeleteAccount` function in NavBar component

### 9.4. Account Deletion Error (Network/Server Error)

**Interaction**: User confirms deletion but API request fails

**Expected Outcome**:
1. Delete button returns to "Delete" state
2. Cancel button is re-enabled
3. Error Alert appears in dialog with error message
4. User can retry or cancel
5. User remains authenticated

**Implementation**: Error handling in `handleDeleteAccount` function

### 9.5. Account Deletion Error (Unauthorized)

**Interaction**: User's session expires during deletion

**Expected Outcome**:
- User is automatically redirected to `/auth/login`
- Dialog closes
- No error message needed (redirect handles it)

**Implementation**: 401 status check in `handleDeleteAccount` function

## 10. Conditions and Validation

### 10.1. Authentication Requirement

**Condition**: User must be authenticated to see "Delete Account" option

**Validation Rules**:
- "Delete Account" button is only visible when `userEmail` is truthy
- If user is not authenticated, button is hidden

**Component**: NavBar component conditional rendering

**Interface Impact**:
- If authenticated: "Delete Account" button is visible in user menu
- If not authenticated: Button is hidden (only "Log in" button is shown)

### 10.2. Confirmation Requirement

**Condition**: User must explicitly confirm account deletion

**Validation Rules**:
- Dialog must be opened before deletion can proceed
- User must click "Delete" button (not just close dialog)
- Deletion cannot proceed if `isDeletingAccount` is `true` (prevents double-submission)

**Component**: DeleteAccountConfirmationDialog

**Interface Impact**:
- Deletion is blocked until user explicitly confirms
- Accidental clicks on "Delete Account" button do not immediately delete account

### 10.3. Loading State During Deletion

**Condition**: Buttons must be disabled during deletion process

**Validation Rules**:
- `isDeletingAccount` must be `true` during API request
- Delete button shows "Deleting..." text when `isDeletingAccount` is `true`
- Cancel button is disabled when `isDeletingAccount` is `true`

**Component**: DeleteAccountConfirmationDialog and NavBar

**Interface Impact**:
- Prevents multiple deletion requests
- Provides visual feedback that deletion is in progress

### 10.4. Error State Display

**Condition**: Errors must be displayed to user if deletion fails

**Validation Rules**:
- `deleteError` state is set when API request fails
- Error Alert is displayed in dialog when `deleteError` is not null
- Error message is user-friendly and actionable

**Component**: DeleteAccountConfirmationDialog (Alert component)

**Interface Impact**:
- User is informed of failure reason
- User can retry or cancel based on error message

## 11. Error Handling

### 11.1. Network Errors

**Scenario**: Network request fails (no internet, timeout, etc.)

**Handling**:
- Error is caught in `handleDeleteAccount` try-catch block
- Generic error message: "Unable to delete account. Please check your connection and try again."
- Error is displayed in Alert component in dialog
- User can retry when network is available

**Implementation**: Catch block in `handleDeleteAccount` function

**User Experience**: Clear error message guides user to check connectivity and retry

### 11.2. Unauthorized Error (401)

**Scenario**: User's session expires or token is invalid

**Handling**:
- 401 status is detected in response check
- User is automatically redirected to `/auth/login`
- Dialog closes (component unmounts)
- No error message needed (redirect handles authentication)

**Implementation**: Status check in `handleDeleteAccount` function

**User Experience**: Seamless redirect to login page, user can log in again if needed

### 11.3. Server Error (500)

**Scenario**: Server error during account deletion (database error, Supabase Admin API error)

**Handling**:
- Error response is parsed from API
- Error message from server is displayed: "Failed to delete account. Please try again later."
- Error is logged to console for debugging
- User can retry or cancel

**Implementation**: Error response parsing in `handleDeleteAccount` function

**User Experience**: User is informed of server issue, can retry or contact support

### 11.4. Missing Authentication Token

**Scenario**: `getAuthToken()` returns `null`

**Handling**:
- User is redirected to `/auth/login` immediately
- No API request is made
- Dialog can remain open (user will be redirected)

**Implementation**: Token check at start of `handleDeleteAccount` function

**User Experience**: Immediate redirect to login, no confusing error messages

### 11.5. Supabase Sign-Out Error

**Scenario**: Account deletion succeeds but `supabase.auth.signOut()` fails

**Handling**:
- Error is caught but not displayed (deletion already succeeded)
- Redirect to home page still occurs
- Error is logged to console for debugging
- User will be effectively signed out by redirect (session may persist but user data is deleted)

**Implementation**: Try-catch around `supabase.auth.signOut()` call

**User Experience**: User is redirected successfully, may need to manually clear session if sign-out fails

### 11.6. Error Message Display Priority

**Priority Order**:
1. Network/Server errors - displayed in Alert component in dialog
2. Loading state - buttons show "Deleting..." text
3. Success - automatic sign-out and redirect (no message needed)

**Implementation**: Conditional rendering based on `deleteError` and `isDeletingAccount` states

**User Experience**: Most important errors (deletion failure) are most visible, success is handled by redirect

## 12. Security Considerations

### 12.1. Authentication Verification

- All account deletion requests must include valid `Authorization: Bearer <JWT>` header
- Server validates JWT token before processing deletion
- Only the authenticated user can delete their own account (enforced by server)

### 12.2. Confirmation Requirement

- Account deletion requires explicit user confirmation via dialog
- Prevents accidental deletions from misclicks
- Clear warning message explains consequences

### 12.3. Data Preservation

- AI chat sessions are preserved (not deleted) for analytical purposes
- This aligns with telemetry requirements (PRD 3.5)
- User's meal plans are deleted as expected

### 12.4. Admin Client Security

- Supabase Admin client uses `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- Service role key is never exposed to client
- Admin client is only used in server-side API routes

### 12.5. Error Message Security

- Error messages do not expose sensitive information (database structure, user IDs, etc.)
- Generic error messages prevent information leakage
- Detailed errors are logged server-side for debugging

## 13. Implementation Steps

1. **Create DeleteAccountConfirmationDialog Component**
   - Create `src/components/auth/DeleteAccountConfirmationDialog.tsx`
   - Import required dependencies: React, Dialog components from shadcn/ui, Button, Alert
   - Implement dialog with warning message
   - Add props: `open`, `onClose`, `onConfirm`, `isDeleting`
   - Add error Alert display (if error prop is added)
   - Add proper ARIA attributes for accessibility
   - Test dialog open/close functionality

2. **Extend NavBar Component**
   - Open `src/components/NavBar.tsx`
   - Add state: `isDeleteDialogOpen`, `isDeletingAccount`, `deleteError`
   - Add "Delete Account" button in user menu (only visible when authenticated)
   - Import and render `DeleteAccountConfirmationDialog`
   - Implement `handleDeleteAccount` function:
     - Get auth token
     - Make DELETE request to `/api/account`
     - Handle success (sign out, redirect)
     - Handle errors (display error message)
   - Add error Alert in dialog (if needed)
   - Test button visibility and dialog opening

3. **Create API Endpoint**
   - Create `src/pages/api/account/index.ts`
   - Import required dependencies: APIRoute, session service, Supabase clients, error classes
   - Implement `DELETE` handler:
     - Extract user from request using session service
     - Delete meal plans for user (SQL: `DELETE FROM meal_plans WHERE user_id = $1`)
     - **Preserve** ai_chat_sessions (no deletion)
     - Delete auth user using Supabase Admin client
     - Return 204 No Content on success
     - Handle errors (401, 500) with appropriate responses
   - Add error logging for debugging
   - Test endpoint with authenticated and unauthenticated requests

4. **Create/Update Service Layer (if applicable)**
   - Create `src/lib/account/account.service.ts` (if service layer pattern is used)
   - Implement `deleteUserAccount` function:
     - Accept `userId`, `supabase` client, `adminSupabase` client
     - Delete meal plans
     - Delete auth user
     - Handle errors and throw appropriate error classes
   - Update API endpoint to use service function

5. **Update Supabase Admin Client (if not exists)**
   - Check if `src/db/supabase.admin.ts` exists
   - If not, create it:
     - Import `createClient` from `@supabase/supabase-js`
     - Use `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables
     - Export admin client
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in environment variables

6. **Test Account Deletion Flow (Happy Path)**
   - Log in as test user
   - Create some meal plans
   - Click "Delete Account" in nav bar
   - Verify dialog opens with warning message
   - Click "Delete" button
   - Verify loading state ("Deleting..." text)
   - Verify redirect to home page
   - Verify user is signed out
   - Verify meal plans are deleted from database
   - Verify ai_chat_sessions are preserved in database
   - Verify auth user is deleted from Supabase

7. **Test Error Handling**
   - Test network error:
     - Disconnect network
     - Attempt account deletion
     - Verify error message appears
     - Verify user can retry or cancel
   - Test unauthorized error:
     - Expire session (or use invalid token)
     - Attempt account deletion
     - Verify redirect to login page
   - Test server error:
     - Simulate database error (if possible)
     - Attempt account deletion
     - Verify error message appears

8. **Test Authentication State**
   - Verify "Delete Account" button is only visible when authenticated
   - Verify button is hidden when not authenticated
   - Verify button is hidden after logout

9. **Test Confirmation Dialog**
   - Verify dialog opens when "Delete Account" is clicked
   - Verify dialog closes when "Cancel" is clicked
   - Verify dialog closes when clicking outside
   - Verify dialog closes on Escape key
   - Verify buttons are disabled during deletion

10. **Test Data Preservation**
    - Create account with meal plans and AI chat sessions
    - Delete account
    - Verify meal plans are deleted
    - Verify ai_chat_sessions are still in database (with user_id reference, even though user is deleted)

11. **Test Accessibility**
    - Verify dialog has proper ARIA attributes
    - Verify keyboard navigation works (Tab, Enter, Escape)
    - Verify screen reader announces dialog and warning message
    - Verify focus management (focus moves to dialog when opened)

12. **Test Responsive Design**
    - Verify "Delete Account" button is visible on mobile devices
    - Verify dialog is properly sized on all screen sizes
    - Verify dialog is centered and readable on mobile

13. **Integration Testing**
    - Test full user journey: Login → Create meal plans → Delete account → Verify deletion
    - Test error recovery: Failed deletion → Error message → Retry → Success
    - Test edge cases: Delete account with no meal plans, delete account with many meal plans

14. **Security Testing**
    - Verify only authenticated users can access delete endpoint
    - Verify users can only delete their own account (not other users' accounts)
    - Verify service role key is not exposed to client
    - Verify error messages don't leak sensitive information

## 14. Acceptance Criteria

Based on US-004 (Account management), the following acceptance criteria must be met:

- ✅ "Delete Account" option is available in the application (navigation bar)
- ✅ Clicking "Delete Account" displays a modal window asking for confirmation
- ✅ Confirmation modal clearly explains that account and meal plans will be permanently deleted
- ✅ After confirmation, account and all associated meal plans are permanently deleted
- ✅ AI chat sessions are preserved (not deleted) for analytical purposes
- ✅ User is automatically signed out after successful deletion
- ✅ User is redirected to home page after deletion
- ✅ Error handling provides clear feedback if deletion fails
- ✅ Deletion cannot be performed without explicit confirmation

## 15. Dependencies

### Frontend Dependencies
- React 19 (already in project)
- Shadcn/ui Dialog, Button, Alert components (already in project)
- Supabase client SDK (already in project)
- `getAuthToken` helper from `@/lib/auth/get-auth-token` (already exists)

### Backend Dependencies
- Astro API routes (already in project)
- Supabase Admin client (may need to be created)
- Session service helper (may need to be created or exists)
- Error classes from `@/lib/errors` (already exists)

### Environment Variables
- `SUPABASE_URL` (already used)
- `SUPABASE_SERVICE_ROLE_KEY` (required for admin client - may need to be added)

## 16. Files to Create/Modify

### New Files
- `src/components/auth/DeleteAccountConfirmationDialog.tsx` - Confirmation dialog component
- `src/pages/api/account/index.ts` - API endpoint for account deletion
- `src/lib/account/account.service.ts` - Service layer for account operations (optional, if service pattern is used)
- `src/db/supabase.admin.ts` - Supabase Admin client (if not exists)

### Modified Files
- `src/components/NavBar.tsx` - Add "Delete Account" button and dialog integration

### Configuration Files
- `.env` or environment configuration - Ensure `SUPABASE_SERVICE_ROLE_KEY` is set

## 17. Testing Checklist

- [ ] DeleteAccountConfirmationDialog opens and closes correctly
- [ ] "Delete Account" button is visible when authenticated
- [ ] "Delete Account" button is hidden when not authenticated
- [ ] Account deletion succeeds with valid authentication
- [ ] Meal plans are deleted when account is deleted
- [ ] AI chat sessions are preserved when account is deleted
- [ ] User is signed out after successful deletion
- [ ] User is redirected to home page after deletion
- [ ] Error message appears on network failure
- [ ] Error message appears on server error
- [ ] User is redirected to login on 401 error
- [ ] Buttons are disabled during deletion
- [ ] Dialog cannot be closed during deletion (optional)
- [ ] Keyboard navigation works in dialog
- [ ] Screen reader announces dialog correctly
- [ ] Responsive design works on mobile devices

## 18. Future Enhancements (Out of Scope)

The following enhancements are not included in this implementation but could be added in the future:

- Two-step confirmation (type "DELETE" to confirm)
- Email notification before account deletion
- Account deletion scheduling (delete after X days)
- Account recovery period (restore account within 30 days)
- Export user data before deletion
- Separate "Delete all meal plans" option (without deleting account)

