import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types.ts";
import type {
  AssistantChatMessage,
  ChatMessage,
  CreateAiSessionCommand,
  CreateAiSessionResponseDto,
  UserChatMessage,
} from "../../types.ts";
import { OpenRouterError, OpenRouterService } from "./openrouter.service.ts";

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
}
