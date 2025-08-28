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
          completed_at: string | null
          created_at: string
          end_date: string
          id: string
          is_active: boolean | null
          is_completed: boolean | null
          month: number
          start_date: string
          year: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean | null
          is_completed?: boolean | null
          month: number
          start_date: string
          year: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          is_completed?: boolean | null
          month?: number
          start_date?: string
          year?: number
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          created_at: string
          error_message: string | null
          html_content: string
          id: string
          max_retries: number | null
          priority: number | null
          retry_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template_data: Json | null
          template_name: string | null
          to_email: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          html_content: string
          id?: string
          max_retries?: number | null
          priority?: number | null
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template_data?: Json | null
          template_name?: string | null
          to_email: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          html_content?: string
          id?: string
          max_retries?: number | null
          priority?: number | null
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_data?: Json | null
          template_name?: string | null
          to_email?: string
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
      notification_preferences: {
        Row: {
          assessment_reminders: boolean | null
          completion_notifications: boolean | null
          created_at: string
          deadline_warnings: boolean | null
          email_enabled: boolean | null
          id: string
          push_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          reminder_frequency: string | null
          system_notifications: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_reminders?: boolean | null
          completion_notifications?: boolean | null
          created_at?: string
          deadline_warnings?: boolean | null
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_frequency?: string | null
          system_notifications?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_reminders?: boolean | null
          completion_notifications?: boolean | null
          created_at?: string
          deadline_warnings?: boolean | null
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_frequency?: string | null
          system_notifications?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          priority: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          priority?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          priority?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      employee_pins: {
        Row: {
          id: string
          giver_id: string
          receiver_id: string
          given_at: string
          week_number: number
          year: number
          month: number
          created_at: string
        }
        Insert: {
          id?: string
          giver_id: string
          receiver_id: string
          given_at?: string
          week_number: number
          year: number
          month: number
          created_at?: string
        }
        Update: {
          id?: string
          giver_id?: string
          receiver_id?: string
          given_at?: string
          week_number?: number
          year?: number
          month?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_pins_giver_id_fkey"
            columns: ["giver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_pins_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_periods: {
        Row: {
          id: string
          month: number | null
          year: number | null
          start_date: string
          end_date: string
          is_active: boolean | null
          is_completed: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          month?: number | null
          year?: number | null
          start_date: string
          end_date: string
          is_active?: boolean | null
          is_completed?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          month?: number | null
          year?: number | null
          start_date?: string
          end_date?: string
          is_active?: boolean | null
          is_completed?: boolean | null
          created_at?: string
        }
        Relationships: []
      }
      weekly_pin_allowance: {
        Row: {
          id: string
          user_id: string
          week_number: number
          year: number
          pins_remaining: number
          pins_used: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_number: number
          year: number
          pins_remaining?: number
          pins_used?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_number?: number
          year?: number
          pins_remaining?: number
          pins_used?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_pin_allowance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_pin_allowance: {
        Row: {
          id: string
          user_id: string
          month: number
          year: number
          pins_remaining: number
          pins_used: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: number
          year: number
          pins_remaining?: number
          pins_used?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month?: number
          year?: number
          pins_remaining?: number
          pins_used?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_pin_allowance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      triwulan_periods: {
        Row: {
          id: string
          year: number
          quarter: number
          start_date: string
          end_date: string
          is_active: boolean | null
          is_completed: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          year: number
          quarter: number
          start_date: string
          end_date: string
          is_active?: boolean | null
          is_completed?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          year?: number
          quarter?: number
          start_date?: string
          end_date?: string
          is_active?: boolean | null
          is_completed?: boolean | null
          created_at?: string
        }
        Relationships: []
      }
      triwulan_monthly_deficiencies: {
        Row: {
          period_id: string
          user_id: string
          year: number
          month: number
          deficiency_hours: number
          filled_by: string | null
        }
        Insert: {
          period_id: string
          user_id: string
          year: number
          month: number
          deficiency_hours: number
          filled_by?: string | null
        }
        Update: {
          period_id?: string
          user_id?: string
          year?: number
          month?: number
          deficiency_hours?: number
          filled_by?: string | null
        }
        Relationships: []
      }
      triwulan_candidates: {
        Row: {
          period_id: string
          user_id: string
        }
        Insert: {
          period_id: string
          user_id: string
        }
        Update: {
          period_id?: string
          user_id?: string
        }
        Relationships: []
      }
      triwulan_votes: {
        Row: {
          period_id: string
          voter_id: string
          candidate_id: string
          created_at: string | null
        }
        Insert: {
          period_id: string
          voter_id: string
          candidate_id: string
          created_at?: string | null
        }
        Update: {
          period_id?: string
          voter_id?: string
          candidate_id?: string
          created_at?: string | null
        }
        Relationships: []
      }
      triwulan_vote_completion: {
        Row: {
          period_id: string
          voter_id: string
          completed: boolean
          completed_at: string | null
        }
        Insert: {
          period_id: string
          voter_id: string
          completed?: boolean
          completed_at?: string | null
        }
        Update: {
          period_id?: string
          voter_id?: string
          completed?: boolean
          completed_at?: string | null
        }
        Relationships: []
      }
      triwulan_ratings: {
        Row: {
          period_id: string
          rater_id: string
          candidate_id: string
          c1: number | null
          c2: number | null
          c3: number | null
          c4: number | null
          c5: number | null
          c6: number | null
          c7: number | null
          c8: number | null
          c9: number | null
          c10: number | null
          c11: number | null
          c12: number | null
          c13: number | null
        }
        Insert: {
          period_id: string
          rater_id: string
          candidate_id: string
          c1?: number | null
          c2?: number | null
          c3?: number | null
          c4?: number | null
          c5?: number | null
          c6?: number | null
          c7?: number | null
          c8?: number | null
          c9?: number | null
          c10?: number | null
          c11?: number | null
          c12?: number | null
          c13?: number | null
        }
        Update: {
          period_id?: string
          rater_id?: string
          candidate_id?: string
          c1?: number | null
          c2?: number | null
          c3?: number | null
          c4?: number | null
          c5?: number | null
          c6?: number | null
          c7?: number | null
          c8?: number | null
          c9?: number | null
          c10?: number | null
          c11?: number | null
          c12?: number | null
          c13?: number | null
        }
        Relationships: []
      }
      triwulan_candidate_scores: {
        Row: {
          period_id: string
          candidate_id: string
          total_score: number | null
          num_raters: number | null
          score_percent: number | null
        }
        Insert: {
          period_id: string
          candidate_id: string
          total_score?: number | null
          num_raters?: number | null
          score_percent?: number | null
        }
        Update: {
          period_id?: string
          candidate_id?: string
          total_score?: number | null
          num_raters?: number | null
          score_percent?: number | null
        }
        Relationships: []
      }
      triwulan_winners: {
        Row: {
          period_id: string
          winner_id: string
          total_score: number | null
        }
        Insert: {
          period_id: string
          winner_id: string
          total_score?: number | null
        }
        Update: {
          period_id?: string
          winner_id?: string
          total_score?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_role: {
        Args: { user_uuid: string }
        Returns: string
      }
      generate_random_assignments: {
        Args: { period_uuid: string }
        Returns: undefined
      }
      is_admin: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      is_user: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      mark_period_completed: {
        Args: { period_uuid: string }
        Returns: undefined
      }
      setup_admin_user: {
        Args: { admin_email: string }
        Returns: undefined
      }
      update_user_role: {
        Args: { new_role: string; user_uuid: string }
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
  public: {
    Enums: {},
  },
} as const
