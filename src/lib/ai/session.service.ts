import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types.ts";
import type {
  ChatMessage,
  CreateAiSessionCommand,
  CreateAiSessionResponseDto,
  SendAiMessageCommand,
  SendAiMessageResponseDto,
  UserChatMessage,
} from "../../types.ts";
import { NotFoundError } from "../../lib/errors.ts";
import { OpenRouterService } from "./openrouter.service.ts";

/**
 * Formats the meal plan startup data into a system prompt for the AI.
 * The system prompt defines the AI's role and behavior.
 */
function formatSystemPrompt(): string {
  return `You are a helpful dietitian assistant. Your only task is to generate meal plans based on the provided patient information and dietary guidelines. You must:

1. Create a detailed 1-day meal plan that meets the specified nutritional targets
2. Include all requested meals with detailed ingredients and preparation instructions
3. Respect all dietary exclusions and guidelines provided
4. Calculate and match the target calorie and macro distribution as closely as possible
5. Format your response in a clear, structured manner suitable for a professional meal plan document

Focus solely on creating accurate, practical meal plans. Do not deviate from this task.`;
}

/**
 * Formats the meal plan startup data into an initial user prompt.
 * This prompt communicates the patient's requirements to the AI.
 */
function formatUserPrompt(command: CreateAiSessionCommand): string {
  const parts: string[] = [];

  parts.push("Please create a 1-day meal plan with the following specifications:\n");

  // Patient demographics
  if (command.patient_age) {
    parts.push(`- Patient age: ${command.patient_age} years`);
  }
  if (command.patient_weight) {
    parts.push(`- Patient weight: ${command.patient_weight} kg`);
  }
  if (command.patient_height) {
    parts.push(`- Patient height: ${command.patient_height} cm`);
  }

  // Activity level
  if (command.activity_level) {
    parts.push(`- Activity level: ${command.activity_level}`);
  }

  // Nutritional targets
  if (command.target_kcal) {
    parts.push(`- Target calories: ${command.target_kcal} kcal per day`);
  }

  // Macro distribution
  if (command.target_macro_distribution) {
    const { p_perc, f_perc, c_perc } = command.target_macro_distribution;
    parts.push(`- Target macro distribution: Protein ${p_perc}%, Fat ${f_perc}%, Carbohydrates ${c_perc}%`);
  }

  // Meal names
  if (command.meal_names) {
    parts.push(`- Meals to include: ${command.meal_names}`);
  }

  // Exclusions and guidelines
  if (command.exclusions_guidelines) {
    parts.push(`- Dietary exclusions and guidelines: ${command.exclusions_guidelines}`);
  }

  parts.push(
    "\nPlease provide a detailed meal plan with ingredients, preparation instructions, and nutritional breakdown for each meal."
  );

  return parts.join("\n");
}

/**
 * Converts message history from database format to OpenRouter API format.
 * Detects [SYSTEM] prefix in the first user message and converts it to a system role.
 * @param history - The message history from the database
 * @returns Messages formatted for OpenRouter API
 */
function convertHistoryForOpenRouter(
  history: ChatMessage[]
): (
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string }
)[] {
  if (history.length === 0) {
    return [];
  }

  const openRouterMessages: (
    | { role: "system"; content: string }
    | { role: "user"; content: string }
    | { role: "assistant"; content: string }
  )[] = [];

  // Check if the first message is a system message (has [SYSTEM] prefix)
  const firstMessage = history[0];
  if (firstMessage.role === "user" && firstMessage.content.startsWith("[SYSTEM] ")) {
    // Extract system content (remove [SYSTEM] prefix)
    const systemContent = firstMessage.content.slice(9); // "[SYSTEM] ".length = 9
    openRouterMessages.push({
      role: "system",
      content: systemContent,
    });

    // Process remaining messages
    for (let i = 1; i < history.length; i++) {
      const msg = history[i];
      openRouterMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  } else {
    // No system message, convert all messages as-is
    for (const msg of history) {
      openRouterMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  return openRouterMessages;
}

/**
 * Service for managing AI chat sessions.
 * Handles session creation, prompt formatting, and database operations.
 */
export class AiSessionService {
  /**
   * Creates a new AI chat session with an initial prompt and AI response.
   * @param command - The startup data for the meal plan generation
   * @param userId - The authenticated user's ID
   * @param supabase - The Supabase client instance
   * @returns The created session response with session ID, message, and prompt count
   * @throws {OpenRouterError} If the OpenRouter API call fails
   * @throws {Error} If the database operation fails
   */
  static async createSession(
    command: CreateAiSessionCommand,
    userId: string,
    supabase: SupabaseClient<Database>
  ): Promise<CreateAiSessionResponseDto> {
    // Generate UUID for the new session
    const newSessionId = crypto.randomUUID();

    // Format prompts
    const systemPromptContent = formatSystemPrompt();
    const userPromptContent = formatUserPrompt(command);

    // Create messages for OpenRouter API
    // OpenRouter supports 'system' role
    const messagesForOpenRouter = [
      {
        role: "system" as const,
        content: systemPromptContent,
      },
      {
        role: "user" as const,
        content: userPromptContent,
      },
    ];

    // Call OpenRouter API
    const assistantResponse = await OpenRouterService.getChatCompletion(messagesForOpenRouter);

    // Build message history for database storage
    // Store system, user, assistant for telemetry
    // Since ChatMessage type doesn't support 'system', store it as a user message
    // with special content that can be identified
    const systemMessage: UserChatMessage = {
      role: "user",
      content: `[SYSTEM] ${systemPromptContent}`,
    };
    const userPrompt: UserChatMessage = {
      role: "user",
      content: userPromptContent,
    };
    const messageHistory: ChatMessage[] = [systemMessage, userPrompt, assistantResponse];

    // Prepare database record
    const newSessionRecord = {
      id: newSessionId,
      user_id: userId,
      message_history: messageHistory,
      final_prompt_count: 1,
    };

    // Insert into database
    const { error: insertError } = await supabase.from("ai_chat_sessions").insert(newSessionRecord);

    if (insertError) {
      // Log the error for debugging
      console.error("Database insert error:", insertError);
      throw new Error(`Database operation failed: ${insertError.message}`);
    }

    // Build and return response DTO
    const responseDto: CreateAiSessionResponseDto = {
      session_id: newSessionId,
      message: assistantResponse,
      prompt_count: 1,
    };

    return responseDto;
  }

  /**
   * Sends a follow-up message to an existing AI chat session.
   * Retrieves the session, appends the user message, calls OpenRouter,
   * updates the database with the new message history and incremented prompt count.
   * @param sessionId - The UUID of the existing AI chat session
   * @param command - The user message to send
   * @param userId - The authenticated user's ID
   * @param supabase - The Supabase client instance
   * @returns The response with session ID, assistant message, and updated prompt count
   * @throws {NotFoundError} If the session doesn't exist or doesn't belong to the user
   * @throws {OpenRouterError} If the OpenRouter API call fails
   * @throws {Error} If the database operation fails
   */
  static async sendMessage(
    sessionId: string,
    command: SendAiMessageCommand,
    userId: string,
    supabase: SupabaseClient<Database>
  ): Promise<SendAiMessageResponseDto> {
    // Query session by ID (RLS will enforce user ownership)
    const { data: session, error: queryError } = await supabase
      .from("ai_chat_sessions")
      .select("id, message_history, final_prompt_count")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (queryError || !session) {
      throw new NotFoundError("Chat session not found");
    }

    // Extract existing message history
    const existingHistory: ChatMessage[] = (session.message_history as ChatMessage[]) || [];

    // Append user message to history
    const updatedHistory: ChatMessage[] = [...existingHistory, command.message];

    // Convert history for OpenRouter (handles [SYSTEM] prefix conversion)
    const messagesForOpenRouter = convertHistoryForOpenRouter(updatedHistory);

    // Call OpenRouter API
    const assistantResponse = await OpenRouterService.getChatCompletion(messagesForOpenRouter);

    // Append assistant response to history
    const finalHistory: ChatMessage[] = [...updatedHistory, assistantResponse];

    // Increment prompt count
    const newPromptCount = (session.final_prompt_count || 0) + 1;

    // Update database record
    const { error: updateError } = await supabase
      .from("ai_chat_sessions")
      .update({
        message_history: finalHistory,
        final_prompt_count: newPromptCount,
      })
      .eq("id", sessionId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("Database update error:", updateError);
      throw new Error(`Database operation failed: ${updateError.message}`);
    }

    // Build and return response DTO
    const responseDto: SendAiMessageResponseDto = {
      session_id: sessionId,
      message: assistantResponse,
      prompt_count: newPromptCount,
    };

    return responseDto;
  }
}
