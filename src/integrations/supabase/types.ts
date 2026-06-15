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
      bonus_predictions: {
        Row: {
          best_player_name: string | null
          champion_team_id: string | null
          created_at: string
          id: string
          locked_at: string | null
          pool_id: string
          top_scorer_player_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          best_player_name?: string | null
          champion_team_id?: string | null
          created_at?: string
          id?: string
          locked_at?: string | null
          pool_id: string
          top_scorer_player_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          best_player_name?: string | null
          champion_team_id?: string | null
          created_at?: string
          id?: string
          locked_at?: string | null
          pool_id?: string
          top_scorer_player_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bonus_predictions_champion_team_id_fkey"
            columns: ["champion_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bonus_predictions_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
        ]
      }
      external_api_logs: {
        Row: {
          created_at: string
          endpoint: string | null
          error_message: string | null
          id: string
          provider: string
          response_summary: string | null
          status: string
        }
        Insert: {
          created_at?: string
          endpoint?: string | null
          error_message?: string | null
          id?: string
          provider: string
          response_summary?: string | null
          status: string
        }
        Update: {
          created_at?: string
          endpoint?: string | null
          error_message?: string | null
          id?: string
          provider?: string
          response_summary?: string | null
          status?: string
        }
        Relationships: []
      }
      match_points: {
        Row: {
          calculated_at: string
          correct_result: boolean
          exact_score: boolean
          id: string
          knockout_hit: boolean
          match_id: string
          points: number
          pool_id: string
          user_id: string
        }
        Insert: {
          calculated_at?: string
          correct_result?: boolean
          exact_score?: boolean
          id?: string
          knockout_hit?: boolean
          match_id: string
          points?: number
          pool_id: string
          user_id: string
        }
        Update: {
          calculated_at?: string
          correct_result?: boolean
          exact_score?: boolean
          id?: string
          knockout_hit?: boolean
          match_id?: string
          points?: number
          pool_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_points_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_points_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
        ]
      }
      match_sync_status: {
        Row: {
          external_match_id: string | null
          id: string
          last_status: string | null
          last_synced_at: string | null
          match_id: string
          sync_error: string | null
          updated_at: string
        }
        Insert: {
          external_match_id?: string | null
          id?: string
          last_status?: string | null
          last_synced_at?: string | null
          match_id: string
          sync_error?: string | null
          updated_at?: string
        }
        Update: {
          external_match_id?: string | null
          id?: string
          last_status?: string | null
          last_synced_at?: string | null
          match_id?: string
          sync_error?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_sync_status_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_id: string
          created_at: string
          external_match_id: string | null
          group_name: string | null
          home_score: number | null
          home_team_id: string
          id: string
          is_knockout: boolean
          is_mock: boolean
          kickoff_at: string
          last_synced_at: string | null
          stage: Database["public"]["Enums"]["match_stage"]
          status: Database["public"]["Enums"]["match_status"]
          updated_at: string
          winner_team_id: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id: string
          created_at?: string
          external_match_id?: string | null
          group_name?: string | null
          home_score?: number | null
          home_team_id: string
          id?: string
          is_knockout?: boolean
          is_mock?: boolean
          kickoff_at: string
          last_synced_at?: string | null
          stage?: Database["public"]["Enums"]["match_stage"]
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
          winner_team_id?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string
          created_at?: string
          external_match_id?: string | null
          group_name?: string | null
          home_score?: number | null
          home_team_id?: string
          id?: string
          is_knockout?: boolean
          is_mock?: boolean
          kickoff_at?: string
          last_synced_at?: string | null
          stage?: Database["public"]["Enums"]["match_stage"]
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      pool_members: {
        Row: {
          id: string
          joined_at: string
          pool_id: string
          role: Database["public"]["Enums"]["pool_member_role"]
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          pool_id: string
          role?: Database["public"]["Enums"]["pool_member_role"]
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          pool_id?: string
          role?: Database["public"]["Enums"]["pool_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pool_members_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
        ]
      }
      pools: {
        Row: {
          bonus_lock_at: string | null
          created_at: string
          description: string | null
          id: string
          invite_code: string
          name: string
          owner_id: string
          status: Database["public"]["Enums"]["pool_status"]
          updated_at: string
        }
        Insert: {
          bonus_lock_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invite_code: string
          name: string
          owner_id: string
          status?: Database["public"]["Enums"]["pool_status"]
          updated_at?: string
        }
        Update: {
          bonus_lock_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invite_code?: string
          name?: string
          owner_id?: string
          status?: Database["public"]["Enums"]["pool_status"]
          updated_at?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          created_at: string
          id: string
          locked_at: string | null
          match_id: string
          pool_id: string
          predicted_away_score: number
          predicted_home_score: number
          predicted_winner_team_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          locked_at?: string | null
          match_id: string
          pool_id: string
          predicted_away_score: number
          predicted_home_score: number
          predicted_winner_team_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          locked_at?: string | null
          match_id?: string
          pool_id?: string
          predicted_away_score?: number
          predicted_home_score?: number
          predicted_winner_team_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_predicted_winner_team_id_fkey"
            columns: ["predicted_winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      ranking_snapshots: {
        Row: {
          calculated_at: string
          correct_results: number
          exact_scores: number
          id: string
          knockout_hits: number
          pool_id: string
          position: number
          total_points: number
          user_id: string
        }
        Insert: {
          calculated_at?: string
          correct_results?: number
          exact_scores?: number
          id?: string
          knockout_hits?: number
          pool_id: string
          position?: number
          total_points?: number
          user_id: string
        }
        Update: {
          calculated_at?: string
          correct_results?: number
          exact_scores?: number
          id?: string
          knockout_hits?: number
          pool_id?: string
          position?: number
          total_points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ranking_snapshots_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          code: string
          created_at: string
          flag_emoji: string | null
          group_name: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          flag_emoji?: string | null
          group_name?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          flag_emoji?: string | null
          group_name?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_recalculate_pool_ranking: {
        Args: { _pool_id: string }
        Returns: undefined
      }
      calculate_match_points: {
        Args: { _match_id: string }
        Returns: undefined
      }
      generate_invite_code: { Args: never; Returns: string }
      get_pool_by_invite_code: {
        Args: { _code: string }
        Returns: {
          description: string
          id: string
          name: string
          owner_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_pool_admin: {
        Args: { _pool_id: string; _user_id: string }
        Returns: boolean
      }
      is_pool_member: {
        Args: { _pool_id: string; _user_id: string }
        Returns: boolean
      }
      recalculate_pool_ranking: {
        Args: { _pool_id: string }
        Returns: undefined
      }
      recalculate_rankings_for_match: {
        Args: { _match_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      match_stage:
        | "group"
        | "round_of_16"
        | "quarter"
        | "semi"
        | "third_place"
        | "final"
      match_status:
        | "scheduled"
        | "live"
        | "finished"
        | "postponed"
        | "cancelled"
      pool_member_role: "owner" | "admin" | "member"
      pool_status: "active" | "finished"
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
    Enums: {
      app_role: ["admin", "user"],
      match_stage: [
        "group",
        "round_of_16",
        "quarter",
        "semi",
        "third_place",
        "final",
      ],
      match_status: ["scheduled", "live", "finished", "postponed", "cancelled"],
      pool_member_role: ["owner", "admin", "member"],
      pool_status: ["active", "finished"],
    },
  },
} as const
