# API Endpoint Implementation Plan: POST /api/ai/sessions

## 1. Endpoint Overview

This endpoint initiates a new AI-powered meal plan generation session. It accepts the dietitian's initial "startup data" (patient info, targets, guidelines), formats this data into a system prompt and an initial user prompt, orchestrates a call to the OpenRouter.ai service, and saves the initial conversation turn (user prompt + assistant response) to the ai_chat_sessions table for telemetry. It then returns the new session ID and the first assistant message to the client.

## 2. Request Details

- **HTTP Method:** POST
- **URL Structure:** `/api/ai/sessions`
- **Parameters:** None (all data is in the body)

### Request Body

- **Content-Type:** `application/json`
- **Structure:** The body must be a JSON object matching the `CreateAiSessionCommand` type from `types.ts`

## 3. Used Types

- **Request Command Model:** `CreateAiSessionCommand` (aliased from `MealPlanStartupData` in `types.ts`)
- **Response DTO:** `CreateAiSessionResponseDto` (from `types.ts`)

### Supporting Types

- `AssistantChatMessage` (from `types.ts`)
- `TargetMacroDistribution` (from `types.ts`)
- `activity_level_enum` (from `db-plan.md`, for validation)

## 4. Response Details

### Success (201 Created)

- **Content-Type:** `application/json`
- **Body:** An object matching the `CreateAiSessionResponseDto`

```json
{
  "session_id": "a-new-uuid",
  "message": {
    "role": "assistant",
    "content": "Here is the 1-day meal plan based on your guidelines..."
  },
  "prompt_count": 1
}
```

### Error (400, 401, 500, 502)

- **Content-Type:** `application/json`
- **Body:**

```json
{
  "error": "A descriptive error message",
  "details": "[Optional: Zod validation issue details]"
}
```

## 5. Data Flow

### Route Handler (`/api/ai/sessions.ts`)

1. Retrieves the Supabase client from `context.locals.supabase` (as per `backend.mdc`)
2. Authenticates the request by getting the `user_id` from the Supabase session. If no user, return 401
3. Parses and validates the raw JSON body using the `createAiSessionSchema` (Zod schema to be created). If validation fails, return 400
4. Passes the validated `CreateAiSessionCommand` data and `user_id` to the `AiSessionService`
5. Receives a `Success(CreateAiSessionResponseDto)` or `Error(ApiError)` from the service
6. Returns a 201 Created response with the DTO or an appropriate error (400, 502, 500) with the error message

### Service (`src/lib/ai/session.service.ts` - To be created)

1. `createSession(command: CreateAiSessionCommand, userId: string, supabase: SupabaseClient)` method is called
2. Generates a new UUID (`newSessionId`) for the chat session using `crypto.randomUUID()`
3. **Prompt Engineering:** Formats the command data into a system prompt (`systemPrompt`) and an initial user prompt (`userPrompt`)
4. **External API Call:** Calls an `OpenRouterService` (to be created) with `systemPrompt` and `userPrompt`
5. `OpenRouterService` returns the `AssistantChatMessage`
6. **Database Insert:**
   - Builds the `message_history` array: `[systemPrompt, userPrompt, assistantResponse]`
   - Constructs the `ai_chat_sessions` record:
     ```typescript
     const newSessionRecord = {
       id: newSessionId,
       user_id: userId,
       message_history: message_history,
       final_prompt_count: 1, // This is the first prompt
     };
     ```
   - Inserts the record: `await supabase.from('ai_chat_sessions').insert(newSessionRecord)`. This respects the RLS policy (INSERT allowed, SELECT denied)
7. **Response:**
   - Constructs the `CreateAiSessionResponseDto`:
     ```typescript
     const responseDto: CreateAiSessionResponseDto = {
       session_id: newSessionId,
       message: assistantResponse,
       prompt_count: 1,
     };
     ```
   - Returns this DTO to the route handler

## 6. Security Considerations

### Authentication

The route handler must retrieve the `user_id` from the authenticated Supabase session (`context.locals.supabase.auth`). If no user is found, a 401 Unauthorized must be returned immediately.

### Authorization (RLS)

The database operation is governed by the RLS policy on `ai_chat_sessions`. The INSERT will only succeed if the `user_id` in the new record matches `auth.uid()`, which is handled by the service logic. No SELECT is possible, so the service must generate its own UUID and return it, as it cannot read the row after inserting.

### Input Validation

A Zod schema (`createAiSessionSchema`) must be created and used to validate all fields in the `CreateAiSessionCommand` body. This prevents malformed data from being processed or sent to the AI model.

### API Key Management

The `OPENROUTER_API_KEY` must be stored as a secure environment variable on the server and accessed only by the `OpenRouterService`. It must never be exposed to the client.

### Prompt Injection

The user-provided fields (`meal_names`, `exclusions_guidelines`) are directly used in the prompt. The system prompt must be written defensively (e.g., "You are a helpful dietitian assistant. Your only task is to generate a meal plan based on the following data...").

## 7. Error Handling

### 400 Bad Request

- **Trigger:** The request body fails Zod validation
- **Action:** Return a 400 response with a JSON body detailing the validation errors (from `zodError.errors`)

### 401 Unauthorized

- **Trigger:** No valid Supabase session (JWT) is found
- **Action:** Return a 401 response with `{"error": "Unauthorized"}`

### 502 Bad Gateway

- **Trigger:** The `OpenRouterService` fails to get a successful response from OpenRouter.ai (e.g., API key error, 5xx from OpenRouter, network timeout)
- **Action:** Log the specific error from OpenRouter. Return a 502 response with `{"error": "AI service unavailable"}`

### 500 Internal Server Error

- **Trigger:** The `supabase.from('ai_chat_sessions').insert()` query fails for an unexpected reason (e.g., DB connection loss, RLS policy failure not caught)
- **Action:** Log the Supabase database error. Return a 500 response with `{"error": "An internal error occurred"}`

## 8. Performance Considerations

- The primary bottleneck will be the external API call to OpenRouter.ai, which can take several seconds. The client must be prepared to show a loading state
- The database insert is a single, indexed operation and should be very fast
- Ensure the `OpenRouterService` uses a reasonable timeout for the fetch call

## 9. Implementation Steps

### Create Zod Schema (`src/lib/validation/ai.schemas.ts`)

- Define `createAiSessionSchema` using Zod
- Validate all fields from `CreateAiSessionCommand` / `MealPlanStartupData`
- Use `z.enum(['sedentary', 'light', 'moderate', 'high'])` for `activity_level`
- Ensure numeric fields are positive and objects (`target_macro_distribution`) have the correct internal structure. Use `.nullable().optional()` for all fields as they are not all strictly required by the form

### Create OpenRouter Service (`src/lib/ai/openrouter.service.ts`)

- Create a class or function that handles fetch calls to OpenRouter.ai
- It should read `import.meta.env.OPENROUTER_API_KEY`
- It should accept a message history (`ChatMessage[]`) and return a `Promise<AssistantChatMessage>`
- It must include robust error handling and throw a specific error if the API call fails, so the `AiSessionService` can catch it and return a 502

### Create AI Session Service (`src/lib/ai/session.service.ts`)

- Implement the `createSession` function as described in the "Data Flow" section
- This service will contain the core business logic: prompt formatting, calling the OpenRouter service, and building the DB record
- It should not handle HTTP responses, only return data or throw errors

### Create API Route (`src/pages/api/ai/sessions.ts`)

- This is an Astro API route handler (`export async function POST({ request, context })`)
- Get the Supabase client: `const supabase = context.locals.supabase;`
- Check for user session; return 401 if absent
- Wrap the logic in a try...catch block
- Parse the body: `const body = await request.json();`
- Validate the body: `const validation = createAiSessionSchema.safeParse(body);`
- If `!validation.success`, return 400 with `validation.error`
- Call the service: `const responseDto = await AiSessionService.createSession(validation.data, user.id, supabase);`
- Return `new Response(JSON.stringify(responseDto), { status: 201 });`
- In the catch block, check error types (e.g., `OpenRouterError`, `SupabaseError`) and return the appropriate 500 or 502 response
