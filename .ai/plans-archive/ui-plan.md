# UI Architecture for Diet Planner

## 1. UI Structure Overview

The UI architecture is built on a "hybrid" model using Astro for static layouts and React for dynamic, interactive "islands." This approach leverages Astro's performance for non-interactive parts of the application while using React for complex, stateful components.

The structure is split into two primary layouts, as defined in the planning session:

- **Public Layout (Astro)**: Manages all public-facing authentication pages. This layout is minimal and does not contain any persistent navigation. User authentication state is managed here via the Supabase client SDK.

- **Private Layout (Astro)**: A secure container for the main application, accessible only to authenticated users. This layout will include the main navigation (e.g., header with logo, "My Account" access) and will be responsible for passing the Supabase JWT to all child React components, which then use it for API requests.

**State management** will be localized. React components (e.g., AI Chat, Editor) will manage their own state using useState. There is no global state manager. A simple client-side variable will be used to bridge the state transfer between the AI Chat and the Editor upon acceptance.

**Error handling** will be managed globally. A 401 Unauthorized response from any API will trigger a redirect to the /login page. Non-blocking errors (like a 502 from the AI) will be handled with toasts or inline messages, while validation errors will be displayed inline via zod.

## 2. View List

### Public Views (Public Layout)

#### View: Login

- **Path**: `/login`
- **Main Purpose**: Authenticate a registered user (dietitian). (US-002)
- **Key Information**:
  - Email address field
  - Password field
- **Key View Components**:
  - `LoginForm` (React): A client-side form with validation.
  - Button: "Login".
  - Link: To `/register` ("Don't have an account?").
  - Link: To `/forgot-password` ("Forgot password?").
- **Considerations**:
  - UX: Clear, inline error messages for "Invalid email or password."
  - Security: Form submission handled by Supabase SDK.

#### View: Register

- **Path**: `/register`
- **Main Purpose**: Create a new user account. (US-001)
- **Key Information**:
  - Email address field
  - Password field
  - Repeat password field
  - "Terms and Conditions" checkbox.
- **Key View Components**:
  - `RegisterForm` (React): Client-side validation (passwords match, email format, checkbox required).
  - Checkbox: "I accept the terms..." (PRD 3.1)
  - Button: "Register".
  - Link: To `/login` ("Already have an account?").
- **Considerations**:
  - UX: Client-side validation with zod to provide immediate feedback.
  - Security: Checkbox is mandatory for form submission.

#### View: Forgot Password

- **Path**: `/forgot-password`
- **Main Purpose**: Initiate the password reset flow. (US-003)
- **Key Information**:
  - Email address field.
- **Key View Components**:
  - `ForgotPasswordForm` (React).
  - Button: "Send Reset Link".
  - Link: To `/login` ("Back to login").
- **Considerations**:
  - UX: A success message ("If an account exists, a reset link has been sent.") is shown to avoid user enumeration.

#### View: Reset Password

- **Path**: `/reset-password` (Note: This page is typically accessed via a unique link sent to the user's email).
- **Main Purpose**: Allow a user to set a new password. (US-003)
- **Key Information**:
  - New password field.
  - Repeat new password field.
- **Key View Components**:
  - `ResetPasswordForm` (React): Client-side validation for password strength and matching.
  - Button: "Set New Password".
- **Considerations**:
  - Security: This page is only functional with a valid token from the Supabase email link.

### Private Views (Private Layout)

#### View: Dashboard

- **Path**: `/app/dashboard`
- **Main Purpose**: Display, manage, and initiate the creation of meal plans. (US-005)
- **Key Information**:
  - List of all saved meal plans.
  - "Empty state" message if no plans exist.
- **Key View Components**:
  - Button: "Create new meal plan". Triggers the StartupForm Dialog. (US-008)
  - Input (Search): A search field that triggers a debounced API call (`GET /api/meal-plans?search=...`). (US-006)
  - `MealPlanList` (React): Fetches and displays the list of plans.
  - `MealPlanListItem`: A single plan row with:
    - Button: "Edit / View" (Navigates to `/app/editor/{id}`)
    - `<a>` tag: "Export" (Links to `GET /api/meal-plans/{id}/export` with download attribute). (US-012)
    - Button: "Delete" (Triggers the DeleteConfirmation Dialog). (US-007)
  - `StartupForm` (`<Dialog>`): Modal for creating a new plan. (PRD 3.3.1)
  - `DeleteConfirmation` (`<Dialog>`): Modal to confirm `DELETE /api/meal-plans/{id}`.
- **Considerations**:
  - UX: The list must refresh (re-fetch) after a user saves, updates, or deletes a plan. The session notes confirm this "invalidate and refetch" strategy.
  - Accessibility: The search input and list should be screen-reader friendly.
  - Error: Display an error state if `GET /api/meal-plans` fails.

#### View: AI Chat Interface

- **Path**: `/app/create`
- **Main Purpose**: Iteratively generate the initial meal plan with AI. (US-009)
- **Key Information**:
  - The conversation history (user and assistant messages).
  - The AI disclaimer (PRD 3.3.2).
- **Key View Components**:
  - `AIChatInterface` (React): A single component managing its own state.
  - `MessageHistory`: Displays the list of chat messages.
  - `MessageInput`: A Textarea and "Send" button for follow-up prompts (`POST /api/ai/sessions/{id}/message`).
  - Alert: A permanently visible disclaimer.
  - Button: "Accept and edit manually". (US-010)
- **Considerations**:
  - UX: A loading indicator ("Assistant is typing...") must be shown while waiting for the API response.
  - State: The component maintains the session_id and messageHistory array in its local useState.
  - Error: If the AI call fails (e.g., 502), an inline error message must be shown, allowing the user to retry.

#### View: Meal Plan Editor

- **Path**: `/app/editor/{id?}` (e.g., `/app/editor` for new, `/app/editor/uuid-1234` for existing)
- **Main Purpose**: Manually edit, finalize, and save a meal plan. (US-011)
- **Key Information**:
  - The component operates in two modes based on the mealPlanId prop.
  - Create Mode (no ID): Loads initial data from the client-side variable set by the AI Chat view.
  - Edit Mode (with ID): Fetches data using `GET /api/meal-plans/{id}`.
- **Key View Components**:
  - `MealPlanEditor` (React): The main component.
  - Input (Plan Name): Required field.
  - `MealCard` (Component): A repeatable component for each meal, containing editable fields for Name, Ingredients, and Preparation.
  - Button: "Add Meal" / "Remove Meal".
  - `StaticSummary`: A non-editable display of daily Kcal/macro totals (PRD 3.3.3).
  - Button: "Save changes". Disabled until "Meal Plan Name" is filled (via zod validation). Calls POST or PUT based on mode.
  - `<a>` tag: "Export to .doc" (visible only in Edit Mode). (US-012)
- **Considerations**:
  - UX: Form validation is critical. The "Save" button's state must be managed.
  - Data Flow: This view is the destination for both the "Create" flow (from AI Chat) and the "Edit" flow (from Dashboard).

## 3. User Journey Map

### Main User Journey: Creating a New Meal Plan

1. **Login**: User lands on `/login`, enters credentials, and is redirected to `/app/dashboard`.

2. **Initiate**: On the Dashboard, the user clicks "Create new meal plan".

3. **Startup**: The StartupForm (`<Dialog>`) appears. The user fills in patient data (age, kcal, exclusions) and clicks "Generate".

4. **API Call (Start)**: The UI submits the form data via `POST /api/ai/sessions`.

5. **Navigate to Chat**: On success, the application navigates to `/app/create` (AI Chat). The session_id and first AI message are passed to the component.

6. **AI Interaction**: The user sees the first plan. They can send follow-up messages (e.g., "Change dinner") via the chat input (`POST /api/ai/sessions/{id}/message`). The UI updates the chat history with each new response.

7. **Accept Plan**: Once satisfied, the user clicks "Accept and edit manually".

8. **State Bridge**: The application stores the final AI message content and the initial startup data in a simple client-side variable.

9. **Navigate to Editor**: The application navigates to `/app/editor` (Create Mode).

10. **Edit**: The MealPlanEditor component mounts, reads the data from the bridge variable, and populates its fields. The user makes manual tweaks and provides a "Meal Plan Name".

11. **Save**: The user clicks "Save changes".

12. **API Call (Save)**: The UI submits the editor's content via `POST /api/meal-plans`.

13. **Return to Dashboard**: On success, the application navigates back to `/app/dashboard`.

14. **Refetch**: The Dashboard component re-fetches its data (`GET /api/meal-plans`), and the user sees their new plan at the top of the list.

## 4. Layout and Navigation Structure

### Public Layout (Astro)

- **Pages**: `/login`, `/register`, `/forgot-password`, `/reset-password`.
- **Navigation**: No persistent navigation. Users navigate via explicit links (e.g., "Need an account?").

### Private Layout (Astro)

- **Pages**: `/app/dashboard`, `/app/create`, `/app/editor/{id?}`.
- **Navigation**: Contains a persistent header.
  - Logo/App Name: Links to `/app/dashboard`.
  - "My Account" Button: Triggers the MyAccountPanel (`<Sheet>`).

### Key Navigational Components

- **MyAccountPanel** (`<Sheet>`): A side panel for "Change Password" and "Delete Account" (US-004).
- **GlobalRedirect**: A conceptual component or hook that listens to API responses. If a 401 Unauthorized is detected, it forces a redirect to `/login`.

## 5. Key Components

This is a list of key reusable or architecturally significant components.

### StartupForm (`<Dialog>`)

- **Description**: A shadcn/ui Dialog containing the structured form for starting AI generation (PRD 3.3.1).
- **Logic**: Uses zod for client-side validation. On submit, calls `POST /api/ai/sessions`. Handles loading and error states internally.

### DeleteConfirmation (`<Dialog>`)

- **Description**: A shadcn/ui Dialog to confirm deleting a meal plan (US-007).
- **Logic**: Receives a mealPlanId prop. On confirm, calls `DELETE /api/meal-plans/{id}` and triggers a refetch of the Dashboard data.

### MyAccountPanel (`<Sheet>`)

- **Description**: A shadcn/ui Sheet (side panel) for account management (US-004).
- **Logic**: Contains forms for changing password (using Supabase SDK) and deleting the account (`DELETE /api/users/me`).

### AIChatInterface (React Component)

- **Description**: The main component for the `/app/create` view.
- **Logic**: Manages all chat-related state locally (session_id, messageHistory, isLoading). Handles `POST .../message` calls and displays inline errors on 502.

### MealPlanEditor (React Component)

- **Description**: The main component for the `/app/editor/{id?}` view.
- **Logic**: Implements the mealPlanId prop logic to switch between Create (POST) and Edit (PUT) modes. Uses zod to manage form state and validation, especially for the "Save" button's disabled state.
