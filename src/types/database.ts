/**
 * Hand-written mirror of supabase/migrations/*.sql.
 *
 * In a normal Supabase workflow this file is generated from the live
 * database with `supabase gen types typescript --linked > src/types/database.ts`
 * (see README "How to run locally"). We don't have a live project yet, so
 * this is written by hand to match the migrations exactly. Once you run
 * `supabase link` against a real project, regenerate this file so it can
 * never drift from the actual schema.
 *
 * Shape note: @supabase/postgrest-js requires every table entry to include
 * `Relationships` (even if empty) and the schema object to include `Views`
 * and `Functions` — omitting them makes the whole client's generics
 * silently collapse to `never` instead of erroring loudly, which is a sharp
 * edge worth flagging for whoever regenerates this file by hand again.
 */

export type CareProfileAgeRange = "child_5_9" | "preteen_10_12" | "teen_13_17" | "adult_18_plus";
export type ProfileRole = "caregiver" | "specialist" | "admin";
export type AccessPermission = "view" | "edit";
export type SensorSource = "simulator" | "device";
export type EventState = "mild_elevation" | "elevated" | "high_elevation" | "recovering";
export type AiMessageRole = "user" | "assistant";
export type AiInsightKind = "what_changed" | "pattern" | "daily_summary" | "weekly_report";

interface Table<Row, Insert, Update = Partial<Insert>> {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      profiles: Table<
        { id: string; display_name: string; role: ProfileRole; created_at: string },
        { id: string; display_name?: string; role?: ProfileRole; created_at?: string }
      >;
      care_profiles: Table<
        {
          id: string;
          owner_id: string;
          display_name: string;
          age_range: CareProfileAgeRange | null;
          preferred_language: string;
          communication_preferences: Record<string, unknown>;
          onboarding_complete: boolean;
          onboarding_step: string;
          is_demo: boolean;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          owner_id: string;
          display_name: string;
          age_range?: CareProfileAgeRange | null;
          preferred_language?: string;
          communication_preferences?: Record<string, unknown>;
          onboarding_complete?: boolean;
          onboarding_step?: string;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        }
      >;
      profile_access: Table<
        { id: string; care_profile_id: string; grantee_user_id: string; permission: AccessPermission; created_at: string },
        { id?: string; care_profile_id: string; grantee_user_id: string; permission?: AccessPermission; created_at?: string }
      >;
      triggers: Table<
        { id: string; care_profile_id: string; label: string; is_custom: boolean; created_at: string },
        { id?: string; care_profile_id: string; label: string; is_custom?: boolean; created_at?: string }
      >;
      support_strategies: Table<
        { id: string; care_profile_id: string; label: string; is_custom: boolean; created_at: string },
        { id?: string; care_profile_id: string; label: string; is_custom?: boolean; created_at?: string }
      >;
      profile_preferences: Table<
        { id: string; care_profile_id: string; routine: Record<string, unknown>; notes: string | null; updated_at: string },
        { id?: string; care_profile_id: string; routine?: Record<string, unknown>; notes?: string | null; updated_at?: string }
      >;
      sensor_readings: Table<
        {
          id: string;
          care_profile_id: string;
          source: SensorSource;
          heart_rate: number;
          hrv: number | null;
          gsr: number | null;
          skin_temp: number | null;
          activity_level: number;
          recorded_at: string;
          created_at: string;
        },
        {
          id?: string;
          care_profile_id: string;
          source?: SensorSource;
          heart_rate: number;
          hrv?: number | null;
          gsr?: number | null;
          skin_temp?: number | null;
          activity_level: number;
          recorded_at?: string;
          created_at?: string;
        }
      >;
      baseline_metrics: Table<
        {
          id: string;
          care_profile_id: string;
          metric: "heart_rate" | "hrv" | "gsr" | "skin_temp" | "activity_level";
          baseline_mean: number;
          baseline_stddev: number;
          sample_count: number;
          window_start: string;
          window_end: string;
          computed_at: string;
        },
        {
          id?: string;
          care_profile_id: string;
          metric: "heart_rate" | "hrv" | "gsr" | "skin_temp" | "activity_level";
          baseline_mean: number;
          baseline_stddev?: number;
          sample_count?: number;
          window_start: string;
          window_end: string;
          computed_at?: string;
        }
      >;
      events: Table<
        {
          id: string;
          care_profile_id: string;
          state: EventState;
          deviation_score: number;
          started_at: string;
          ended_at: string | null;
          triggering_reading_id: string | null;
          created_at: string;
        },
        {
          id?: string;
          care_profile_id: string;
          state: EventState;
          deviation_score: number;
          started_at?: string;
          ended_at?: string | null;
          triggering_reading_id?: string | null;
          created_at?: string;
        }
      >;
      observations: Table<
        {
          id: string;
          care_profile_id: string;
          author_id: string | null;
          occurred_at: string;
          environment: string | null;
          activity: string | null;
          possible_trigger: string | null;
          support_action: string | null;
          notes: string | null;
          outcome: string | null;
          event_id: string | null;
          created_at: string;
        },
        {
          id?: string;
          care_profile_id: string;
          author_id?: string | null;
          occurred_at?: string;
          environment?: string | null;
          activity?: string | null;
          possible_trigger?: string | null;
          support_action?: string | null;
          notes?: string | null;
          outcome?: string | null;
          event_id?: string | null;
          created_at?: string;
        }
      >;
      ai_conversations: Table<
        { id: string; care_profile_id: string; user_id: string; title: string | null; created_at: string },
        { id?: string; care_profile_id: string; user_id: string; title?: string | null; created_at?: string }
      >;
      ai_messages: Table<
        {
          id: string;
          conversation_id: string;
          role: AiMessageRole;
          content: string;
          structured_payload: Record<string, unknown> | null;
          created_at: string;
        },
        {
          id?: string;
          conversation_id: string;
          role: AiMessageRole;
          content: string;
          structured_payload?: Record<string, unknown> | null;
          created_at?: string;
        }
      >;
      ai_insights: Table<
        {
          id: string;
          care_profile_id: string;
          kind: AiInsightKind;
          content: Record<string, unknown>;
          generated_at: string;
          created_at: string;
        },
        {
          id?: string;
          care_profile_id: string;
          kind: AiInsightKind;
          content: Record<string, unknown>;
          generated_at?: string;
          created_at?: string;
        }
      >;
      daily_summaries: Table<
        { id: string; care_profile_id: string; period_date: string; content: Record<string, unknown>; created_at: string },
        { id?: string; care_profile_id: string; period_date: string; content: Record<string, unknown>; created_at?: string }
      >;
      weekly_reports: Table<
        {
          id: string;
          care_profile_id: string;
          period_start: string;
          period_end: string;
          content: Record<string, unknown>;
          created_at: string;
        },
        {
          id?: string;
          care_profile_id: string;
          period_start: string;
          period_end: string;
          content: Record<string, unknown>;
          created_at?: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
