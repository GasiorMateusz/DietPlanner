import { parseJsonMealPlan, parseJsonMultiDayPlan } from "./meal-plan-parser";
import type {
  ChatMessage,
  AssistantChatMessage,
  MealPlanStartupData,
  MealPlanMeal,
  MealPlanContentDailySummary,
  MultiDayPlanChatData,
} from "../../types";

/**
 * State bridge interface for passing data to editor view.
 */
export interface StateBridge {
  sessionId: string;
  lastAssistantMessage: string;
  startupData?: MealPlanStartupData;
  planName?: string;
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
    const parsed = parseJsonMealPlan(lastAssistantMessage.content);
    // Only return if we actually found meals (validation ensures non-empty array)
    if (parsed.meals.length > 0 && parsed.meals[0].name !== "") {
      return parsed;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to parse meal plan:", error);
  }

  return null;
}

export function extractCurrentMultiDayPlan(messageHistory: ChatMessage[]): MultiDayPlanChatData | null {
  const lastAssistantMessage = messageHistory
    .filter((msg): msg is AssistantChatMessage => msg.role === "assistant")
    .pop();

  if (!lastAssistantMessage) {
    // eslint-disable-next-line no-console
    console.log("[extractCurrentMultiDayPlan] No assistant message found");
    return null;
  }

  try {
    // eslint-disable-next-line no-console
    console.log("[extractCurrentMultiDayPlan] Parsing message, length:", lastAssistantMessage.content.length);
    const parsed = parseJsonMultiDayPlan(lastAssistantMessage.content);

    // eslint-disable-next-line no-console
    console.log("[extractCurrentMultiDayPlan] Parsed successfully:", {
      days_count: parsed.days.length,
      day_numbers: parsed.days.map((d) => d.day_number),
      summary_number_of_days: parsed.summary.number_of_days,
    });

    if (parsed.days.length > 0 && parsed.days[0].plan_content.meals.length > 0) {
      // eslint-disable-next-line no-console
      console.log("[extractCurrentMultiDayPlan] Returning valid multi-day plan");
      return {
        days: parsed.days,
        summary: parsed.summary,
      };
    } else {
      // eslint-disable-next-line no-console
      console.warn("[extractCurrentMultiDayPlan] Parsed but invalid - no days or no meals");
    }
  } catch (error) {
    // Log the error and the first 500 chars of the message for debugging
    const messagePreview = lastAssistantMessage.content.substring(0, 500);
    // eslint-disable-next-line no-console
    console.error("[extractCurrentMultiDayPlan] Failed to parse multi-day meal plan:", error);
    // eslint-disable-next-line no-console
    console.debug("[extractCurrentMultiDayPlan] Message preview:", messagePreview);
    // Check if it might be a single-day plan format instead
    if (
      lastAssistantMessage.content.includes('"meal_plan"') &&
      !lastAssistantMessage.content.includes('"multi_day_plan"')
    ) {
      // eslint-disable-next-line no-console
      console.warn(
        "[extractCurrentMultiDayPlan] AI returned single-day format instead of multi-day format. Please create a new session."
      );
    }
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
