
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
    PostgrestVersion: "13.0.4"
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
      assessment_assignments: {
        Row: {
          assessee_id: string
          assessor_id: string
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean | null
          period_id: string
        }
        Insert: {
          assessee_id: string
          assessor_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          period_id: string
        }
        Update: {
          assessee_id?: string
          assessor_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          period_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_assignments_assessee_id_fkey"
            columns: ["assessee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_assignments_assessor_id_fkey"
            columns: ["assessor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_assignments_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "assessment_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_history: {
        Row: {
          average_rating: number | null
          created_at: string
          id: string
          period_id: string
          total_feedback_received: number | null
          user_id: string
        }
        Insert: {
          average_rating?: number | null
          created_at?: string
          id?: string
          period_id: string
          total_feedback_received?: number | null
          user_id: string
        }
        Update: {
          average_rating?: number | null
          created_at?: string
          id?: string
          period_id?: string
          total_feedback_received?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_history_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "assessment_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_periods: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean | null
          month: number
          start_date: string
          year: number
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean | null
          month: number
          start_date: string
          year: number
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          month?: number
          start_date?: string
          year?: number
        }
        Relationships: []
      }
      feedback_responses: {
        Row: {
          aspect: string
          assignment_id: string
          comment: string | null
          created_at: string
          id: string
          indicator: string
          rating: number
        }
        Insert: {
          aspect: string
          assignment_id: string
          comment?: string | null
          created_at?: string
          id?: string
          indicator: string
          rating: number
        }
        Update: {
          aspect?: string
          assignment_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          indicator?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "feedback_responses_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assessment_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          allow_public_view: boolean | null
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string
          full_name: string
          id: string
          position: string | null
          updated_at: string
          username: string
        }
        Insert: {
          allow_public_view?: boolean | null
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email: string
          full_name: string
          id: string
          position?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          allow_public_view?: boolean | null
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          position?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      reminder_logs: {
        Row: {
          id: string
          period_id: string
          reminder_type: string
          sent_at: string
          user_id: string
        }
        Insert: {
          id?: string
          period_id: string
          reminder_type: string
          sent_at?: string
          user_id: string
        }
        Update: {
          id?: string
          period_id?: string
          reminder_type?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_logs_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "assessment_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_random_assignments: {
        Args: { period_uuid: string }
        Returns: undefined
      }
      setup_admin_user: {
        Args: { admin_email: string }
        Returns: undefined
      }
      mark_period_completed: {
        Args: { period_uuid: string }
        Returns: undefined
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
    Enums: {},
  },
} as const
