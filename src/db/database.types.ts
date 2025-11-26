export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_chat_sessions: {
        Row: {
          created_at: string
          final_prompt_count: number
          id: string
          message_history: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          final_prompt_count?: number
          id?: string
          message_history?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          final_prompt_count?: number
          id?: string
          message_history?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          activity_level:
            | Database["public"]["Enums"]["activity_level_enum"]
            | null
          created_at: string
          exclusions_guidelines: string | null
          id: string
          is_day_plan: boolean
          meal_names: string | null
          name: string
          patient_age: number | null
          patient_height: number | null
          patient_weight: number | null
          plan_content: Json
          source_chat_session_id: string | null
          target_kcal: number | null
          target_macro_distribution: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_level?:
            | Database["public"]["Enums"]["activity_level_enum"]
            | null
          created_at?: string
          exclusions_guidelines?: string | null
          id?: string
          is_day_plan?: boolean
          meal_names?: string | null
          name: string
          patient_age?: number | null
          patient_height?: number | null
          patient_weight?: number | null
          plan_content: Json
          source_chat_session_id?: string | null
          target_kcal?: number | null
          target_macro_distribution?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_level?:
            | Database["public"]["Enums"]["activity_level_enum"]
            | null
          created_at?: string
          exclusions_guidelines?: string | null
          id?: string
          is_day_plan?: boolean
          meal_names?: string | null
          name?: string
          patient_age?: number | null
          patient_height?: number | null
          patient_weight?: number | null
          plan_content?: Json
          source_chat_session_id?: string | null
          target_kcal?: number | null
          target_macro_distribution?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_source_chat_session_id_fkey"
            columns: ["source_chat_session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      multi_day_plan_days: {
        Row: {
          created_at: string
          day_number: number
          day_plan_id: string
          id: string
          multi_day_plan_id: string
        }
        Insert: {
          created_at?: string
          day_number: number
          day_plan_id: string
          id?: string
          multi_day_plan_id: string
        }
        Update: {
          created_at?: string
          day_number?: number
          day_plan_id?: string
          id?: string
          multi_day_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "multi_day_plan_days_day_plan_id_fkey"
            columns: ["day_plan_id"]
            isOneToOne: true
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multi_day_plan_days_multi_day_plan_id_fkey"
            columns: ["multi_day_plan_id"]
            isOneToOne: false
            referencedRelation: "multi_day_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      multi_day_plans: {
        Row: {
          average_carbs: number | null
          average_fats: number | null
          average_kcal: number | null
          average_proteins: number | null
          common_allergens: Json | null
          common_exclusions_guidelines: string | null
          created_at: string
          id: string
          is_draft: boolean
          name: string
          number_of_days: number
          source_chat_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          average_carbs?: number | null
          average_fats?: number | null
          average_kcal?: number | null
          average_proteins?: number | null
          common_allergens?: Json | null
          common_exclusions_guidelines?: string | null
          created_at?: string
          id?: string
          is_draft?: boolean
          name: string
          number_of_days: number
          source_chat_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          average_carbs?: number | null
          average_fats?: number | null
          average_kcal?: number | null
          average_proteins?: number | null
          common_allergens?: Json | null
          common_exclusions_guidelines?: string | null
          created_at?: string
          id?: string
          is_draft?: boolean
          name?: string
          number_of_days?: number
          source_chat_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "multi_day_plans_source_chat_session_id_fkey"
            columns: ["source_chat_session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          ai_model: string | null
          created_at: string
          language: string
          terms_accepted: boolean
          terms_accepted_at: string | null
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          created_at?: string
          language?: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_model?: string | null
          created_at?: string
          language?: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      recalculate_multi_day_plan_summary: {
        Args: { p_multi_day_plan_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      activity_level_enum: "sedentary" | "light" | "moderate" | "high"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_level_enum: ["sedentary", "light", "moderate", "high"],
    },
  },
} as const
