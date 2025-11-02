import type { AssistantChatMessage, ChatMessage } from "../../types.ts";

/**
 * Custom error class for OpenRouter API failures.
 * Used to distinguish OpenRouter errors from other errors in error handling.
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
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
 * Configuration for the OpenRouter API call.
 */
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "anthropic/claude-3.5-sonnet"; // Default model - can be made configurable
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds timeout

/**
 * Converts messages to the format expected by OpenRouter API.
 * Handles both ChatMessage[] (user/assistant) and OpenRouterMessage[] (includes system).
 */
function formatMessagesForOpenRouter(messages: (ChatMessage | OpenRouterMessage)[]): OpenRouterMessage[] {
  return messages.map((msg) => {
    // If it's already an OpenRouterMessage with system role, return as-is
    if ("role" in msg && msg.role === "system") {
      return msg as OpenRouterMessage;
    }
    // Otherwise, cast ChatMessage to OpenRouterMessage (user or assistant)
    return msg as OpenRouterMessage;
  });
}

/**
 * Service for interacting with the OpenRouter.ai API.
 * Handles chat completion requests and error handling.
 */
export class OpenRouterService {
  /**
   * Sends a chat completion request to OpenRouter.ai.
   * @param messages - The conversation history (can include system, user, and assistant messages)
   * @returns The assistant's response message
   * @throws {OpenRouterError} If the API call fails or returns an error
   */
  static async getChatCompletion(messages: (ChatMessage | OpenRouterMessage)[]): Promise<AssistantChatMessage> {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new OpenRouterError("OpenRouter API key is not configured", 500);
    }

    const formattedMessages = formatMessagesForOpenRouter(messages);

    const requestBody = {
      model: OPENROUTER_MODEL,
      messages: formattedMessages,
    };

    let response: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new OpenRouterError("Request timeout", 504);
      }
      throw new OpenRouterError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`, 503);
    }

    if (!response.ok) {
      let errorMessage = `OpenRouter API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // Ignore JSON parsing errors, use default error message
      }

      throw new OpenRouterError(errorMessage, response.status);
    }

    let responseData: {
      choices?: {
        message?: {
          role?: string;
          content?: string;
        };
      }[];
    };

    try {
      responseData = await response.json();
    } catch (error) {
      throw new OpenRouterError(
        `Failed to parse OpenRouter response: ${error instanceof Error ? error.message : "Unknown error"}`,
        502
      );
    }

    const assistantMessage = responseData.choices?.[0]?.message;

    if (!assistantMessage || assistantMessage.role !== "assistant" || !assistantMessage.content) {
      throw new OpenRouterError("Invalid response format from OpenRouter API", 502);
    }

    return {
      role: "assistant",
      content: assistantMessage.content,
    };
  }
}
