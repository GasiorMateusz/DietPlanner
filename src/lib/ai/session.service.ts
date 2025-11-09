import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json, TablesInsert, TablesUpdate } from "../../db/database.types.ts";
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
  return `You are a helpful dietitian assistant. Your only task is to generate meal plans based on the provided patient information and dietary guidelines.

CRITICAL: You MUST format ALL your responses using the following XML structure. Every response must include these XML tags:

<meal_plan>
  <daily_summary>
    <kcal>total calories per day</kcal>
    <proteins>total proteins in grams</proteins>
    <fats>total fats in grams</fats>
    <carbs>total carbs in grams</carbs>
  </daily_summary>
  <meals>
    <meal>
      <name>Meal name (e.g., Breakfast, Lunch, Dinner)</name>
      <ingredients>Detailed list of ingredients with quantities</ingredients>
      <preparation>Step-by-step preparation instructions</preparation>
      <summary>
        <kcal>calories for this meal</kcal>
        <protein>protein in grams for this meal</protein>
        <fat>fat in grams for this meal</fat>
        <carb>carbohydrates in grams for this meal</carb>
      </summary>
    </meal>
    <!-- Repeat <meal> tag for each meal -->
  </meals>
</meal_plan>

<comments>
Optional: Any additional comments, explanations, or notes that are not part of the meal plan itself. Use this tag for general conversation, clarifications, or additional information you want to share with the user. This content will be displayed in the chat conversation separately from the meal plan.
</comments>

Requirements:
1. Create a detailed 1-day meal plan that meets the specified nutritional targets
2. Include ALL requested meals with detailed ingredients and preparation instructions
3. Respect all dietary exclusions and guidelines provided
4. Calculate and match the target calorie and macro distribution as closely as possible
5. Ensure daily_summary totals match the sum of all meal summaries
6. Use ONLY the XML tags specified above - do not add extra tags or formatting
7. Use the <comments> tag for any general conversation or explanations that should be shown in chat but are not part of the meal plan structure

Focus solely on creating accurate, practical meal plans. Always use the XML structure for every response.`;
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
    "\nIMPORTANT: Format your response using the required XML structure with <meal_plan>, <daily_summary>, <meals>, and <meal> tags as specified in the system instructions. Include all nutritional values in the XML tags."
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
 * Creates a new AI chat session with an initial prompt and AI response.
 * @param command - The startup data for the meal plan generation
 * @param userId - The authenticated user's ID
 * @param supabase - The Supabase client instance
 * @returns The created session response with session ID, message, and prompt count
 * @throws {OpenRouterError} If the OpenRouter API call fails
 * @throws {Error} If the database operation fails
 */
export async function createSession(
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

  // Validate API key before making request
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new OpenRouterError(
      "OpenRouter API key is not configured. Please set OPENROUTER_API_KEY environment variable.",
      500
    );
  }

  // Call OpenRouter API
  const assistantResponse = await OpenRouterService.getChatCompletion(
    apiKey,
    messagesForOpenRouter
  );

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
  const { error: insertError } = await supabase
    .from("ai_chat_sessions")
    .insert(newSessionRecord as unknown as TablesInsert<"ai_chat_sessions">);

  if (insertError) {
    // Log the error for debugging
    // eslint-disable-next-line no-console
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
export async function sendMessage(
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

  const existingHistory: ChatMessage[] = (session.message_history as unknown as ChatMessage[]) || [];

  const updatedHistory: ChatMessage[] = [...existingHistory, command.message];

  // Convert history for OpenRouter (handles [SYSTEM] prefix conversion)
  const messagesForOpenRouter = convertHistoryForOpenRouter(updatedHistory);

  // Validate API key before making request
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new OpenRouterError(
      "OpenRouter API key is not configured. Please set OPENROUTER_API_KEY environment variable.",
      500
    );
  }

  const assistantResponse = await OpenRouterService.getChatCompletion(
    apiKey,
    messagesForOpenRouter
  );

  const finalHistory: ChatMessage[] = [...updatedHistory, assistantResponse];

  const newPromptCount = (session.final_prompt_count || 0) + 1;

  const { error: updateError } = await supabase
    .from("ai_chat_sessions")
    .update({
      message_history: finalHistory as unknown as Json,
      final_prompt_count: newPromptCount,
    } as unknown as TablesUpdate<"ai_chat_sessions">)
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (updateError) {
    // eslint-disable-next-line no-console
    console.error("Database update error:", updateError);
    throw new Error(`Database operation failed: ${updateError.message}`);
  }

  const responseDto: SendAiMessageResponseDto = {
    session_id: sessionId,
    message: assistantResponse,
    prompt_count: newPromptCount,
  };

  return responseDto;
}
