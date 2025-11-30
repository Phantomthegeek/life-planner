export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          wake_time: string | null
          sleep_time: string | null
          work_hours_start: string | null
          work_hours_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          wake_time?: string | null
          sleep_time?: string | null
          work_hours_start?: string | null
          work_hours_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          wake_time?: string | null
          sleep_time?: string | null
          work_hours_start?: string | null
          work_hours_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      certifications: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          difficulty: number
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          difficulty?: number
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          difficulty?: number
          created_at?: string
        }
      }
      cert_modules: {
        Row: {
          id: string
          cert_id: string
          title: string
          description: string | null
          estimated_hours: number
          order_idx: number
        }
        Insert: {
          id?: string
          cert_id: string
          title: string
          description?: string | null
          estimated_hours?: number
          order_idx?: number
        }
        Update: {
          id?: string
          cert_id?: string
          title?: string
          description?: string | null
          estimated_hours?: number
          order_idx?: number
        }
      }
      user_cert_progress: {
        Row: {
          id: string
          user_id: string
          cert_id: string
          progress: number
          target_date: string | null
          exam_scheduled: boolean
          exam_date: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          cert_id: string
          progress?: number
          target_date?: string | null
          exam_scheduled?: boolean
          exam_date?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          cert_id?: string
          progress?: number
          target_date?: string | null
          exam_scheduled?: boolean
          exam_date?: string | null
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          detail: string | null
          date: string
          start_ts: string | null
          end_ts: string | null
          duration_minutes: number | null
          category: string | null
          cert_id: string | null
          module_id: string | null
          done: boolean
          recurring: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          detail?: string | null
          date: string
          start_ts?: string | null
          end_ts?: string | null
          duration_minutes?: number | null
          category?: string | null
          cert_id?: string | null
          module_id?: string | null
          done?: boolean
          recurring?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          detail?: string | null
          date?: string
          start_ts?: string | null
          end_ts?: string | null
          duration_minutes?: number | null
          category?: string | null
          cert_id?: string | null
          module_id?: string | null
          done?: boolean
          recurring?: Json | null
          created_at?: string
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          streak: number
          best_streak: number
          last_done: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          streak?: number
          best_streak?: number
          last_done?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          streak?: number
          best_streak?: number
          last_done?: string | null
        }
      }
      notes: {
        Row: {
          id: string
          user_id: string
          date: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          content?: string
          created_at?: string
        }
      }
      ai_queries: {
        Row: {
          id: string
          user_id: string
          prompt: Json
          response: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prompt: Json
          response: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prompt?: Json
          response?: Json
          created_at?: string
        }
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
  }
}

