import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from './database.types';

// =================================================================
//   1. JSON BLOB DEFINITIONS
// =================================================================
// These types define the specific structure of data stored in 'Json' columns.

/**
 * Defines the structure for the `target_macro_distribution` JSON blob.
 * e.g., { "p_perc": 30, "f_perc": 25, "c_perc": 45 }
 */
export type TargetMacroDistribution = {
  p_perc: number;
  f_perc: number;
  c_perc: number;
};

/**
 * Defines the structure for the `daily_summary` object within `plan_content`.
 */
export type MealPlanContentDailySummary = {
  kcal: number;
  proteins: number;
  fats: number;
  carbs: number;
};

/**
 * Defines the structure for a single meal within the `plan_content.meals` array.
 */
export type MealPlanMeal = {
  name: string;
  ingredients: string;
  preparation: string;
  summary: {
    kcal: number;
    p: number;
    f: number;
    c: number;
  };
};

/**
 * Defines the full structure for the `plan_content` JSON blob in `meal_plans`.
 */
export type MealPlanContent = {
  daily_summary: MealPlanContentDailySummary;
  meals: MealPlanMeal[];
};

/**
 * Defines the message structure for a user prompt.
 */
export type UserChatMessage = {
  role: 'user';
  content: string;
};

/**
 * Defines the message structure for an assistant response.
 */
export type AssistantChatMessage = {
  role: 'assistant';
  content: string;
};

/**
 * Union type representing any message in a chat history.
 * Used to type the `message_history` JSON blob in `ai_chat_sessions`.
 */
export type ChatMessage = UserChatMessage | AssistantChatMessage;

// =================================================================
//   2. AUGMENTED DATABASE TYPES
// =================================================================
// These types override the generic 'Json' fields from the auto-generated
// Supabase types with our specific structures defined above.

/**
 * Strongly-typed version of the `meal_plans` table Row.
 * Overrides `plan_content` and `target_macro_distribution` from `Json`
 * to their specific types.
 */
export type TypedMealPlanRow = Omit<
  Tables<'meal_plans'>,
  'plan_content' | 'target_macro_distribution'
> & {
  plan_content: MealPlanContent;
  target_macro_distribution: TargetMacroDistribution | null;
};

/**
 * Strongly-typed version of the `meal_plans` table Insert.
 */
export type TypedMealPlanInsert = Omit<
  TablesInsert<'meal_plans'>,
  'plan_content' | 'target_macro_distribution'
> & {
  plan_content: MealPlanContent;
  target_macro_distribution?: TargetMacroDistribution | null;
};

/**
 * Strongly-typed version of the `meal_plans` table Update.
 */
export type TypedMealPlanUpdate = Omit<
  TablesUpdate<'meal_plans'>,
  'plan_content' | 'target_macro_distribution'
> & {
  plan_content?: MealPlanContent;
  target_macro_distribution?: TargetMacroDistribution | null;
};

/**
 * Strongly-typed version of the `ai_chat_sessions` table Row.
 * Overrides `message_history` from `Json` to `ChatMessage[]`.
 */
export type TypedAiChatSessionRow = Omit<
  Tables<'ai_chat_sessions'>,
  'message_history'
> & {
  message_history: ChatMessage[] | null;
};

// =================================================================
//   3. HELPER & COMMON DTO TYPES
// =================================================================

/**
 * Represents the common "startup data" form used to initiate an
 * AI session and to be displayed on a meal plan.
 * Derived from the flat `meal_plans` table row.
 */
export type MealPlanStartupData = Pick<
  TypedMealPlanRow,
  | 'patient_age'
  | 'patient_weight'
  | 'patient_height'
  | 'activity_level'
  | 'target_kcal'
  | 'target_macro_distribution'
  | 'meal_names'
  | 'exclusions_guidelines'
>;

// =================================================================
//   4. API DTO & COMMAND MODELS
// =================================================================

// --- Meal Plans ---

/**
 * **DTO**: Represents a single meal plan item in the list.
 * @Endpoint `GET /api/meal-plans` (Array Item)
 */
export type MealPlanListItemDto = Pick<
  TypedMealPlanRow,
  'id' | 'name' | 'created_at' | 'updated_at'
> & {
  /**
   * The grouped startup data used to generate the plan.
   */
  startup_data: MealPlanStartupData;
  /**
   * The daily summary, extracted from `plan_content` for easy access.
   */
  daily_summary: MealPlanContentDailySummary;
};

/**
 * **DTO**: The response for the meal plan list endpoint.
 * @Endpoint `GET /api/meal-plans`
 */
export type GetMealPlansResponseDto = MealPlanListItemDto[];

/**
 * **Command**: The request payload for creating a new meal plan.
 * This nested structure is flattened by the backend into a `meal_plans` row.
 * @Endpoint `POST /api/meal-plans`
 */
export type CreateMealPlanCommand = Pick<
  TypedMealPlanInsert,
  'source_chat_session_id' | 'name'
> & {
  /**
   * The full JSON content of the meal plan.
   */
  plan_content: MealPlanContent;
  /**
   * The startup data used to generate this plan.
   */
  startup_data: MealPlanStartupData;
};

/**
 * **DTO**: The response after creating a new meal plan.
 * Returns the complete, flat database row.
 * @Endpoint `POST /api/meal-plans`
 */
export type CreateMealPlanResponseDto = TypedMealPlanRow;

/**
 * **DTO**: The response for retrieving a single, complete meal plan.
 * @Endpoint `GET /api/meal-plans/{id}`
 */
export type GetMealPlanByIdResponseDto = TypedMealPlanRow;

/**
 * **Command**: The request payload for updating an existing meal plan.
 * This type allows any field from the `Update` type to be sent.
 * @Endpoint `PUT /api/meal-plans/{id}`
 */
export type UpdateMealPlanCommand = TypedMealPlanUpdate;

/**
 * **DTO**: The response after updating a meal plan.
 * Returns the complete, updated database row.
 * @Endpoint `PUT /api/meal-plans/{id}`
 */
export type UpdateMealPlanResponseDto = TypedMealPlanRow;

// --- AI Chat Sessions ---

/**
 * **Command**: The request payload for initiating a new AI chat session.
 * @Endpoint `POST /api/ai/sessions`
 */
export type CreateAiSessionCommand = MealPlanStartupData;

/**
 * **DTO**: The response after initiating a new AI chat session.
 * Includes the session ID and the first assistant message.
 * @Endpoint `POST /api/ai/sessions`
 */
export type CreateAiSessionResponseDto = {
  session_id: Tables<'ai_chat_sessions'>['id'];
  message: AssistantChatMessage;
  prompt_count: Tables<'ai_chat_sessions'>['final_prompt_count'];
};

/**
 * **Command**: The request payload for sending a follow-up message.
 * @Endpoint `POST /api/ai/sessions/{id}/message`
 */
export type SendAiMessageCommand = {
  message: UserChatMessage;
};

/**
 * **DTO**: The response after sending a follow-up message.
 * Includes the session ID and the new assistant response.
 * @Endpoint `POST /api/ai/sessions/{id}/message`
 */
export type SendAiMessageResponseDto = {
  session_id: Tables<'ai_chat_sessions'>['id'];
  message: AssistantChatMessage;
  prompt_count: Tables<'ai_chat_sessions'>['final_prompt_count'];
};
