import type { AssistantChatMessage, ChatMessage } from "../../types.ts";

/**
 * Custom error class for OpenRouter API failures.
 * Used to distinguish OpenRouter errors from other errors in error handling.
 */
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

/**
 * Message format accepted by OpenRouter API (includes system role).
 */
type OpenRouterMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string };

/**
 * JSON Schema definition for structured responses.
 */
interface JSONSchema {
  type: "object" | "array" | "string" | "number" | "boolean";
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  minimum?: number;
  maximum?: number;
}

/**
 * Response format configuration for structured output.
 */
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

/**
 * Configuration options for chat completion requests.
 */
interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: ResponseFormat;
  stream?: boolean;
}

/**
 * Full response structure from OpenRouter API.
 */
interface OpenRouterApiResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Service configuration options.
 */
interface OpenRouterServiceConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Service for interacting with the OpenRouter.ai API.
 * Handles chat completion requests and error handling.
 */
export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private maxRetries: number;

  /**
   * Constructor for OpenRouterService.
   * @param config - Optional configuration for the service
   */
  constructor(config: OpenRouterServiceConfig) {
    // Resolve API key from config or environment
    this.apiKey = config.apiKey;

    if (!this.apiKey) {
      throw new OpenRouterError("OpenRouter API key is not configured", 500);
    }

    // Set default values
    this.baseUrl = config?.baseUrl || "https://openrouter.ai/api/v1";
    // openai/gpt-4.1-nano
    this.defaultModel = config?.defaultModel || "openai/gpt-4.1-nano";
    this.defaultHeaders = config?.defaultHeaders || {};
    this.timeout = config?.timeout || 30000;
    this.maxRetries = config?.maxRetries || 3;
  }

  /**
   * Converts messages to the format expected by OpenRouter API.
   * Handles both ChatMessage[] (user/assistant) and OpenRouterMessage[] (includes system).
   */
  private formatMessagesForOpenRouter(messages: (ChatMessage | OpenRouterMessage)[]): OpenRouterMessage[] {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new OpenRouterError("Messages array must not be empty", 400);
    }

    return messages.map((msg) => {
      // Validate message structure
      if (!msg || typeof msg !== "object" || !("role" in msg) || !("content" in msg)) {
        throw new OpenRouterError("Invalid message format: must have role and content", 400);
      }

      const content = msg.content;
      if (typeof content !== "string" || content.trim().length === 0) {
        throw new OpenRouterError("Message content must be a non-empty string", 400);
      }

      // Return as OpenRouterMessage (system, user, or assistant)
      return msg as OpenRouterMessage;
    });
  }

  /**
   * Builds the request body for the API call with parameter validation.
   */
  private buildRequestBody(messages: OpenRouterMessage[], options?: ChatCompletionOptions): unknown {
    const model = options?.model || this.defaultModel;

    // Validate parameter ranges
    if (options?.temperature !== undefined) {
      if (typeof options.temperature !== "number" || options.temperature < 0 || options.temperature > 2) {
        throw new OpenRouterError("Temperature must be between 0 and 2", 400);
      }
    }

    if (options?.max_tokens !== undefined) {
      if (!Number.isInteger(options.max_tokens) || options.max_tokens <= 0) {
        throw new OpenRouterError("max_tokens must be a positive integer", 400);
      }
    }

    if (options?.top_p !== undefined) {
      if (typeof options.top_p !== "number" || options.top_p < 0 || options.top_p > 1) {
        throw new OpenRouterError("top_p must be between 0 and 1", 400);
      }
    }

    if (options?.frequency_penalty !== undefined) {
      if (
        typeof options.frequency_penalty !== "number" ||
        options.frequency_penalty < -2 ||
        options.frequency_penalty > 2
      ) {
        throw new OpenRouterError("frequency_penalty must be between -2.0 and 2.0", 400);
      }
    }

    if (options?.presence_penalty !== undefined) {
      if (
        typeof options.presence_penalty !== "number" ||
        options.presence_penalty < -2 ||
        options.presence_penalty > 2
      ) {
        throw new OpenRouterError("presence_penalty must be between -2.0 and 2.0", 400);
      }
    }

    // Build request body
    const body: Record<string, unknown> = {
      model,
      messages,
    };

    if (options?.temperature !== undefined) {
      body.temperature = options.temperature;
    }
    if (options?.max_tokens !== undefined) {
      body.max_tokens = options.max_tokens;
    }
    if (options?.top_p !== undefined) {
      body.top_p = options.top_p;
    }
    if (options?.frequency_penalty !== undefined) {
      body.frequency_penalty = options.frequency_penalty;
    }
    if (options?.presence_penalty !== undefined) {
      body.presence_penalty = options.presence_penalty;
    }
    if (options?.response_format !== undefined) {
      body.response_format = options.response_format;
    }
    if (options?.stream !== undefined) {
      body.stream = options.stream;
    }

    return body;
  }

  /**
   * Builds the HTTP headers for the API request.
   */
  private buildRequestHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...this.defaultHeaders,
    };

    return headers;
  }

  /**
   * Makes the HTTP request with retry logic and timeout handling.
   */
  private async makeRequest(body: unknown, retryCount = 0): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.buildRequestHeaders(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if we should retry
      const shouldRetry = this.shouldRetry(response, retryCount);

      if (shouldRetry) {
        const delay = this.calculateRetryDelay(retryCount);
        await this.sleep(delay);
        return this.makeRequest(body, retryCount + 1);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new OpenRouterError("Request timeout", 504, error);
      }

      // Check if we should retry on network error
      const shouldRetry = retryCount < this.maxRetries;
      if (shouldRetry) {
        const delay = this.calculateRetryDelay(retryCount);
        await this.sleep(delay);
        return this.makeRequest(body, retryCount + 1);
      }

      throw new OpenRouterError(
        `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
        503,
        error
      );
    }
  }

  /**
   * Determines if a request should be retried based on the response or retry count.
   */
  private shouldRetry(response: Response, retryCount: number): boolean {
    // Don't retry if we've exceeded max retries
    if (retryCount >= this.maxRetries) {
      return false;
    }

    // Retry on server errors (5xx) and rate limits (429)
    if (response.status >= 500 || response.status === 429) {
      return true;
    }

    return false;
  }

  /**
   * Calculates the exponential backoff delay for retries.
   */
  private calculateRetryDelay(retryCount: number): number {
    const baseDelay = 1000; // 1 second
    const delay = baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 100; // 0-100ms random jitter
    return delay + jitter;
  }

  /**
   * Sleeps for the specified number of milliseconds.
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Sends a chat completion request to OpenRouter.ai (static method).
   * @param apiKey - The OpenRouter API key
   * @param messages - The conversation history (can include system, user, and assistant messages)
   * @param options - Optional configuration for the request
   * @returns The assistant's response message
   * @throws {OpenRouterError} If the API call fails or returns an error
   */
  static async getChatCompletion(
    apiKey: string,
    messages: (ChatMessage | OpenRouterMessage)[],
    options?: ChatCompletionOptions
  ): Promise<AssistantChatMessage> {
    const service = new OpenRouterService({ apiKey });
    return service.getChatCompletion(messages, options);
  }

  /**
   * Sends a chat completion request to OpenRouter.ai (instance method).
   * @param messages - The conversation history (can include system, user, and assistant messages)
   * @param options - Optional configuration for the request
   * @returns The assistant's response message
   * @throws {OpenRouterError} If the API call fails or returns an error
   */
  async getChatCompletion(
    messages: (ChatMessage | OpenRouterMessage)[],
    options?: ChatCompletionOptions
  ): Promise<AssistantChatMessage> {
    const formattedMessages = this.formatMessagesForOpenRouter(messages);
    const apiResponse = await this.sendChatCompletion(formattedMessages, options);
    return {
      role: "assistant",
      content: apiResponse.choices[0].message.content,
    };
  }

  /**
   * Sends a chat completion request and returns the full API response.
   * @param messages - The conversation history
   * @param options - Optional configuration for the request
   * @returns The full API response including metadata
   * @throws {OpenRouterError} If the API call fails or returns an error
   */
  async sendChatCompletion(
    messages: OpenRouterMessage[],
    options?: ChatCompletionOptions
  ): Promise<OpenRouterApiResponse> {
    const body = this.buildRequestBody(messages, options);

    // Make the request with retry logic
    const response = await this.makeRequest(body);

    // Parse the response (only once - cannot be consumed multiple times)
    let responseData: unknown;
    try {
      responseData = await response.json();
    } catch (error) {
      throw new OpenRouterError(
        `Failed to parse OpenRouter response: ${error instanceof Error ? error.message : "Unknown error"}`,
        502,
        error
      );
    }

    // Handle error responses
    if (!response.ok) {
      let errorMessage = `OpenRouter API error: ${response.status} ${response.statusText}`;

      // Try to extract error message from parsed data
      if (responseData && typeof responseData === "object") {
        const errorData = responseData as { error?: { message?: string } };
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      }

      // Provide more helpful error messages for common issues
      if (response.status === 401) {
        if (errorMessage.includes("User not found") || errorMessage.includes("Invalid API key")) {
          errorMessage =
            "OpenRouter API key is invalid or missing. Please check your OPENROUTER_API_KEY environment variable.";
        }
      }

      throw new OpenRouterError(errorMessage, response.status);
    }

    // Validate response structure
    if (!responseData || typeof responseData !== "object") {
      throw new OpenRouterError("Invalid response format from OpenRouter API", 502);
    }

    const parsed = responseData as OpenRouterApiResponse;

    // Validate required fields
    if (!parsed.choices || !Array.isArray(parsed.choices) || parsed.choices.length === 0) {
      throw new OpenRouterError("Invalid response format: missing or empty choices array", 502);
    }

    const message = parsed.choices[0].message;
    if (!message || message.role !== "assistant" || !message.content) {
      throw new OpenRouterError("Invalid response format: invalid assistant message", 502);
    }

    return parsed;
  }
}
