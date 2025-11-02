# OpenRouter Service Implementation Plan

## 1. Service Description

The OpenRouter service is a TypeScript service class designed to interact with the OpenRouter.ai API for LLM-based chat completions. This service provides a clean, type-safe interface for:

- Sending chat completion requests with configurable models
- Managing system and user messages
- Supporting structured responses via JSON schema
- Configuring model parameters (temperature, max_tokens, etc.)
- Handling errors gracefully with retry logic
- Ensuring secure API key management

The service is built as a class that can be instantiated or used statically, following the existing codebase patterns. It integrates seamlessly with the Astro 5 framework and TypeScript 5 type system.

## 2. Constructor Description

The OpenRouterService constructor initializes the service with configuration options. The service can be instantiated or used statically (matching current implementation pattern).

### Constructor Parameters

```typescript
constructor(config?: {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
  maxRetries?: number;
})
```

### Configuration Options

1. **apiKey** (optional): OpenRouter API key. If not provided, will read from `import.meta.env.OPENROUTER_API_KEY`
2. **baseUrl** (optional): Base URL for OpenRouter API. Default: `"https://openrouter.ai/api/v1"`
3. **defaultModel** (optional): Default model to use for completions. Default: `"anthropic/claude-3.5-sonnet"`
4. **defaultHeaders** (optional): Additional headers for requests (e.g., `HTTP-Referer`, `X-Title`). Default: `{}`
5. **timeout** (optional): Request timeout in milliseconds. Default: `30000` (30 seconds)
6. **maxRetries** (optional): Maximum number of retry attempts for failed requests. Default: `3`

### Example Usage

```typescript
// Instance-based usage
const service = new OpenRouterService({
  apiKey: "sk-or-v1-...",
  defaultModel: "anthropic/claude-3.5-sonnet",
  timeout: 60000,
});

// Static usage (current pattern - reads from env)
const response = await OpenRouterService.getChatCompletion(messages);
```

## 3. Public Methods and Fields

### 3.1 `getChatCompletion` (Static & Instance)

Sends a chat completion request to OpenRouter API and returns the assistant's response.

**Signature:**
```typescript
static async getChatCompletion(
  messages: ChatMessage[] | OpenRouterMessage[],
  options?: ChatCompletionOptions
): Promise<AssistantChatMessage>

async getChatCompletion(
  messages: ChatMessage[] | OpenRouterMessage[],
  options?: ChatCompletionOptions
): Promise<AssistantChatMessage>
```

**Parameters:**
- `messages`: Array of chat messages. Can include:
  - `{ role: "system", content: string }`
  - `{ role: "user", content: string }`
  - `{ role: "assistant", content: string }`
- `options` (optional): Configuration object with:
  - `model?: string` - Model name (defaults to constructor default)
  - `temperature?: number` - Sampling temperature (0-2)
  - `max_tokens?: number` - Maximum tokens in response
  - `top_p?: number` - Nucleus sampling parameter
  - `frequency_penalty?: number` - Frequency penalty (-2.0 to 2.0)
  - `presence_penalty?: number` - Presence penalty (-2.0 to 2.0)
  - `response_format?: ResponseFormat` - JSON schema configuration
  - `stream?: boolean` - Enable streaming (future enhancement)

**Returns:** `AssistantChatMessage` with `role: "assistant"` and `content: string`

**Throws:** `OpenRouterError` on API failures

**Example:**
```typescript
const messages = [
  { role: "system", content: "You are a helpful assistant." },
  { role: "user", content: "What is the capital of France?" }
];

const response = await OpenRouterService.getChatCompletion(messages, {
  model: "anthropic/claude-3.5-sonnet",
  temperature: 0.7,
  max_tokens: 150
});
```

### 3.2 `sendChatCompletion` (Instance method with full control)

Lower-level method that returns the full API response including metadata.

**Signature:**
```typescript
async sendChatCompletion(
  messages: OpenRouterMessage[],
  options?: ChatCompletionOptions
): Promise<OpenRouterApiResponse>
```

**Returns:** Full API response including `choices`, `usage`, `model`, etc.

### 3.3 Type Definitions

**OpenRouterMessage:**
```typescript
type OpenRouterMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string };
```

**ResponseFormat:**
```typescript
type ResponseFormat =
  | { type: "json_object" }
  | {
      type: "json_schema";
      json_schema: {
        name: string;
        strict: boolean;
        schema: JSONSchema;
      };
    };
```

**ChatCompletionOptions:**
```typescript
type ChatCompletionOptions = {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: ResponseFormat;
  stream?: boolean;
};
```

## 4. Private Methods and Fields

### 4.1 `private apiKey: string`

Stored API key for authentication. Retrieved from constructor or environment variable.

### 4.2 `private baseUrl: string`

Base URL for OpenRouter API endpoints.

### 4.3 `private defaultModel: string`

Default model name used when not specified in method calls.

### 4.4 `private timeout: number`

Request timeout in milliseconds.

### 4.5 `private maxRetries: number`

Maximum retry attempts for failed requests.

### 4.6 `private formatMessagesForOpenRouter(messages: (ChatMessage | OpenRouterMessage)[]): OpenRouterMessage[]`

Converts messages to OpenRouter API format. Handles both `ChatMessage[]` (user/assistant only) and `OpenRouterMessage[]` (includes system role).

**Implementation Notes:**
- Validates message structure
- Preserves system messages as-is
- Converts user and assistant messages
- Ensures proper message ordering

### 4.7 `private buildRequestBody(messages: OpenRouterMessage[], options: ChatCompletionOptions): OpenRouterRequestBody`

Constructs the request body for the API call.

**Implementation Notes:**
- Merges default options with provided options
- Validates parameter ranges (e.g., temperature 0-2)
- Formats response_format correctly for JSON schema

### 4.8 `private buildRequestHeaders(): HeadersInit`

Constructs HTTP headers for the API request.

**Returns:**
- `Authorization: Bearer {apiKey}`
- `Content-Type: application/json`
- Additional headers from `defaultHeaders` config

### 4.9 `private async makeRequest(body: OpenRouterRequestBody, retryCount: number = 0): Promise<Response>`

Makes the actual HTTP request with retry logic and timeout handling.

**Implementation Notes:**
- Implements exponential backoff for retries
- Handles timeout with AbortController
- Retries on network errors and 5xx status codes
- Does not retry on 4xx client errors

### 4.10 `private parseResponse(response: Response): OpenRouterApiResponse`

Parses and validates the API response.

**Implementation Notes:**
- Validates response structure
- Extracts assistant message from choices array
- Handles both regular and streaming responses
- Validates JSON parsing errors

### 4.11 `private handleError(error: unknown, response?: Response): never`

Centralized error handling and conversion to `OpenRouterError`.

**Error Scenarios:**
1. Network errors → 503 status
2. Timeout errors → 504 status
3. Invalid API key → 401 status
4. Rate limit exceeded → 429 status
5. Invalid parameters → 400 status
6. Server errors → 502 status
7. Invalid response format → 502 status

## 5. Error Handling

The service implements comprehensive error handling for various failure scenarios:

### 5.1 Error Scenarios

1. **Missing API Key (500)**
   - **Scenario:** API key not provided in constructor or environment
   - **Detection:** Check during initialization or request time
   - **Response:** Throw `OpenRouterError` with message "OpenRouter API key is not configured"

2. **Invalid API Key (401)**
   - **Scenario:** API key is invalid or expired
   - **Detection:** API returns 401 Unauthorized
   - **Response:** Throw `OpenRouterError` with status code 401

3. **Rate Limit Exceeded (429)**
   - **Scenario:** Too many requests in time window
   - **Detection:** API returns 429 Too Many Requests
   - **Response:** Retry with exponential backoff, eventually throw `OpenRouterError` with 429 status

4. **Invalid Request Parameters (400)**
   - **Scenario:** Invalid model name, parameter out of range, etc.
   - **Detection:** API returns 400 Bad Request with error details
   - **Response:** Extract error message from API response, throw `OpenRouterError` with 400 status

5. **Request Timeout (504)**
   - **Scenario:** Request exceeds timeout duration
   - **Detection:** AbortController timeout
   - **Response:** Throw `OpenRouterError` with status code 504

6. **Network Errors (503)**
   - **Scenario:** Connection failures, DNS errors, etc.
   - **Detection:** Fetch throws network-related errors
   - **Response:** Retry with exponential backoff, eventually throw `OpenRouterError` with 503 status

7. **Server Errors (502)**
   - **Scenario:** OpenRouter API returns 5xx status codes
   - **Detection:** Response status >= 500
   - **Response:** Retry with exponential backoff, eventually throw `OpenRouterError` with original status code

8. **Invalid Response Format (502)**
   - **Scenario:** API response doesn't match expected structure
   - **Detection:** Missing `choices[0].message.content` or invalid structure
   - **Response:** Throw `OpenRouterError` with status code 502 and descriptive message

9. **JSON Parsing Errors (502)**
   - **Scenario:** Response body is not valid JSON
   - **Detection:** `JSON.parse()` throws
   - **Response:** Throw `OpenRouterError` with status code 502

### 5.2 Retry Strategy

**Retry Conditions:**
- Network errors (connection failures)
- 5xx server errors (500, 502, 503, 504)
- 429 rate limit errors

**Retry Logic:**
- Exponential backoff: `delay = baseDelay * Math.pow(2, retryCount)`
- Base delay: 1000ms (1 second)
- Maximum retries: Configurable (default: 3)
- Jitter: Random 0-100ms added to prevent thundering herd

**No Retry:**
- 4xx client errors (except 429)
- Invalid API key (401)
- Invalid parameters (400)

### 5.3 Error Class

```typescript
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}
```

## 6. Security Considerations

### 6.1 API Key Management

1. **Environment Variables**
   - Store API key in `.env` file (not committed to git)
   - Access via `import.meta.env.OPENROUTER_API_KEY`
   - Never log or expose API key in error messages

2. **Runtime Validation**
   - Validate API key presence before making requests
   - Provide clear error messages if missing
   - Do not expose API key in client-side code

3. **Key Rotation**
   - Support dynamic API key updates via constructor
   - Allow key updates without service restart

### 6.2 Input Validation

1. **Message Validation**
   - Validate message structure (role, content)
   - Reject empty content strings
   - Sanitize content to prevent injection (if needed)

2. **Parameter Validation**
   - Validate parameter ranges (temperature: 0-2, etc.)
   - Reject invalid model names
   - Validate JSON schema structure for response_format

3. **Type Safety**
   - Use TypeScript types for all inputs
   - Validate at runtime using Zod schemas (optional but recommended)

### 6.3 Request Security

1. **HTTPS Only**
   - Always use HTTPS for API requests
   - Enforce TLS in production

2. **Headers**
   - Include `HTTP-Referer` and `X-Title` headers for API tracking
   - Never expose sensitive information in headers

3. **Rate Limiting**
   - Implement client-side rate limiting to prevent abuse
   - Monitor API usage and costs

### 6.4 Error Logging

1. **Sensitive Information**
   - Never log API keys in error messages
   - Sanitize error responses before logging
   - Log only necessary debugging information

2. **Error Exposure**
   - Provide user-friendly error messages
   - Do not expose internal implementation details
   - Mask sensitive data in error responses

## 7. Step-by-Step Implementation Plan

### Step 1: Define Type Definitions

Create TypeScript types for all service interfaces:

1. **OpenRouterMessage Types**
   ```typescript
   type OpenRouterMessage =
     | { role: "system"; content: string }
     | { role: "user"; content: string }
     | { role: "assistant"; content: string };
   ```

2. **Response Format Types**
   ```typescript
   type JSONSchema = {
     type: "object" | "array" | "string" | "number" | "boolean";
     properties?: Record<string, JSONSchema>;
     required?: string[];
     items?: JSONSchema;
     // ... other JSON schema properties
   };

   type ResponseFormat =
     | { type: "json_object" }
     | {
         type: "json_schema";
         json_schema: {
           name: string;
           strict: boolean;
           schema: JSONSchema;
         };
       };
   ```

3. **Options and Request Types**
   ```typescript
   type ChatCompletionOptions = {
     model?: string;
     temperature?: number;
     max_tokens?: number;
     top_p?: number;
     frequency_penalty?: number;
     presence_penalty?: number;
     response_format?: ResponseFormat;
     stream?: boolean;
   };

   type OpenRouterRequestBody = {
     model: string;
     messages: OpenRouterMessage[];
     temperature?: number;
     max_tokens?: number;
     top_p?: number;
     frequency_penalty?: number;
     presence_penalty?: number;
     response_format?: ResponseFormat;
     stream?: boolean;
   };
   ```

### Step 2: Implement Constructor and Configuration

1. **Create Service Class**
   ```typescript
   export class OpenRouterService {
     private apiKey: string;
     private baseUrl: string;
     private defaultModel: string;
     private defaultHeaders: Record<string, string>;
     private timeout: number;
     private maxRetries: number;

     constructor(config?: OpenRouterServiceConfig) {
       // Initialize with provided config or defaults
     }
   }
   ```

2. **API Key Resolution**
   - Check constructor parameter first
   - Fall back to `import.meta.env.OPENROUTER_API_KEY`
   - Throw error if not found

3. **Set Default Values**
   - Base URL: `"https://openrouter.ai/api/v1"`
   - Default model: `"anthropic/claude-3.5-sonnet"`
   - Timeout: `30000` (30 seconds)
   - Max retries: `3`

### Step 3: Implement Message Formatting

1. **Message Conversion Method**
   ```typescript
   private formatMessagesForOpenRouter(
     messages: (ChatMessage | OpenRouterMessage)[]
   ): OpenRouterMessage[] {
     // Validate messages array
     // Convert ChatMessage to OpenRouterMessage
     // Preserve system messages
     // Return formatted array
   }
   ```

2. **Validation Logic**
   - Ensure messages is an array
   - Validate each message has `role` and `content`
   - Reject empty content strings
   - Ensure proper message ordering (system first, if present)

### Step 4: Implement Request Body Building

1. **Build Request Body Method**
   ```typescript
   private buildRequestBody(
     messages: OpenRouterMessage[],
     options: ChatCompletionOptions
   ): OpenRouterRequestBody {
     // Merge default model with options
     // Validate parameter ranges
     // Format response_format if provided
     // Return complete request body
   }
   ```

2. **Parameter Validation**
   - Temperature: 0-2 range
   - Max tokens: positive integer
   - Top-p: 0-1 range
   - Frequency/presence penalty: -2.0 to 2.0

3. **Response Format Formatting**
   ```typescript
   // Example: JSON schema response format
   response_format: {
     type: "json_schema",
     json_schema: {
       name: "meal_plan_response",
       strict: true,
       schema: {
         type: "object",
         properties: {
           daily_summary: {
             type: "object",
             properties: {
               kcal: { type: "number" },
               proteins: { type: "number" },
               // ...
             },
             required: ["kcal", "proteins", "fats", "carbs"]
           },
           meals: {
             type: "array",
             items: { /* meal schema */ }
           }
         },
         required: ["daily_summary", "meals"]
       }
     }
   }
   ```

### Step 5: Implement HTTP Request Handling

1. **Request Method with Retry Logic**
   ```typescript
   private async makeRequest(
     body: OpenRouterRequestBody,
     retryCount: number = 0
   ): Promise<Response> {
     // Setup AbortController for timeout
     // Build headers
     // Make fetch request
     // Handle response or retry on failure
   }
   ```

2. **Retry Implementation**
   - Check retry conditions (network errors, 5xx, 429)
   - Calculate exponential backoff delay
   - Wait before retry
   - Increment retry counter
   - Throw error if max retries exceeded

3. **Timeout Handling**
   - Create AbortController
   - Set timeout using setTimeout
   - Abort request on timeout
   - Clear timeout on success

### Step 6: Implement Response Parsing

1. **Parse Response Method**
   ```typescript
   private parseResponse(response: Response): OpenRouterApiResponse {
     // Parse JSON
     // Validate response structure
     // Extract choices array
     // Return parsed response
   }
   ```

2. **Validation Checks**
   - Response is valid JSON
   - Response has `choices` array
   - Choices array is not empty
   - First choice has `message` object
   - Message has `role: "assistant"` and `content` string

### Step 7: Implement Error Handling

1. **Error Handler Method**
   ```typescript
   private handleError(error: unknown, response?: Response): never {
     // Identify error type
     // Extract status code
     // Create appropriate OpenRouterError
     // Throw error
   }
   ```

2. **Error Type Detection**
   - Check for AbortError (timeout)
   - Check response status code
   - Parse error message from API response
   - Map status codes to error types

### Step 8: Implement Public Methods

1. **Static getChatCompletion**
   ```typescript
   static async getChatCompletion(
     messages: (ChatMessage | OpenRouterMessage)[],
     options?: ChatCompletionOptions
   ): Promise<AssistantChatMessage> {
     // Use default static instance
     // Format messages
     // Build request body
     // Make request with retry
     // Parse response
     // Extract and return assistant message
   }
   ```

2. **Instance getChatCompletion**
   ```typescript
   async getChatCompletion(
     messages: (ChatMessage | OpenRouterMessage)[],
     options?: ChatCompletionOptions
   ): Promise<AssistantChatMessage> {
     // Same logic as static, using instance config
   }
   ```

3. **Instance sendChatCompletion**
   ```typescript
   async sendChatCompletion(
     messages: OpenRouterMessage[],
     options?: ChatCompletionOptions
   ): Promise<OpenRouterApiResponse> {
     // Returns full API response with metadata
   }
   ```

### Step 9: Implement System Message Support

1. **System Message Handling**
   - System messages are supported natively by OpenRouter API
   - Store system message in messages array with `role: "system"`
   - System message should be first in array
   - Example:
     ```typescript
     const messages = [
       {
         role: "system",
         content: "You are a helpful dietitian assistant..."
       },
       {
         role: "user",
         content: "Create a meal plan for me..."
       }
     ];
     ```

### Step 10: Implement User Message Support

1. **User Message Handling**
   - User messages use `role: "user"`
   - Content can be any string
   - Multiple user messages allowed in conversation
   - Example:
     ```typescript
     {
       role: "user",
       content: "What are the nutritional benefits?"
     }
     ```

### Step 11: Implement JSON Schema Response Format

1. **JSON Schema Structure**
   ```typescript
   const responseFormat: ResponseFormat = {
     type: "json_schema",
     json_schema: {
       name: "meal_plan_response",
       strict: true,
       schema: {
         type: "object",
         properties: {
           daily_summary: {
             type: "object",
             properties: {
               kcal: { type: "number" },
               proteins: { type: "number" },
               fats: { type: "number" },
               carbs: { type: "number" }
             },
             required: ["kcal", "proteins", "fats", "carbs"]
           },
           meals: {
             type: "array",
             items: {
               type: "object",
               properties: {
                 name: { type: "string" },
                 ingredients: { type: "string" },
                 preparation: { type: "string" },
                 summary: {
                   type: "object",
                   properties: {
                     kcal: { type: "number" },
                     protein: { type: "number" },
                     fat: { type: "number" },
                     carb: { type: "number" }
                   },
                   required: ["kcal", "protein", "fat", "carb"]
                 }
               },
               required: ["name", "ingredients", "preparation", "summary"]
             }
           }
         },
         required: ["daily_summary", "meals"]
       }
     }
   };
   ```

2. **Usage Example**
   ```typescript
   const response = await OpenRouterService.getChatCompletion(messages, {
     model: "anthropic/claude-3.5-sonnet",
     response_format: responseFormat,
     temperature: 0.7
   });

   // Response content will be valid JSON matching the schema
   const mealPlan = JSON.parse(response.content);
   ```

### Step 12: Implement Model Configuration

1. **Model Name Parameter**
   - Accept model name in options parameter
   - Default to constructor's defaultModel
   - Validate model name format (e.g., "provider/model-name")
   - Example models:
     - `"anthropic/claude-3.5-sonnet"`
     - `"openai/gpt-4o"`
     - `"google/gemini-pro-1.5"`

2. **Model Selection**
   ```typescript
   const options: ChatCompletionOptions = {
     model: "anthropic/claude-3.5-sonnet", // Override default
   };
   ```

### Step 13: Implement Model Parameters

1. **Temperature (0-2)**
   - Controls randomness in output
   - Lower = more deterministic, Higher = more creative
   - Example: `temperature: 0.7`

2. **Max Tokens (positive integer)**
   - Maximum length of response
   - Example: `max_tokens: 2000`

3. **Top-p (0-1)**
   - Nucleus sampling parameter
   - Example: `top_p: 0.9`

4. **Frequency Penalty (-2.0 to 2.0)**
   - Reduces repetition of tokens
   - Example: `frequency_penalty: 0.5`

5. **Presence Penalty (-2.0 to 2.0)**
   - Encourages new topics
   - Example: `presence_penalty: 0.3`

6. **Complete Example**
   ```typescript
   const options: ChatCompletionOptions = {
     model: "anthropic/claude-3.5-sonnet",
     temperature: 0.7,
     max_tokens: 2000,
     top_p: 0.9,
     frequency_penalty: 0.5,
     presence_penalty: 0.3,
     response_format: {
       type: "json_schema",
       json_schema: {
         name: "meal_plan_response",
         strict: true,
         schema: { /* schema definition */ }
       }
     }
   };
   ```

### Step 14: Testing and Validation

1. **Unit Tests**
   - Test message formatting
   - Test parameter validation
   - Test error handling
   - Test retry logic

2. **Integration Tests**
   - Test successful API calls
   - Test error scenarios
   - Test JSON schema responses
   - Test timeout handling

3. **Type Checking**
   - Ensure all types are properly defined
   - Verify TypeScript compilation passes
   - Check for any `any` types

### Step 15: Documentation and Examples

1. **JSDoc Comments**
   - Document all public methods
   - Include parameter descriptions
   - Include return types
   - Include examples

2. **Usage Examples**
   - Basic chat completion
   - With system message
   - With JSON schema
   - With custom parameters
   - Error handling examples

## Implementation Examples

### Example 1: Basic Chat Completion

```typescript
import { OpenRouterService } from "./lib/ai/openrouter.service.ts";

const messages = [
  { role: "user", content: "What is the capital of France?" }
];

const response = await OpenRouterService.getChatCompletion(messages);
console.log(response.content); // "The capital of France is Paris."
```

### Example 2: System Message with User Prompt

```typescript
const messages = [
  {
    role: "system",
    content: "You are a helpful dietitian assistant. Generate meal plans based on user requirements."
  },
  {
    role: "user",
    content: "Create a 2000 kcal meal plan for a 30-year-old active male."
  }
];

const response = await OpenRouterService.getChatCompletion(messages, {
  model: "anthropic/claude-3.5-sonnet",
  temperature: 0.7
});
```

### Example 3: JSON Schema Response Format

```typescript
const jsonSchema: JSONSchema = {
  type: "object",
  properties: {
    answer: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 }
  },
  required: ["answer", "confidence"]
};

const responseFormat: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "qa_response",
    strict: true,
    schema: jsonSchema
  }
};

const messages = [
  { role: "user", content: "What is 2+2? Respond in JSON format." }
];

const response = await OpenRouterService.getChatCompletion(messages, {
  response_format: responseFormat,
  temperature: 0.3 // Lower temperature for more structured output
});

const parsed = JSON.parse(response.content);
console.log(parsed.answer); // "4"
console.log(parsed.confidence); // 0.99
```

### Example 4: Full Configuration with All Parameters

```typescript
const messages = [
  {
    role: "system",
    content: "You are a nutrition expert."
  },
  {
    role: "user",
    content: "Explain the benefits of a Mediterranean diet."
  }
];

const response = await OpenRouterService.getChatCompletion(messages, {
  model: "anthropic/claude-3.5-sonnet",
  temperature: 0.8,
  max_tokens: 500,
  top_p: 0.95,
  frequency_penalty: 0.3,
  presence_penalty: 0.2
});
```

### Example 5: Error Handling

```typescript
import { OpenRouterService, OpenRouterError } from "./lib/ai/openrouter.service.ts";

try {
  const response = await OpenRouterService.getChatCompletion(messages, {
    model: "invalid-model-name"
  });
} catch (error) {
  if (error instanceof OpenRouterError) {
    switch (error.statusCode) {
      case 401:
        console.error("Invalid API key");
        break;
      case 429:
        console.error("Rate limit exceeded. Please try again later.");
        break;
      case 400:
        console.error("Invalid request:", error.message);
        break;
      default:
        console.error("API error:", error.message);
    }
  } else {
    console.error("Unexpected error:", error);
  }
}
```

### Example 6: Instance-Based Usage with Custom Configuration

```typescript
const service = new OpenRouterService({
  apiKey: "sk-or-v1-custom-key",
  defaultModel: "openai/gpt-4o",
  timeout: 60000,
  maxRetries: 5,
  defaultHeaders: {
    "HTTP-Referer": "https://myapp.com",
    "X-Title": "Diet Planner App"
  }
});

const response = await service.getChatCompletion(messages, {
  temperature: 0.9
});
```

## Integration with Existing Codebase

### Updating AiSessionService

The existing `AiSessionService` can be updated to use the enhanced OpenRouter service:

```typescript
// In session.service.ts
const assistantResponse = await OpenRouterService.getChatCompletion(
  messagesForOpenRouter,
  {
    model: "anthropic/claude-3.5-sonnet",
    temperature: 0.7,
    max_tokens: 2000,
    // Add response_format if structured output needed
  }
);
```

### Migration Path

1. **Phase 1:** Implement new service alongside existing
2. **Phase 2:** Update AiSessionService to use new methods
3. **Phase 3:** Add new features (JSON schema, parameters)
4. **Phase 4:** Remove old static methods (if desired)

## Conclusion

This implementation plan provides a comprehensive guide for building a robust OpenRouter service that supports:

- System and user messages
- Structured responses via JSON schema
- Configurable model selection
- Model parameters (temperature, max_tokens, etc.)
- Comprehensive error handling with retries
- Security best practices
- Type-safe TypeScript implementation

The service follows the existing codebase patterns while extending functionality to meet the full requirements of the OpenRouter API.

