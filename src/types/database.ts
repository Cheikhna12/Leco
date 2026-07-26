/**
 * Types du schéma Leco.
 *
 * Ce fichier suit la forme produite par `supabase gen types typescript`.
 * Il est versionné afin que la vague 1 puisse typer ses appels avant qu'une
 * instance distante existe. Il devra être régénéré après chaque migration.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
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
          content_hash: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          match_id: string;
          read_at: string | null;
          sender_id: string;
        };
        Insert: {
          content: string;
          content_hash?: never;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          match_id: string;
          read_at?: string | null;
          sender_id: string;
        };
        Update: {
          content?: string;
          content_hash?: never;
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
          bio: string | null;
          birth_date: string | null;
          created_at: string;
          deletion_requested_at: string | null;
          first_name: string | null;
          gender: Database["public"]["Enums"]["gender"] | null;
          id: string;
          is_discoverable: boolean;
          is_profile_complete: boolean;
          searching_for: Database["public"]["Enums"]["gender"][];
          suspended_until: string | null;
          updated_at: string;
        };
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"];
          bio?: string | null;
          birth_date?: string | null;
          created_at?: string;
          deletion_requested_at?: string | null;
          first_name?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          id: string;
          is_discoverable?: boolean;
          is_profile_complete?: boolean;
          searching_for?: Database["public"]["Enums"]["gender"][];
          suspended_until?: string | null;
          updated_at?: string;
        };
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"];
          bio?: string | null;
          birth_date?: string | null;
          created_at?: string;
          deletion_requested_at?: string | null;
          first_name?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          id?: string;
          is_discoverable?: boolean;
          is_profile_complete?: boolean;
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
    Views: Record<never, never>;
    Functions: {
      activate_presence: {
        Args: {
          p_duration_minutes?: number;
          p_mood: Database["public"]["Enums"]["mood"];
        };
        Returns: string;
      };
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
      deactivate_presence: {
        Args: { p_hidden?: boolean };
        Returns: undefined;
      };
      expire_stale_presence: {
        Args: Record<PropertyKey, never>;
        Returns: {
          locations_deleted: number;
          presences_expired: number;
        }[];
      };
      get_nearby_profiles: {
        Args: {
          p_limit?: number;
          p_radius_m?: number;
        };
        Returns: {
          age: number;
          bio: string | null;
          distance_band: Database["public"]["Enums"]["distance_band"];
          first_name: string;
          gender: Database["public"]["Enums"]["gender"];
          interest_slugs: string[];
          mood: Database["public"]["Enums"]["mood"];
          primary_photo_url: string | null;
          profile_id: string;
        }[];
      };
      get_my_session_context: {
        Args: Record<PropertyKey, never>;
        Returns: {
          user_id: string;
          account_status: Database["public"]["Enums"]["account_status"];
          is_profile_complete: boolean;
        }[];
      };
      get_my_presence: {
        Args: Record<PropertyKey, never>;
        Returns: {
          availability_status: Database["public"]["Enums"]["availability_status"];
          available_until: string | null;
          mood: Database["public"]["Enums"]["mood"] | null;
        }[];
      };
      heartbeat_presence: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      send_hello: {
        Args: { p_recipient_id: string };
        Returns: {
          is_match: boolean;
          like_id: string;
          match_id: string | null;
        }[];
      };
      update_my_location: {
        Args: {
          p_accuracy_m?: number | null;
          p_latitude: number;
          p_longitude: number;
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
    CompositeTypes: Record<never, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Row"];

export type TablesInsert<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Update"];

export type Enums<EnumName extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][EnumName];
