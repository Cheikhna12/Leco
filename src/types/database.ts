export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          actor_id: string | null;
          event_type: string;
          id: number;
          metadata: Json;
          occurred_at: string;
          target_id: string | null;
          target_table: string | null;
        };
        Insert: {
          actor_id?: string | null;
          event_type: string;
          id?: never;
          metadata?: Json;
          occurred_at?: string;
          target_id?: string | null;
          target_table?: string | null;
        };
        Update: {
          actor_id?: string | null;
          event_type?: string;
          id?: never;
          metadata?: Json;
          occurred_at?: string;
          target_id?: string | null;
          target_table?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      blocks: {
        Row: {
          blocked_id: string;
          blocker_id: string;
          created_at: string;
          id: string;
        };
        Insert: {
          blocked_id: string;
          blocker_id: string;
          created_at?: string;
          id?: string;
        };
        Update: {
          blocked_id?: string;
          blocker_id?: string;
          created_at?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey";
            columns: ["blocked_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey";
            columns: ["blocker_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      interests: {
        Row: {
          created_at: string;
          id: number;
          is_active: boolean;
          label_fr: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          is_active?: boolean;
          label_fr: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          is_active?: boolean;
          label_fr?: string;
          slug?: string;
        };
        Relationships: [];
      };
      likes: {
        Row: {
          created_at: string;
          id: string;
          matched_at: string | null;
          recipient_id: string;
          resolved_at: string | null;
          sender_id: string;
          status: Database["public"]["Enums"]["like_status"];
        };
        Insert: {
          created_at?: string;
          id?: string;
          matched_at?: string | null;
          recipient_id: string;
          resolved_at?: string | null;
          sender_id: string;
          status?: Database["public"]["Enums"]["like_status"];
        };
        Update: {
          created_at?: string;
          id?: string;
          matched_at?: string | null;
          recipient_id?: string;
          resolved_at?: string | null;
          sender_id?: string;
          status?: Database["public"]["Enums"]["like_status"];
        };
        Relationships: [
          {
            foreignKeyName: "likes_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "likes_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      matches: {
        Row: {
          created_at: string;
          ended_at: string | null;
          id: string;
          last_message_at: string | null;
          matched_at: string;
          status: Database["public"]["Enums"]["match_status"];
          updated_at: string;
          user_high_id: string;
          user_low_id: string;
        };
        Insert: {
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          last_message_at?: string | null;
          matched_at?: string;
          status?: Database["public"]["Enums"]["match_status"];
          updated_at?: string;
          user_high_id: string;
          user_low_id: string;
        };
        Update: {
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          last_message_at?: string | null;
          matched_at?: string;
          status?: Database["public"]["Enums"]["match_status"];
          updated_at?: string;
          user_high_id?: string;
          user_low_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "matches_user_high_id_fkey";
            columns: ["user_high_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_user_low_id_fkey";
            columns: ["user_low_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          content: string;
          content_hash: string | null;
          created_at: string;
          deleted_at: string | null;
          id: string;
          match_id: string;
          read_at: string | null;
          sender_id: string;
        };
        Insert: {
          content: string;
          content_hash?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          match_id: string;
          read_at?: string | null;
          sender_id: string;
        };
        Update: {
          content?: string;
          content_hash?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          match_id?: string;
          read_at?: string | null;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      moderation_actions: {
        Row: {
          action_type: Database["public"]["Enums"]["moderation_action_type"];
          created_at: string;
          expires_at: string | null;
          id: string;
          moderator_id: string;
          rationale: string;
          report_id: string | null;
          target_user_id: string;
        };
        Insert: {
          action_type: Database["public"]["Enums"]["moderation_action_type"];
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          moderator_id: string;
          rationale: string;
          report_id?: string | null;
          target_user_id: string;
        };
        Update: {
          action_type?: Database["public"]["Enums"]["moderation_action_type"];
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          moderator_id?: string;
          rationale?: string;
          report_id?: string | null;
          target_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "moderation_actions_moderator_id_fkey";
            columns: ["moderator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "moderation_actions_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "reports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "moderation_actions_target_user_id_fkey";
            columns: ["target_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_photos: {
        Row: {
          cloudinary_public_id: string;
          cloudinary_version: number | null;
          created_at: string;
          deleted_at: string | null;
          height: number | null;
          id: string;
          moderation_status: Database["public"]["Enums"]["photo_moderation_status"];
          profile_id: string;
          secure_url: string;
          sort_order: number;
          width: number | null;
        };
        Insert: {
          cloudinary_public_id: string;
          cloudinary_version?: number | null;
          created_at?: string;
          deleted_at?: string | null;
          height?: number | null;
          id?: string;
          moderation_status?: Database["public"]["Enums"]["photo_moderation_status"];
          profile_id: string;
          secure_url: string;
          sort_order: number;
          width?: number | null;
        };
        Update: {
          cloudinary_public_id?: string;
          cloudinary_version?: number | null;
          created_at?: string;
          deleted_at?: string | null;
          height?: number | null;
          id?: string;
          moderation_status?: Database["public"]["Enums"]["photo_moderation_status"];
          profile_id?: string;
          secure_url?: string;
          sort_order?: number;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "profile_photos_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"];
          adult_confirmed_at: string | null;
          bio: string | null;
          birth_date: string | null;
          created_at: string;
          deletion_requested_at: string | null;
          first_name: string | null;
          gender: Database["public"]["Enums"]["gender"] | null;
          id: string;
          is_discoverable: boolean;
          is_profile_complete: boolean;
          onboarding_step: number;
          searching_for: Database["public"]["Enums"]["gender"][];
          suspended_until: string | null;
          updated_at: string;
        };
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"];
          adult_confirmed_at?: string | null;
          bio?: string | null;
          birth_date?: string | null;
          created_at?: string;
          deletion_requested_at?: string | null;
          first_name?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          id: string;
          is_discoverable?: boolean;
          is_profile_complete?: boolean;
          onboarding_step?: number;
          searching_for?: Database["public"]["Enums"]["gender"][];
          suspended_until?: string | null;
          updated_at?: string;
        };
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"];
          adult_confirmed_at?: string | null;
          bio?: string | null;
          birth_date?: string | null;
          created_at?: string;
          deletion_requested_at?: string | null;
          first_name?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          id?: string;
          is_discoverable?: boolean;
          is_profile_complete?: boolean;
          onboarding_step?: number;
          searching_for?: Database["public"]["Enums"]["gender"][];
          suspended_until?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          match_id: string | null;
          message_id: string | null;
          moderator_decision: string | null;
          reason: Database["public"]["Enums"]["report_reason"];
          reported_user_id: string;
          reporter_id: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database["public"]["Enums"]["report_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          match_id?: string | null;
          message_id?: string | null;
          moderator_decision?: string | null;
          reason: Database["public"]["Enums"]["report_reason"];
          reported_user_id: string;
          reporter_id: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          match_id?: string | null;
          message_id?: string | null;
          moderator_decision?: string | null;
          reason?: Database["public"]["Enums"]["report_reason"];
          reported_user_id?: string;
          reporter_id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey";
            columns: ["reported_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_interests: {
        Row: {
          created_at: string;
          interest_id: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          interest_id: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          interest_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_interests_interest_id_fkey";
            columns: ["interest_id"];
            isOneToOne: false;
            referencedRelation: "interests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_interests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_locations: {
        Row: {
          accuracy_m: number | null;
          captured_at: string;
          expires_at: string;
          location: unknown;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          accuracy_m?: number | null;
          captured_at?: string;
          expires_at?: string;
          location: unknown;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          accuracy_m?: number | null;
          captured_at?: string;
          expires_at?: string;
          location?: unknown;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_locations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_presence: {
        Row: {
          activated_at: string | null;
          availability_status: Database["public"]["Enums"]["availability_status"];
          available_until: string | null;
          last_heartbeat_at: string | null;
          mood: Database["public"]["Enums"]["mood"] | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          activated_at?: string | null;
          availability_status?: Database["public"]["Enums"]["availability_status"];
          available_until?: string | null;
          last_heartbeat_at?: string | null;
          mood?: Database["public"]["Enums"]["mood"] | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          activated_at?: string | null;
          availability_status?: Database["public"]["Enums"]["availability_status"];
          available_until?: string | null;
          last_heartbeat_at?: string | null;
          mood?: Database["public"]["Enums"]["mood"] | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_presence_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      activate_presence: {
        Args: {
          p_duration_minutes?: number;
          p_mood: Database["public"]["Enums"]["mood"];
        };
        Returns: string;
      };
      add_my_profile_photo: {
        Args: {
          p_cloudinary_public_id: string;
          p_cloudinary_version: number;
          p_height: number;
          p_secure_url: string;
          p_width: number;
        };
        Returns: string;
      };
      block_user: { Args: { p_blocked_id: string }; Returns: string };
      complete_my_onboarding: { Args: never; Returns: boolean };
      consume_rate_limit: {
        Args: {
          p_cost?: number;
          p_key: string;
          p_limit: number;
          p_window_seconds: number;
        };
        Returns: {
          allowed: boolean;
          remaining: number;
          reset_at: string;
        }[];
      };
      create_report: {
        Args: {
          p_description?: string;
          p_match_id?: string;
          p_message_id?: string;
          p_reason: Database["public"]["Enums"]["report_reason"];
          p_reported_user_id: string;
        };
        Returns: string;
      };
      deactivate_presence: { Args: { p_hidden?: boolean }; Returns: undefined };
      delete_my_profile_photo: {
        Args: { p_photo_id: string };
        Returns: string;
      };
      expire_stale_presence: {
        Args: never;
        Returns: {
          locations_deleted: number;
          presences_expired: number;
        }[];
      };
      get_my_onboarding_state: {
        Args: never;
        Returns: {
          adult_confirmed: boolean;
          bio: string;
          birth_date: string;
          first_name: string;
          gender: Database["public"]["Enums"]["gender"];
          interest_ids: number[];
          is_profile_complete: boolean;
          onboarding_step: number;
          photos: Json;
          searching_for: Database["public"]["Enums"]["gender"][];
        }[];
      };
      get_my_session_context: {
        Args: never;
        Returns: {
          account_status: Database["public"]["Enums"]["account_status"];
          is_profile_complete: boolean;
          user_id: string;
        }[];
      };
      get_nearby_profiles: {
        Args: { p_limit?: number; p_radius_m?: number };
        Returns: {
          age: number;
          bio: string;
          distance_band: Database["public"]["Enums"]["distance_band"];
          first_name: string;
          gender: Database["public"]["Enums"]["gender"];
          interest_slugs: string[];
          mood: Database["public"]["Enums"]["mood"];
          primary_photo_url: string;
          profile_id: string;
        }[];
      };
      get_nearby_profiles_filtered: {
        Args: {
          p_interest_slugs?: string[];
          p_limit?: number;
          p_max_age?: number;
          p_min_age?: number;
          p_radius_m?: number;
        };
        Returns: {
          age: number;
          bio: string;
          distance_band: Database["public"]["Enums"]["distance_band"];
          first_name: string;
          gender: Database["public"]["Enums"]["gender"];
          interest_slugs: string[];
          mood: Database["public"]["Enums"]["mood"];
          primary_photo_url: string;
          profile_id: string;
        }[];
      };
      get_my_presence: {
        Args: never;
        Returns: {
          availability_status: Database["public"]["Enums"]["availability_status"];
          available_until: string | null;
          mood: Database["public"]["Enums"]["mood"] | null;
        }[];
      };
      heartbeat_presence: { Args: never; Returns: string };
      list_onboarding_interests: {
        Args: never;
        Returns: {
          id: number;
          label_fr: string;
          slug: string;
        }[];
      };
      purge_expired_rate_limits: { Args: never; Returns: number };
      reorder_my_profile_photos: {
        Args: { p_photo_ids: string[] };
        Returns: undefined;
      };
      replace_my_interests: {
        Args: { p_interest_ids: number[] };
        Returns: undefined;
      };
      review_report: {
        Args: {
          p_action_type: Database["public"]["Enums"]["moderation_action_type"];
          p_decision: string;
          p_expires_at?: string;
          p_rationale: string;
          p_report_id: string;
          p_status: Database["public"]["Enums"]["report_status"];
        };
        Returns: string;
      };
      save_my_profile_draft: {
        Args: {
          p_adult_confirmed: boolean;
          p_bio: string;
          p_birth_date: string;
          p_first_name: string;
          p_gender: Database["public"]["Enums"]["gender"];
          p_onboarding_step?: number;
          p_searching_for: Database["public"]["Enums"]["gender"][];
        };
        Returns: undefined;
      };
      send_hello: {
        Args: { p_recipient_id: string };
        Returns: {
          is_match: boolean;
          like_id: string;
          match_id: string;
        }[];
      };
      send_message: {
        Args: { p_content: string; p_match_id: string };
        Returns: string;
      };
      update_my_location: {
        Args: {
          p_accuracy_m?: number;
          p_latitude: number;
          p_longitude: number;
        };
        Returns: undefined;
      };
      update_my_profile: {
        Args: {
          p_bio?: string;
          p_birth_date: string;
          p_first_name: string;
          p_gender: Database["public"]["Enums"]["gender"];
          p_is_discoverable?: boolean;
          p_searching_for: Database["public"]["Enums"]["gender"][];
        };
        Returns: undefined;
      };
    };
    Enums: {
      account_status:
        "active" | "deactivated" | "suspended" | "pending_deletion";
      availability_status: "offline" | "available" | "hidden";
      distance_band:
        | "TOUT_PRES"
        | "MOINS_DE_500_M"
        | "ENTRE_500_M_ET_1_KM"
        | "DANS_TON_SECTEUR";
      gender: "woman" | "man" | "non_binary" | "other" | "prefer_not_to_say";
      like_status: "pending" | "matched" | "cancelled" | "expired";
      match_status: "active" | "ended" | "blocked";
      moderation_action_type:
        | "warning"
        | "temporary_suspension"
        | "permanent_suspension"
        | "content_removal"
        | "report_dismissal"
        | "account_reinstatement";
      mood:
        | "sortir"
        | "discuter"
        | "manger"
        | "match"
        | "rencontre"
        | "sport"
        | "evenement"
        | "plan_tranquille";
      photo_moderation_status: "pending" | "approved" | "rejected";
      report_reason:
        | "harassment"
        | "threat"
        | "fake_profile"
        | "impersonation"
        | "potential_minor"
        | "unsolicited_sexual_content"
        | "spam"
        | "scam"
        | "hate"
        | "other";
      report_status: "open" | "in_review" | "resolved" | "dismissed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_status: [
        "active",
        "deactivated",
        "suspended",
        "pending_deletion",
      ],
      availability_status: ["offline", "available", "hidden"],
      distance_band: [
        "TOUT_PRES",
        "MOINS_DE_500_M",
        "ENTRE_500_M_ET_1_KM",
        "DANS_TON_SECTEUR",
      ],
      gender: ["woman", "man", "non_binary", "other", "prefer_not_to_say"],
      like_status: ["pending", "matched", "cancelled", "expired"],
      match_status: ["active", "ended", "blocked"],
      moderation_action_type: [
        "warning",
        "temporary_suspension",
        "permanent_suspension",
        "content_removal",
        "report_dismissal",
        "account_reinstatement",
      ],
      mood: [
        "sortir",
        "discuter",
        "manger",
        "match",
        "rencontre",
        "sport",
        "evenement",
        "plan_tranquille",
      ],
      photo_moderation_status: ["pending", "approved", "rejected"],
      report_reason: [
        "harassment",
        "threat",
        "fake_profile",
        "impersonation",
        "potential_minor",
        "unsolicited_sexual_content",
        "spam",
        "scam",
        "hate",
        "other",
      ],
      report_status: ["open", "in_review", "resolved", "dismissed"],
    },
  },
} as const;
