import { parseXmlMealPlan } from "./meal-plan-parser";
import type {
  ChatMessage,
  AssistantChatMessage,
  MealPlanStartupData,
  MealPlanMeal,
  MealPlanContentDailySummary,
} from "../../types";

/**
 * State bridge interface for passing data to editor view.
 */
export interface StateBridge {
  sessionId: string;
  lastAssistantMessage: string;
  startupData?: MealPlanStartupData;
}

/**
 * Parsed meal plan structure.
 */
export interface ParsedMealPlan {
  meals: MealPlanMeal[];
  dailySummary: MealPlanContentDailySummary;
}

/**
 * Validation result for chat message input.
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Extracts and validates meal plan from message history.
 * Returns the parsed meal plan from the last assistant message, or null if not found/invalid.
 */
export function extractCurrentMealPlan(messageHistory: ChatMessage[]): ParsedMealPlan | null {
  const lastAssistantMessage = messageHistory
    .filter((msg): msg is AssistantChatMessage => msg.role === "assistant")
    .pop();

  if (!lastAssistantMessage) {
    return null;
  }

  try {
    const parsed = parseXmlMealPlan(lastAssistantMessage.content);
    // Only return if we actually found meals (not the fallback empty structure)
    if (
      parsed.meals.length > 0 &&
      parsed.meals[0].name !== "" &&
      parsed.meals[0].preparation !== lastAssistantMessage.content
    ) {
      return parsed;
    }
  } catch (error) {
    console.error("Failed to parse meal plan:", error);
  }

  return null;
}

/**
 * Validates chat message input.
 */
export function validateChatMessage(input: string, maxLength: number): ValidationResult {
  const trimmedMessage = input.trim();

  if (!trimmedMessage) {
    return { valid: false, error: "Message cannot be empty." };
  }

  if (trimmedMessage.length > maxLength) {
    return { valid: false, error: "Message too long. Please shorten your message." };
  }

  return { valid: true };
}

/**
 * Creates state bridge for navigation to editor.
 */
export function createStateBridge(
  sessionId: string,
  messageHistory: ChatMessage[],
  startupData?: MealPlanStartupData | null
): StateBridge | null {
  const lastAssistantMessage = messageHistory
    .filter((msg): msg is AssistantChatMessage => msg.role === "assistant")
    .pop();

  if (!lastAssistantMessage) {
    return null;
  }

  return {
    sessionId,
    lastAssistantMessage: lastAssistantMessage.content,
    startupData: startupData || undefined,
  };
}

/**
 * Extracts user-friendly error message from API response.
 */
export async function getChatErrorMessage(response: Response, defaultMessage: string): Promise<string> {
  if (response.status === 401) {
    return "Unauthorized";
  }

  if (response.status === 404) {
    return "Session not found. Please start a new meal plan from the dashboard.";
  }

  if (response.status === 502) {
    return "AI service is temporarily unavailable. Please try again in a moment.";
  }

  if (response.status === 500) {
    return "An internal error occurred. Please try again later.";
  }

  try {
    const errorData = await response.json();
    // Ensure error is a string, not an object
    if (errorData.error && typeof errorData.error === "string") {
      return errorData.error;
    }
    return defaultMessage;
  } catch {
    return defaultMessage;
  }
}
