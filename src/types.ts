import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// =================================================================
//   1. JSON BLOB DEFINITIONS
// =================================================================
// These types define the specific structure of data stored in 'Json' columns.

/**
 * Defines the structure for the `target_macro_distribution` JSON blob.
 * e.g., { "p_perc": 30, "f_perc": 25, "c_perc": 45 }
 */
export interface TargetMacroDistribution {
  p_perc: number;
  f_perc: number;
  c_perc: number;
}

/**
 * Defines the structure for the `daily_summary` object within `plan_content`.
 */
export interface MealPlanContentDailySummary {
  kcal: number;
  proteins: number;
  fats: number;
  carbs: number;
}

/**
 * Defines the structure for a single meal within the `plan_content.meals` array.
 */
export interface MealPlanMeal {
  name: string;
  ingredients: string;
  preparation: string;
  summary: {
    kcal: number;
    p: number;
    f: number;
    c: number;
  };
}

/**
 * Defines the full structure for the `plan_content` JSON blob in `meal_plans`.
 */
export interface MealPlanContent {
  daily_summary: MealPlanContentDailySummary;
  meals: MealPlanMeal[];
}

/**
 * Defines the message structure for a user prompt.
 */
export interface UserChatMessage {
  role: "user";
  content: string;
}

/**
 * Defines the message structure for an assistant response.
 */
export interface AssistantChatMessage {
  role: "assistant";
  content: string;
}

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
export type TypedMealPlanRow = Omit<Tables<"meal_plans">, "plan_content" | "target_macro_distribution"> & {
  plan_content: MealPlanContent;
  target_macro_distribution: TargetMacroDistribution | null;
};

/**
 * Strongly-typed version of the `meal_plans` table Insert.
 */
export type TypedMealPlanInsert = Omit<TablesInsert<"meal_plans">, "plan_content" | "target_macro_distribution"> & {
  plan_content: MealPlanContent;
  target_macro_distribution?: TargetMacroDistribution | null;
};

/**
 * Strongly-typed version of the `meal_plans` table Update.
 */
export type TypedMealPlanUpdate = Omit<TablesUpdate<"meal_plans">, "plan_content" | "target_macro_distribution"> & {
  plan_content?: MealPlanContent;
  target_macro_distribution?: TargetMacroDistribution | null;
};

/**
 * Strongly-typed version of the `ai_chat_sessions` table Row.
 * Overrides `message_history` from `Json` to `ChatMessage[]`.
 */
export type TypedAiChatSessionRow = Omit<Tables<"ai_chat_sessions">, "message_history"> & {
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
  | "patient_age"
  | "patient_weight"
  | "patient_height"
  | "activity_level"
  | "target_kcal"
  | "target_macro_distribution"
  | "meal_names"
  | "exclusions_guidelines"
>;

// =================================================================
//   4. API DTO & COMMAND MODELS
// =================================================================

// --- Meal Plans ---

/**
 * **DTO**: Represents a single meal plan item in the list.
 * @Endpoint `GET /api/meal-plans` (Array Item)
 */
export type MealPlanListItemDto = Pick<TypedMealPlanRow, "id" | "name" | "created_at" | "updated_at"> & {
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
export type CreateMealPlanCommand = Pick<TypedMealPlanInsert, "source_chat_session_id" | "name"> & {
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
export interface CreateAiSessionResponseDto {
  session_id: Tables<"ai_chat_sessions">["id"];
  message: AssistantChatMessage;
  prompt_count: Tables<"ai_chat_sessions">["final_prompt_count"];
}

/**
 * **Command**: The request payload for sending a follow-up message.
 * @Endpoint `POST /api/ai/sessions/{id}/message`
 */
export interface SendAiMessageCommand {
  message: UserChatMessage;
}

/**
 * **DTO**: The response after sending a follow-up message.
 * Includes the session ID and the new assistant response.
 * @Endpoint `POST /api/ai/sessions/{id}/message`
 */
export interface SendAiMessageResponseDto {
  session_id: Tables<"ai_chat_sessions">["id"];
  message: AssistantChatMessage;
  prompt_count: Tables<"ai_chat_sessions">["final_prompt_count"];
}

// --- User Preferences ---

/**
 * Theme type for user preference.
 */
export type Theme = "light" | "dark";

/**
 * **DTO**: The response for retrieving the user's language preference.
 * @Endpoint `GET /api/user-preferences`
 */
export interface GetLanguagePreferenceResponseDto {
  language: "en" | "pl";
}

/**
 * **Command**: The request payload for updating the user's language preference.
 * @Endpoint `PUT /api/user-preferences`
 */
export interface UpdateLanguagePreferenceCommand {
  language: "en" | "pl";
}

/**
 * **DTO**: The response after updating the user's language preference.
 * @Endpoint `PUT /api/user-preferences`
 */
export interface UpdateLanguagePreferenceResponseDto {
  language: "en" | "pl";
}

/**
 * **DTO**: The response for retrieving the user's theme preference.
 * @Endpoint `GET /api/user-preferences`
 */
export interface GetThemePreferenceResponseDto {
  theme: Theme;
}

/**
 * **Command**: The request payload for updating the user's theme preference.
 * @Endpoint `PUT /api/user-preferences`
 */
export interface UpdateThemePreferenceCommand {
  theme: Theme;
}

/**
 * **DTO**: The response after updating the user's theme preference.
 * @Endpoint `PUT /api/user-preferences`
 */
export interface UpdateThemePreferenceResponseDto {
  theme: Theme;
}

/**
 * **DTO**: The response for retrieving all user preferences (language, theme, and terms acceptance).
 * @Endpoint `GET /api/user-preferences`
 */
export interface GetAllPreferencesResponseDto {
  language: "en" | "pl";
  theme: Theme;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
}

/**
 * **Command**: The request payload for updating user preferences (language, theme, and/or terms acceptance).
 * @Endpoint `PUT /api/user-preferences`
 */
export interface UpdatePreferencesCommand {
  language?: "en" | "pl";
  theme?: Theme;
  terms_accepted?: boolean;
}

/**
 * **DTO**: The response after updating user preferences.
 * @Endpoint `PUT /api/user-preferences`
 */
export interface UpdatePreferencesResponseDto {
  language: "en" | "pl";
  theme: Theme;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
}

/**
 * **DTO**: The response for retrieving user's terms acceptance status.
 * @Endpoint `GET /api/user-preferences` (extended response)
 */
export interface GetUserPreferencesResponseDto {
  language: "en" | "pl";
  theme: Theme;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
}

// --- Export Options ---

/**
 * Defines the content options for export (what sections to include).
 */
export interface ExportContentOptions {
  /** Include daily summary (whole plan macros: kcal, proteins, fats, carbs) */
  dailySummary: boolean;
  /** Include meals summary (per-meal macros for all meals - all or none) */
  mealsSummary: boolean;
  /** Include ingredients for each meal */
  ingredients: boolean;
  /** Include preparation instructions for each meal */
  preparation: boolean;
}

/**
 * Defines the format options for export.
 */
export type ExportFormat = "doc" | "html";

/**
 * Complete export options including content and format.
 */
export interface ExportOptions {
  content: ExportContentOptions;
  format: ExportFormat;
}

/**
 * Request payload for export API endpoint.
 */
export interface ExportMealPlanRequest {
  content: ExportContentOptions;
  format: ExportFormat;
}

// =================================================================
//   5. MULTI-DAY MEAL PLANS
// =================================================================

/**
 * Strongly-typed version of the `multi_day_plans` table Row.
 * Overrides `common_allergens` from `Json` to `string[] | null`.
 */
export type TypedMultiDayPlanRow = Omit<Tables<"multi_day_plans">, "common_allergens"> & {
  common_allergens: string[] | null; // Parsed from JSON or comma-separated string
};

/**
 * Strongly-typed version of the `multi_day_plan_days` table Row.
 */
export type TypedMultiDayPlanDaysRow = Tables<"multi_day_plan_days">;

/**
 * Extended startup form data for multi-day meal plans.
 * Includes all fields from MealPlanStartupData plus multi-day specific options.
 */
export interface MultiDayStartupFormData extends MealPlanStartupData {
  /** Number of days for the meal plan (1-7) */
  number_of_days: number;
  /** Whether to ensure meal variety across days (default: true) */
  ensure_meal_variety: boolean;
  /** Whether different guidelines should be applied per day (default: false) */
  different_guidelines_per_day: boolean;
  /** Optional guidelines to apply per day (shown when different_guidelines_per_day is true) */
  per_day_guidelines?: string | null;
}

/**
 * Multi-day plan data structure used in AI chat context.
 * Represents a complete multi-day plan with all days and summary.
 */
export interface MultiDayPlanChatData {
  days: {
    day_number: number;
    plan_content: MealPlanContent;
    name?: string; // Optional day plan name
  }[];
  summary: {
    number_of_days: number;
    average_kcal: number;
    average_proteins: number;
    average_fats: number;
    average_carbs: number;
  };
}

/**
 * **Command**: The request payload for creating a new multi-day meal plan.
 * @Endpoint `POST /api/multi-day-plans`
 */
export interface CreateMultiDayPlanCommand {
  name: string;
  source_chat_session_id: string;
  number_of_days: number;
  common_exclusions_guidelines: string | null;
  common_allergens: string[] | null;
  day_plans: {
    day_number: number;
    plan_content: MealPlanContent;
    startup_data: MealPlanStartupData;
    name?: string; // Optional day plan name
  }[];
}

/**
 * **DTO**: The response after creating a new multi-day meal plan.
 * @Endpoint `POST /api/multi-day-plans`
 */
export type CreateMultiDayPlanResponseDto = TypedMultiDayPlanRow & {
  days: {
    day_number: number;
    day_plan: TypedMealPlanRow;
  }[];
};

/**
 * **DTO**: The response for retrieving a single multi-day meal plan.
 * @Endpoint `GET /api/multi-day-plans/{id}`
 */
export type GetMultiDayPlanByIdResponseDto = TypedMultiDayPlanRow & {
  days: {
    day_number: number;
    day_plan: TypedMealPlanRow;
  }[];
};

/**
 * **Command**: The request payload for updating an existing multi-day meal plan.
 * @Endpoint `PUT /api/multi-day-plans/{id}`
 */
export interface UpdateMultiDayPlanCommand {
  name?: string;
  day_plans?: {
    day_number: number;
    plan_content: MealPlanContent;
    startup_data: MealPlanStartupData;
    name?: string;
  }[];
  common_exclusions_guidelines?: string | null;
  common_allergens?: string[] | null;
}

/**
 * **DTO**: The response for listing multi-day meal plans.
 * @Endpoint `GET /api/multi-day-plans`
 */
export type GetMultiDayPlansResponseDto = {
  id: string;
  name: string;
  number_of_days: number;
  average_kcal: number;
  average_proteins: number;
  average_fats: number;
  average_carbs: number;
  created_at: string;
  updated_at: string;
}[];

/**
 * **DTO**: Represents a single multi-day plan item in the list.
 * @Endpoint `GET /api/multi-day-plans` (Array Item)
 */
export interface MultiDayPlanListItemDto {
  id: string;
  name: string;
  number_of_days: number;
  average_kcal: number;
  common_exclusions_guidelines: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * **Command**: The request payload for initiating a new multi-day AI chat session.
 * @Endpoint `POST /api/ai/sessions`
 */
export type CreateMultiDayAiSessionCommand = MultiDayStartupFormData;

/**
 * **DTO**: The response after initiating a new multi-day AI chat session.
 * @Endpoint `POST /api/ai/sessions`
 */
export interface CreateMultiDayAiSessionResponseDto {
  session_id: string;
  message: AssistantChatMessage;
  prompt_count: number;
}

/**
 * **DTO**: Complete multi-day plan view data with all days.
 */
export interface MultiDayPlanViewData {
  id: string;
  name: string;
  number_of_days: number;
  average_kcal: number;
  average_proteins: number;
  average_fats: number;
  average_carbs: number;
  common_exclusions_guidelines: string | null;
  common_allergens: string[] | null;
  days: {
    day_number: number;
    day_plan: TypedMealPlanRow;
  }[];
  created_at: string;
  updated_at: string;
}
