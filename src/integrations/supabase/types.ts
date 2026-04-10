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
      application_versions: {
        Row: {
          career_track: string
          cover_letter: string
          created_at: string
          id: string
          insights: Json
          job_description_snippet: string
          reference_influence: number
          resume: string
          user_id: string
          version_label: string | null
        }
        Insert: {
          career_track: string
          cover_letter: string
          created_at?: string
          id?: string
          insights?: Json
          job_description_snippet?: string
          reference_influence?: number
          resume: string
          user_id: string
          version_label?: string | null
        }
        Update: {
          career_track?: string
          cover_letter?: string
          created_at?: string
          id?: string
          insights?: Json
          job_description_snippet?: string
          reference_influence?: number
          resume?: string
          user_id?: string
          version_label?: string | null
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          created_at: string
          id: string
          job_id: string
          notes: string | null
          status: string
          tailored_cover_letter: string | null
          tailored_resume: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          notes?: string | null
          status?: string
          tailored_cover_letter?: string | null
          tailored_resume?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          notes?: string | null
          status?: string
          tailored_cover_letter?: string | null
          tailored_resume?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          career_track: string
          company: string
          created_at: string
          description: string
          id: string
          keywords: string[] | null
          location: string | null
          posted_date: string | null
          salary_range: string | null
          seniority: string | null
          source: string | null
          source_url: string | null
          title: string
          work_mode: string | null
        }
        Insert: {
          career_track: string
          company: string
          created_at?: string
          description?: string
          id?: string
          keywords?: string[] | null
          location?: string | null
          posted_date?: string | null
          salary_range?: string | null
          seniority?: string | null
          source?: string | null
          source_url?: string | null
          title: string
          work_mode?: string | null
        }
        Update: {
          career_track?: string
          company?: string
          created_at?: string
          description?: string
          id?: string
          keywords?: string[] | null
          location?: string | null
          posted_date?: string | null
          salary_range?: string | null
          seniority?: string | null
          source?: string | null
          source_url?: string | null
          title?: string
          work_mode?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          excluded_job_types: string[] | null
          hard_skills: string[] | null
          id: string
          preferred_career_tracks: string[] | null
          preferred_functions: string[] | null
          summary: string | null
          target_industries: string[] | null
          target_locations: string[] | null
          target_seniority: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          excluded_job_types?: string[] | null
          hard_skills?: string[] | null
          id?: string
          preferred_career_tracks?: string[] | null
          preferred_functions?: string[] | null
          summary?: string | null
          target_industries?: string[] | null
          target_locations?: string[] | null
          target_seniority?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          excluded_job_types?: string[] | null
          hard_skills?: string[] | null
          id?: string
          preferred_career_tracks?: string[] | null
          preferred_functions?: string[] | null
          summary?: string | null
          target_industries?: string[] | null
          target_locations?: string[] | null
          target_seniority?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          career_track: string | null
          content: string
          created_at: string
          file_name: string
          id: string
          is_master: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          career_track?: string | null
          content?: string
          created_at?: string
          file_name: string
          id?: string
          is_master?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          career_track?: string | null
          content?: string
          created_at?: string
          file_name?: string
          id?: string
          is_master?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_jobs: {
        Row: {
          created_at: string
          id: string
          job_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
