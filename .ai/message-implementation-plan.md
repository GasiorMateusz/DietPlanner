# API Endpoint Implementation Plan: POST /api/ai/sessions/{id}/message

## 1. Endpoint Overview

This endpoint handles follow-up messages in an existing AI chat session. It appends the user's message to the session history, calls OpenRouter.ai for an AI response, updates the database with the new message history and incremented prompt count, and returns the AI's response. This enables conversational refinement of meal plans during the creation process.

**Key Behaviors:**
- Maintains conversation context by retrieving and extending existing message history
- Increments prompt count for each interaction (telemetry)
- Reuses the system prompt from session creation for consistency
- Returns structured response following the SendAiMessageResponseDto contract

## 2. Request Details

**HTTP Method:** `POST`

**URL Structure:** `/api/ai/sessions/{id}/message`

**Path Parameters:**
- `id` (required): UUID of the existing AI chat session

**Request Body Structure:**
```json
{
  "message": {
    "role": "user",
    "content": "Change dinner to something dairy-free."
  }
}
```

**Content-Type:** `application/json`

## 3. Used Types

### Input Types (from `src/types.ts`):
- `SendAiMessageCommand` - Request payload type
- `ChatMessage` - Union type for messages in history
- `UserChatMessage` - Type for the incoming user message
- `AssistantChatMessage` - Type for the AI response

### Output Types (from `src/types.ts`):
- `SendAiMessageResponseDto` - Response payload type
- `Tables<'ai_chat_sessions'>` - Database table types

### Database Types (from `src/db/database.types.ts`):
- `Database` - Supabase database schema

## 4. Response Details

**Success Response (200 OK):**
```json
{
  "session_id": "chat-session-uuid",
  "message": {
    "role": "assistant",
    "content": "Understood. Here is the updated plan with a dairy-free dinner..."
  },
  "prompt_count": 2
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request body or message structure
- `401 Unauthorized`: User not authenticated (test user not found in testing mode)
- `404 Not Found`: AI chat session not found or not owned by user
- `502 Bad Gateway`: OpenRouter API failure or timeout
- `500 Internal Server Error`: Database or other internal errors

## 5. Data Flow

1. **Authentication & Authorization:**
   - Extract session ID from URL path
   - Retrieve authenticated user ID (test user in development mode)
   - Verify session exists and belongs to user (RLS policy will enforce)

2. **Request Validation:**
   - Parse JSON request body
   - Validate structure against `SendAiMessageCommand` schema
   - Ensure message has `role: 'user'` and non-empty content

3. **Session Retrieval:**
   - Query `ai_chat_sessions` for existing session
   - Extract `message_history` and `final_prompt_count`
   - Handle case where session doesn't exist (404)

4. **Message History Preparation:**
   - Append user message to existing history
   - Convert history to format accepted by OpenRouter (including system message)

5. **AI Service Call:**
   - Call `OpenRouterService.getChatCompletion()` with full history
   - Receive assistant response

6. **Database Update:**
   - Append assistant message to history
   - Increment `final_prompt_count`
   - Update `ai_chat_sessions` record

7. **Response Construction:**
   - Build `SendAiMessageResponseDto` with session ID, message, and count
   - Return 200 OK with JSON payload

## 6. Security Considerations

### Authentication
- **Production:** Verify Supabase JWT token via `supabase.auth.getUser()`
- **Testing:** Use hardcoded test user ID (same pattern as sessions.ts)
- **Enforcement:** Return 401 if authentication fails

### Authorization
- **RLS Policy:** Row-level security prevents users from accessing other users' sessions
- **Session Ownership:** Implicitly verified through RLS when querying database
- **Data Privacy:** Chat sessions are telemetry-only and cannot be read by users via API

### Input Validation
- **Zod Schema:** Validate request body structure strictly
- **Content Sanitization:** OpenRouter API handles message content safely
- **UUID Validation:** Astro route params automatically validate UUID format

### External API Security
- **API Key:** Stored in environment variable, never exposed to client
- **Timeout:** 30-second timeout prevents hanging requests
- **Error Masking:** Do not expose internal OpenRouter error details to client

### Database Security
- **Parameterized Queries:** Supabase client handles SQL injection prevention
- **RLS Policies:** Enforced at database level for defense in depth
- **Immutability:** Chat sessions are write-once (no UPDATE/DELETE access for users)

## 7. Error Handling

### Validation Errors (400 Bad Request)
**Scenario:** Malformed request body or invalid message structure  
**Handling:** Return validation errors from Zod schema  
**Example:**
```json
{
  "error": "Validation failed",
  "details": [
    { "path": ["message", "content"], "message": "Required" }
  ]
}
```

### Authentication Errors (401 Unauthorized)
**Scenario:** No authenticated user or invalid session token  
**Handling:** Return generic error message to avoid information leakage  
**Example:**
```json
{ "error": "Unauthorized" }
```

### Not Found Errors (404 Not Found)
**Scenario:** Session doesn't exist or user doesn't own it  
**Handling:** Return generic not found message  
**Example:**
```json
{ "error": "Chat session not found" }
```

### OpenRouter Errors (502 Bad Gateway)
**Scenario:** OpenRouter API failure, timeout, or invalid response  
**Handling:** Catch `OpenRouterError` exception, log details, return generic error  
**Example:**
```json
{ "error": "AI service unavailable" }
```

### Database Errors (500 Internal Server Error)
**Scenario:** Database connection failure or query error  
**Handling:** Log full error details, return generic error to client  
**Example:**
```json
{
  "error": "An internal error occurred",
  "details": "Database operation failed"
}
```

### JSON Parse Errors (400 Bad Request)
**Scenario:** Invalid JSON in request body  
**Handling:** Catch parsing exception and return clear error  
**Example:**
```json
{
  "error": "Invalid JSON in request body",
  "details": "Unexpected token..."
}
```

## 8. Performance Considerations

### Database Queries
- **Single Query:** Retrieve session data with one SELECT
- **Single Update:** Update session with one UPDATE
- **Indexes:** Foreign key index on `user_id` ensures fast lookups
- **RLS Overhead:** Minimal performance impact due to simple WHERE clause

### External API Calls
- **Timeout:** 30-second timeout prevents indefinite blocking
- **Retry:** Not implemented in MVP (consider for production)
- **Caching:** Not applicable for conversational AI

### Message History
- **Size Limiting:** No explicit limit in MVP (monitor in production)
- **Serialization:** JSONB storage optimized for large arrays
- **Memory:** Full history sent to OpenRouter each time (no context window truncation)

### Concurrency
- **Race Conditions:** No locking mechanism (last write wins for history updates)
- **Acceptable Risk:** Low probability of concurrent edits to same session

## 9. Implementation Steps

### Step 1: Create Validation Schema
**File:** `src/lib/validation/ai.schemas.ts`

Add Zod schema for `SendAiMessageCommand`:
```typescript
export const sendAiMessageSchema = z.object({
  message: z.object({
    role: z.literal('user'),
    content: z.string().min(1),
  }),
});
```

### Step 2: Extend Session Service
**File:** `src/lib/ai/session.service.ts`

Add `sendMessage` static method:
- Parameters: `sessionId`, `command`, `userId`, `supabase`
- Returns: `SendAiMessageResponseDto`
- Logic:
  1. Query session by ID with user_id filter
  2. If not found, throw custom error
  3. Extract message history
  4. Append user message
  5. Convert history for OpenRouter (handle system message)
  6. Call `OpenRouterService.getChatCompletion()`
  7. Append assistant response
  8. Increment `final_prompt_count`
  9. Update database record
  10. Return DTO

**Helper Function:**
Create `convertHistoryForOpenRouter()` to:
- Detect `[SYSTEM]` prefix in first user message
- Convert it to system role for OpenRouter
- Return array of `OpenRouterMessage[]`

### Step 3: Create API Route Handler
**File:** `src/pages/api/ai/sessions/[id]/message.ts`

Implement POST handler:
- Extract session ID from URL params
- Parse and validate request body with `sendAiMessageSchema`
- Authenticate (test user for development)
- Call `AiSessionService.sendMessage()`
- Handle errors with appropriate status codes:
  - `OpenRouterError` → 502
  - Custom `NotFoundError` → 404
  - Validation errors → 400
  - Generic errors → 500
- Return `SendAiMessageResponseDto` with 200

### Step 4: Create Custom Error Class
**File:** `src/lib/errors.ts` (if not exists) or extend existing

Add:
```typescript
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}
```

### Step 5: Update Type Exports
**File:** `src/types.ts`

Ensure types are properly exported:
- `SendAiMessageCommand`
- `SendAiMessageResponseDto`

### Step 6: Testing
**Files:** `testing/seesions-TESTING.md` (update existing doc)

Add test cases:
- Valid follow-up message
- Invalid message structure
- Non-existent session ID
- Invalid session ID format
- Empty message content
- OpenRouter timeout simulation
- Database failure simulation

### Step 7: Documentation
**File:** `.ai/api-plan.md`

Verify documentation matches implementation:
- Request/response examples
- Error codes
- Path parameter details

### Step 8: Code Review Checklist
- [ ] Error handling follows existing patterns
- [ ] Validation schema is comprehensive
- [ ] Service method is pure (no side effects except DB/API)
- [ ] Type safety maintained throughout
- [ ] No hardcoded values (except test user)
- [ ] Logging appropriate for production
- [ ] RLS policies working as expected
- [ ] Response DTOs match API specification
