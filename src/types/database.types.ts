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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      financial_goals: {
        Row: {
          category: string | null
          created_at: string
          current_amount: number | null
          deadline: string | null
          id: string
          name: string
          target_amount: number
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_amount?: number | null
          deadline?: string | null
          id?: string
          name: string
          target_amount: number
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_amount?: number | null
          deadline?: string | null
          id?: string
          name?: string
          target_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      pluggy_items: {
        Row: {
          connector_id: number | null
          connector_image_url: string | null
          connector_name: string | null
          created_at: string | null
          execution_status: string | null
          id: string
          item_id: string
          last_sync_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          connector_id?: number | null
          connector_image_url?: string | null
          connector_name?: string | null
          created_at?: string | null
          execution_status?: string | null
          id?: string
          item_id: string
          last_sync_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          connector_id?: number | null
          connector_image_url?: string | null
          connector_name?: string | null
          created_at?: string | null
          execution_status?: string | null
          id?: string
          item_id?: string
          last_sync_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recurring_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          day: number | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          day?: number | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          day?: number | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          bank_logo_url: string | null
          bank_name: string | null
          category: string | null
          created_at: string
          id: number
          installment_group_id: string | null
          is_paid: boolean | null
          name: string
          notes: string | null
          pluggy_transaction_id: string | null
          receipt_url: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_logo_url?: string | null
          bank_name?: string | null
          category?: string | null
          created_at?: string
          id?: number
          installment_group_id?: string | null
          is_paid?: boolean | null
          name: string
          notes?: string | null
          pluggy_transaction_id?: string | null
          receipt_url?: string | null
          type: string
          user_id?: string
        }
        Update: {
          amount?: number
          bank_logo_url?: string | null
          bank_name?: string | null
          category?: string | null
          created_at?: string
          id?: number
          installment_group_id?: string | null
          is_paid?: boolean | null
          name?: string
          notes?: string | null
          pluggy_transaction_id?: string | null
          receipt_url?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_analysis_data:
        | {
            Args: {
              p_end_date: string
              p_prev_end_date?: string
              p_prev_start_date?: string
              p_start_date: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_end_date: string
              p_prev_end_date?: string
              p_prev_start_date?: string
              p_start_date: string
              p_user_id: string
            }
            Returns: Json
          }
      get_analysis_data_v2: {
        Args: {
          p_end_date: string
          p_prev_end_date?: string
          p_prev_start_date?: string
          p_start_date: string
          p_user_id: string
        }
        Returns: Json
      }
      get_analysis_data_v3: {
        Args: {
          p_end_date: string
          p_prev_end_date?: string
          p_prev_start_date?: string
          p_start_date: string
          p_user_id: string
        }
        Returns: Json
      }
      get_analysis_data_v4: {
        Args: {
          p_end_date: string
          p_prev_end_date?: string
          p_prev_start_date?: string
          p_start_date: string
          p_user_id: string
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
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
