\# REST API Plan

This plan details the REST API for the Diet Planner application, based on the provided PRD, Database Plan, and Tech Stack.

\## 1. Resources

\- \*\*`meal\_plans`\*\*: Represents the meal plans created by dietitians. Corresponds to the `public.meal\_plans` table.

\- \*\*`ai\_sessions`\*\*: Represents the conversational AI chat sessions used to generate meal plans. Corresponds to the `public.ai\_chat\_sessions` table (for telemetry and state).

\- \*\*`users`\*\*: Represents the dietitian's account. Corresponds to the `auth.users` table (managed by Supabase).

\## 2. Endpoints

\### Meal Plans (`/api/meal-plans`)

---

\#### `GET /api/meal-plans`

\- \*\*Description\*\*: Retrieves a list of all meal plans for the authenticated user. Supports search and sorting.

\- \*\*Query Parameters\*\*:

&nbsp; - `search` (string, optional): Filters the list by name (case-insensitive, partial match). Leverages the `pg\_trgm` index.

&nbsp; - `sort` (string, optional): Field to sort by. Default: `updated\_at`.

&nbsp; - `order` (string, optional): Sort order. `asc` or `desc`. Default: `desc`.

\- \*\*Request Payload\*\*: None.

\- \*\*Response Payload\*\* (200 OK):

&nbsp; ```json

&nbsp; \[

&nbsp; {

&nbsp; "id": "uuid",

&nbsp; "name": "Weight Reduction Plan - J.K.",

&nbsp; "created_at": "timestampz",

&nbsp; "updated_at": "timestampz",

&nbsp; "startup_data": {

&nbsp; "patient_age": 30,

&nbsp; "patient_weight": 70.5,

&nbsp; "patient_height": 170.0,

&nbsp; "activity_level": "moderate",

&nbsp; "target_kcal": 2000,

&nbsp; "target_macro_distribution": { "p_perc": 30, "f_perc": 25, "c_perc": 45 },

&nbsp; "meal_names": "Breakfast, Second Breakfast, Lunch, Dinner",

&nbsp; "exclusions_guidelines": "Gluten-free, no nuts."

&nbsp; },

&nbsp; "daily_summary": {

&nbsp; "kcal": 2000,

&nbsp; "proteins": 150,

&nbsp; "fats": 60,

&nbsp; "carbs": 215

&nbsp; }

&nbsp; }

&nbsp; ]

&nbsp; ```

\- \*\*Success Codes\*\*:

&nbsp; - `200 OK`: Successfully retrieved the list of meal plans.

\- \*\*Error Codes\*\*:

&nbsp; - `401 Unauthorized`: User is not authenticated.

---

\#### `POST /api/meal-plans`

\- \*\*Description\*\*: Creates a new meal plan. This is called from the editor view after the AI chat is accepted.

\- \*\*Request Payload\*\*:

&nbsp; ```json

&nbsp; {

&nbsp; "source_chat_session_id": "uuid",

&nbsp; "name": "New Patient Plan",

&nbsp; "plan_content": {

&nbsp; "daily_summary": {

&nbsp; "kcal": 2000,

&nbsp; "proteins": 150,

&nbsp; "fats": 60,

&nbsp; "carbs": 215

&nbsp; },

&nbsp; "meals": \[

&nbsp; {

&nbsp; "name": "Breakfast",

&nbsp; "ingredients": "Oats 50g, milk 200ml...",

&nbsp; "preparation": "Mix and cook...",

&nbsp; "summary": { "kcal": 400, "p": 20, "f": 10, "c": 58 }

&nbsp; },

&nbsp; ...

&nbsp; ]

&nbsp; },

&nbsp; "startup_data": {

&nbsp; "patient_age": 30,

&nbsp; "patient_weight": 70.5,

&nbsp; "patient_height": 170.0,

&nbsp; "activity_level": "moderate",

&nbsp; "target_kcal": 2000,

&nbsp; "target_macro_distribution": { "p_perc": 30, "f_perc": 25, "c_perc": 45 },

&nbsp; "meal_names": "Breakfast, Second Breakfast, Lunch, Dinner",

&nbsp; "exclusions_guidelines": "Gluten-free, no nuts."

&nbsp; }

&nbsp; }

&nbsp; ```

\- \*\*Response Payload\*\* (201 Created):

&nbsp; ```json

&nbsp; {

&nbsp; "id": "new-uuid",

&nbsp; "user_id": "auth-user-uuid",

&nbsp; "source_chat_session_id": "uuid",

&nbsp; "name": "New Patient Plan",

&nbsp; "plan_content": { ... },

&nbsp; "patient_age": 30,

&nbsp; "patient_weight": 70.5,

&nbsp; ...

&nbsp; "created_at": "timestampz",

&nbsp; "updated_at": "timestampz"

&nbsp; }

&nbsp; ```

\- \*\*Success Codes\*\*:

&nbsp; - `201 Created`: The meal plan was successfully created.

\- \*\*Error Codes\*\*:

&nbsp; - `400 Bad Request`: Validation failed (e.g., `name` is missing, `plan\_content` is not valid JSON, `activity\_level` is not a valid enum).

&nbsp; - `401 Unauthorized`: User is not authenticated.

---

\#### `GET /api/meal-plans/{id}`

\- \*\*Description\*\*: Retrieves a single, complete meal plan by its ID for viewing or editing.

\- \*\*Request Payload\*\*: None.

\- \*\*Response Payload\*\* (200 OK):

&nbsp; ```json

&nbsp; {

&nbsp; "id": "uuid",

&nbsp; "user_id": "auth-user-uuid",

&nbsp; "source_chat_session_id": "uuid",

&nbsp; "name": "New Patient Plan",

&nbsp; "plan_content": { ... },

&nbsp; "patient_age": 30,

&nbsp; "patient_weight": 70.5,

&nbsp; "patient_height": 170.0,

&nbsp; "activity_level": "moderate",

&nbsp; "target_kcal": 2000,

&nbsp; "target_macro_distribution": { ... },

&nbsp; "meal_names": "Breakfast, Second Breakfast, Lunch, Dinner",

&nbsp; "exclusions_guidelines": "Gluten-free, no nuts.",

&nbsp; "created_at": "timestampz",

&nbsp; "updated_at": "timestampz"

&nbsp; }

&nbsp; ```

\- \*\*Success Codes\*\*:

&nbsp; - `200 OK`: Successfully retrieved the meal plan.

\- \*\*Error Codes\*\*:

&nbsp; - `401 Unauthorized`: User is not authenticated.

&nbsp; - `404 Not Found`: No meal plan found with this ID for the authenticated user (due to RLS).

---

\#### `PUT /api/meal-plans/{id}`

\- \*\*Description\*\*: Updates an existing meal plan. This is called when saving changes from the editor.

\- \*\*Request Payload\*\*: (Only fields to be updated are required, but `name` and `plan\_content` are typical)

&nbsp; ```json

&nbsp; {

&nbsp; "name": "Updated Patient Plan",

&nbsp; "plan_content": {

&nbsp; "daily_summary": { ... },

&nbsp; "meals": \[ ... ]

&nbsp; }

&nbsp; }

&nbsp; ```

\- \*\*Response Payload\*\* (200 OK):

&nbsp; ```json

&nbsp; {

&nbsp; "id": "uuid",

&nbsp; "name": "Updated Patient Plan",

&nbsp; "plan_content": { ... },

&nbsp; ...

&nbsp; "updated_at": "new-timestampz"

&nbsp; }

&nbsp; ```

\- \*\*Success Codes\*\*:

&nbsp; - `200 OK`: The meal plan was successfully updated.

\- \*\*Error Codes\*\*:

&nbsp; - `400 Bad Request`: Validation failed (e.g., `name` is empty).

&nbsp; - `401 Unauthorized`: User is not authenticated.

&nbsp; - `404 Not Found`: No meal plan found with this ID for the authenticated user.

---

\#### `DELETE /api/meal-plans/{id}`

\- \*\*Description\*\*: Permanently deletes a meal plan.

\- \*\*Request Payload\*\*: None.

\- \*\*Response Payload\*\* (204 No Content): Empty.

\- \*\*Success Codes\*\*:

&nbsp; - `204 No Content`: The meal plan was successfully deleted.

\- \*\*Error Codes\*\*:

&nbsp; - `401 Unauthorized`: User is not authenticated.

&nbsp; - `404 Not Found`: No meal plan found with this ID for the authenticated user.

---

\#### `GET /api/meal-plans/{id}/export`

\- \*\*Description\*\*: Generates and returns a `.doc` file of the specified meal plan.

\- \*\*Request Payload\*\*: None.

\- \*\*Response Payload\*\* (200 OK):

&nbsp; - The binary data of the `.doc` file.

&nbsp; - `Content-Type: application/msword`

&nbsp; - `Content-Disposition: attachment; filename="plan-name.doc"`

\- \*\*Success Codes\*\*:

&nbsp; - `200 OK`: Successfully generated and returned the file.

\- \*\*Error Codes\*\*:

&nbsp; - `401 Unauthorized`: User is not authenticated.

&nbsp; - `404 Not Found`: No meal plan found with this ID for the authenticated user.

&nbsp; - `500 Internal Server Error`: File generation failed.

\### AI Chat Sessions (`/api/ai/sessions`)

---

\#### `POST /api/ai/sessions`

\- \*\*Description\*\*: Initiates a new AI chat session. This takes the startup form, formats the first prompt, calls OpenRouter, and creates the `ai\_chat\_sessions` telemetry record.

\- \*\*Request Payload\*\*: (Corresponds to PRD 3.3.1)

&nbsp; ```json

&nbsp; {

&nbsp; "patient_age": 30,

&nbsp; "patient_weight": 70.5,

&nbsp; "patient_height": 170.0,

&nbsp; "activity_level": "moderate",

&nbsp; "target_kcal": 2000,

&nbsp; "target_macro_distribution": { "p_perc": 30, "f_perc": 25, "c_perc": 45 },

&nbsp; "meal_names": "Breakfast, Second Breakfast, Lunch, Dinner",

&nbsp; "exclusions_guidelines": "Gluten-free, no nuts."

&nbsp; }

&nbsp; ```

\- \*\*Response Payload\*\* (201 Created):

&nbsp; ```json

&nbsp; {

&nbsp; "session_id": "new-chat-session-uuid",

&nbsp; "message": {

&nbsp; "role": "assistant",

&nbsp; "content": "Here is the 1-day meal plan based on your guidelines..."

&nbsp; },

&nbsp; "prompt_count": 1

&nbsp; }

&nbsp; ```

\- \*\*Success Codes\*\*:

&nbsp; - `201 Created`: Session initiated and first AI response generated.

\- \*\*Error Codes\*\*:

&nbsp; - `400 Bad Request`: Validation failed (e.g., `activity\_level` is not a valid enum, `target\_kcal` is not a number).

&nbsp; - `401 Unauthorized`: User is not authenticated.

&nbsp; - `502 Bad Gateway`: Error communicating with OpenRouter.ai.

---

\#### `POST /api/ai/sessions/{id}/message`

\- \*\*Description\*\*: Sends a follow-up message in an existing AI chat session. The backend appends this to the history, calls OpenRouter, updates the `message\_history` and `final\_prompt\_count` in the database, and returns the response.

\- \*\*Request Payload\*\*:

&nbsp; ```json

&nbsp; {

&nbsp; "message": {

&nbsp; "role": "user",

&nbsp; "content": "Change dinner to something dairy-free."

&nbsp; }

&nbsp; }

&nbsp; ```

\- \*\*Response Payload\*\* (200 OK):

&nbsp; ```json

&nbsp; {

&nbsp; "session_id": "chat-session-uuid",

&nbsp; "message": {

&nbsp; "role": "assistant",

&nbsp; "content": "Understood. Here is the updated plan with a dairy-free dinner..."

&nbsp; },

&nbsp; "prompt_count": 2

&nbsp; }

&nbsp; ```

\- \*\*Success Codes\*\*:

&nbsp; - `200 OK`: Follow-up message processed and AI response returned.

\- \*\*Error Codes\*\*:

&nbsp; - `401 Unauthorized`: User is not authenticated.

&nbsp; - `404 Not Found`: No chat session found with this ID for the user.

&nbsp; - `502 Bad Gateway`: Error communicating with OpenRouter.ai.

\### User Management (`/api/users`)

---

\#### `DELETE /api/users/me`

\- \*\*Description\*\*: Permanently deletes the authenticated user's account and all associated data (meal plans, chat sessions) via the `ON DELETE CASCADE` rule in the database.

\- \*\*Request Payload\*\*: None.

\- \*\*Response Payload\*\* (204 No Content): Empty.

\- \*\*Success Codes\*\*:

&nbsp; - `204 No Content`: The user account and all data were successfully deleted.

\- \*\*Error Codes\*\*:

&nbsp; - `401 Unauthorized`: User is not authenticated.

&nbsp; - `500 Internal Server Error`: Failed to delete the user from `auth.users`.

\## 3. Authentication and Authorization

\- \*\*Authentication\*\*: Handled via Supabase's built-in authentication. All API requests (except Supabase's built-in auth endpoints for login/register) must include a valid `Authorization: Bearer <SUPABASE\_JWT>` header. The backend will use this JWT to identify the user via `auth.uid()`.

\- \*\*Authorization\*\*: Implemented at the database level using PostgreSQL Row-Level Security (RLS), as defined in `db-plan.md`.

&nbsp; - \*\*`meal\_plans`\*\*: Users can only perform CRUD operations on their \*own\* records (`auth.uid() = user\_id`).

&nbsp; - \*\*`ai\_chat\_sessions`\*\*: Users can only `INSERT` new sessions. They cannot `SELECT`, `UPDATE`, or `DELETE` any sessions, including their own, ensuring telemetry data is private and immutable.

\## 4. Validation and Business Logic

\- \*\*Validation\*\*:

&nbsp; - Input validation will be performed by the API for all `POST`/`PUT` requests before hitting the database.

&nbsp; - This includes checking for `NOT NULL` fields (e.g., `meal\_plans.name`), correct data types (e.g., `patient\_age` is an integer), and enum constraints (e.g., `activity\_level` is one of the allowed values).

\- \*\*Business Logic\*\*:

&nbsp; - \*\*Registration/Login/Reset\*\*: Handled by the Supabase client SDK (BaaS approach), not by this custom API.

&nbsp; - \*\*AI Interaction\*\*: The `POST /api/ai/sessions` and `POST /api/ai/sessions/{id}/message` endpoints orchestrate the business logic of communicating with OpenRouter.ai and logging telemetry to the `ai\_chat\_sessions` table.

&nbsp; - \*\*Plan Creation Workflow\*\*: The frontend bridges the gap between chat and editor. It takes the final response from `POST .../message`, lets the user edit, and then calls `POST /api/meal-plans` to save the final plan, linking it via the `source\_chat\_session\_id`.

&nbsp; - \*\*Dashboard Sorting\*\*: The `GET /api/meal-plans` endpoint defaults to sorting by `updated\_at desc` to fulfill `US-011` ("Newly saved meal plan is visible at the top..."). The `on\_meal\_plan\_update` trigger ensures `updated\_at` is always current.

&nbsp; - \*\*Dashboard Search\*\*: The `search` parameter on `GET /api/meal-plans` uses the `idx\_meal\_plans\_name\_trgm` index for fast, live filtering as required by `US-006`.

&nbsp; - \*\*Export\*\*: The `GET /api/meal-plans/{id}/export` endpoint reads the saved plan \*and\* its associated startup data (e.g., `patient\_age`, `target\_kcal`) to generate the complete .doc file as specified in `PRD 3.4`.
