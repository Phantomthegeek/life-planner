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
          timezone: string | null
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
          timezone?: string | null
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
          timezone?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: 'cert_modules_cert_id_fkey'
            columns: ['cert_id']
            referencedRelation: 'certifications'
            referencedColumns: ['id']
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: 'user_cert_progress_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_cert_progress_cert_id_fkey'
            columns: ['cert_id']
            referencedRelation: 'certifications'
            referencedColumns: ['id']
          }
        ]
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
          project_id: string | null
          milestone_id: string | null
          actual_time_minutes: number | null
          tags: string[] | null
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
          project_id?: string | null
          milestone_id?: string | null
          actual_time_minutes?: number | null
          tags?: string[] | null
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
          project_id?: string | null
          milestone_id?: string | null
          actual_time_minutes?: number | null
          tags?: string[] | null
          done?: boolean
          recurring?: Json | null
          created_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          color: string | null
          icon: string | null
          target_date: string | null
          start_date: string | null
          status: string
          progress: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          color?: string | null
          icon?: string | null
          target_date?: string | null
          start_date?: string | null
          status?: string
          progress?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          color?: string | null
          icon?: string | null
          target_date?: string | null
          start_date?: string | null
          status?: string
          progress?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: string | null
          target_date: string | null
          start_date: string
          status: string
          progress: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category?: string | null
          target_date?: string | null
          start_date?: string
          status?: string
          progress?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: string | null
          target_date?: string | null
          start_date?: string
          status?: string
          progress?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      milestones: {
        Row: {
          id: string
          project_id: string | null
          goal_id: string | null
          user_id: string
          name: string
          description: string | null
          target_date: string | null
          completed: boolean
          completed_at: string | null
          order_idx: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          goal_id?: string | null
          user_id: string
          name: string
          description?: string | null
          target_date?: string | null
          completed?: boolean
          completed_at?: string | null
          order_idx?: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string | null
          goal_id?: string | null
          user_id?: string
          name?: string
          description?: string | null
          target_date?: string | null
          completed?: boolean
          completed_at?: string | null
          order_idx?: number
          created_at?: string
        }
        Relationships: []
      }
      time_sessions: {
        Row: {
          id: string
          user_id: string
          task_id: string | null
          project_id: string | null
          start_time: string
          end_time: string | null
          duration_minutes: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id?: string | null
          project_id?: string | null
          start_time: string
          end_time?: string | null
          duration_minutes?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string | null
          project_id?: string | null
          start_time?: string
          end_time?: string | null
          duration_minutes?: number | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      active_time_sessions: {
        Row: {
          user_id: string
          session_id: string
          task_id: string | null
          started_at: string
        }
        Insert: {
          user_id: string
          session_id: string
          task_id?: string | null
          started_at?: string
        }
        Update: {
          user_id?: string
          session_id?: string
          task_id?: string | null
          started_at?: string
        }
        Relationships: []
      }
      productivity_patterns: {
        Row: {
          id: string
          user_id: string
          pattern_type: string
          pattern_data: Json
          confidence_score: number
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pattern_type: string
          pattern_data: Json
          confidence_score?: number
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          pattern_type?: string
          pattern_data?: Json
          confidence_score?: number
          last_updated?: string
          created_at?: string
        }
        Relationships: []
      }
      task_completion_history: {
        Row: {
          id: string
          user_id: string
          task_id: string | null
          scheduled_start: string | null
          actual_start: string | null
          scheduled_end: string | null
          actual_end: string | null
          estimated_minutes: number | null
          actual_minutes: number | null
          completed_on_time: boolean | null
          rescheduled_count: number
          energy_level: number | null
          difficulty_rating: number | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id?: string | null
          scheduled_start?: string | null
          actual_start?: string | null
          scheduled_end?: string | null
          actual_end?: string | null
          estimated_minutes?: number | null
          actual_minutes?: number | null
          completed_on_time?: boolean | null
          rescheduled_count?: number
          energy_level?: number | null
          difficulty_rating?: number | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string | null
          scheduled_start?: string | null
          actual_start?: string | null
          scheduled_end?: string | null
          actual_end?: string | null
          estimated_minutes?: number | null
          actual_minutes?: number | null
          completed_on_time?: boolean | null
          rescheduled_count?: number
          energy_level?: number | null
          difficulty_rating?: number | null
          completed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      weekly_summaries: {
        Row: {
          id: string
          user_id: string
          week_start: string
          week_end: string
          tasks_completed: number
          tasks_planned: number
          hours_tracked: number
          habits_maintained: number
          productivity_score: number | null
          insights: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start: string
          week_end: string
          tasks_completed?: number
          tasks_planned?: number
          hours_tracked?: number
          habits_maintained?: number
          productivity_score?: number | null
          insights?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_start?: string
          week_end?: string
          tasks_completed?: number
          tasks_planned?: number
          hours_tracked?: number
          habits_maintained?: number
          productivity_score?: number | null
          insights?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      calendar_integrations: {
        Row: {
          id: string
          user_id: string
          provider: string
          access_token: string | null
          refresh_token: string | null
          calendar_id: string | null
          sync_enabled: boolean
          sync_direction: string
          last_synced_at: string | null
          last_sync_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          access_token?: string | null
          refresh_token?: string | null
          calendar_id?: string | null
          sync_enabled?: boolean
          sync_direction?: string
          last_synced_at?: string | null
          last_sync_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          access_token?: string | null
          refresh_token?: string | null
          calendar_id?: string | null
          sync_enabled?: boolean
          sync_direction?: string
          last_synced_at?: string | null
          last_sync_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      external_calendar_events: {
        Row: {
          id: string
          user_id: string
          integration_id: string | null
          external_id: string
          title: string
          start_time: string
          end_time: string
          description: string | null
          location: string | null
          imported_as_task: boolean
          task_id: string | null
          last_synced_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          integration_id?: string | null
          external_id: string
          title: string
          start_time: string
          end_time: string
          description?: string | null
          location?: string | null
          imported_as_task?: boolean
          task_id?: string | null
          last_synced_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          integration_id?: string | null
          external_id?: string
          title?: string
          start_time?: string
          end_time?: string
          description?: string | null
          location?: string | null
          imported_as_task?: boolean
          task_id?: string | null
          last_synced_at?: string
          created_at?: string
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          id: string
          user_id: string
          name: string
          trigger_type: string
          trigger_config: Json
          action_type: string
          action_config: Json
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          trigger_type: string
          trigger_config: Json
          action_type: string
          action_config: Json
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          trigger_type?: string
          trigger_config?: Json
          action_type?: string
          action_config?: Json
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_relationships: {
        Row: {
          id: string
          task_id: string
          related_task_id: string
          relationship_type: string
          strength: number
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          related_task_id: string
          relationship_type: string
          strength?: number
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          related_task_id?: string
          relationship_type?: string
          strength?: number
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      task_context: {
        Row: {
          task_id: string
          project_priority_score: number
          goal_impact_score: number
          certification_urgency: number
          habit_correlation: number
          overall_priority_score: number
          completion_likelihood: number
          updated_at: string
        }
        Insert: {
          task_id: string
          project_priority_score?: number
          goal_impact_score?: number
          certification_urgency?: number
          habit_correlation?: number
          overall_priority_score?: number
          completion_likelihood?: number
          updated_at?: string
        }
        Update: {
          task_id?: string
          project_priority_score?: number
          goal_impact_score?: number
          certification_urgency?: number
          habit_correlation?: number
          overall_priority_score?: number
          completion_likelihood?: number
          updated_at?: string
        }
        Relationships: []
      }
      system_events: {
        Row: {
          id: string
          user_id: string
          event_type: string
          entity_type: string | null
          entity_id: string | null
          event_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          entity_type?: string | null
          entity_id?: string | null
          event_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_type?: string
          entity_type?: string | null
          entity_id?: string | null
          event_data?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          id: string
          user_id: string
          title: string | null
          mode: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          mode?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          mode?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          conversation_id: string
          role: string
          content: string
          mode: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: string
          content: string
          mode?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: string
          content?: string
          mode?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      chat_memory: {
        Row: {
          id: string
          user_id: string
          memory_type: string
          memory_key: string
          memory_value: Json
          confidence: number
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          memory_type: string
          memory_key: string
          memory_value: Json
          confidence?: number
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          memory_type?: string
          memory_key?: string
          memory_value?: Json
          confidence?: number
          last_updated?: string
          created_at?: string
        }
        Relationships: []
      }
      chat_flashcards: {
        Row: {
          id: string
          user_id: string
          conversation_id: string | null
          message_id: string | null
          front: string
          back: string
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          conversation_id?: string | null
          message_id?: string | null
          front: string
          back: string
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          conversation_id?: string | null
          message_id?: string | null
          front?: string
          back?: string
          category?: string | null
          created_at?: string
        }
        Relationships: []
      }
      chat_quizzes: {
        Row: {
          id: string
          user_id: string
          conversation_id: string | null
          message_id: string | null
          question: string
          options: Json
          correct_answer: number
          explanation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          conversation_id?: string | null
          message_id?: string | null
          question: string
          options: Json
          correct_answer: number
          explanation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          conversation_id?: string | null
          message_id?: string | null
          question?: string
          options?: Json
          correct_answer?: number
          explanation?: string | null
          created_at?: string
        }
        Relationships: []
      }
      cert_lessons: {
        Row: {
          id: string
          module_id: string
          title: string
          description: string | null
          content_type: string
          order_idx: number
          estimated_minutes: number
          difficulty_level: number
          ai_generated: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          module_id: string
          title: string
          description?: string | null
          content_type?: string
          order_idx?: number
          estimated_minutes?: number
          difficulty_level?: number
          ai_generated?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          title?: string
          description?: string | null
          content_type?: string
          order_idx?: number
          estimated_minutes?: number
          difficulty_level?: number
          ai_generated?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cert_lesson_content: {
        Row: {
          id: string
          lesson_id: string
          content_type: string
          content_data: Json
          ai_generated: boolean
          generated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          content_type: string
          content_data: Json
          ai_generated?: boolean
          generated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          content_type?: string
          content_data?: Json
          ai_generated?: boolean
          generated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cert_quizzes: {
        Row: {
          id: string
          lesson_id: string | null
          module_id: string | null
          title: string
          description: string | null
          question_type: string
          difficulty_level: number
          ai_generated: boolean
          created_at: string
        }
        Insert: {
          id?: string
          lesson_id?: string | null
          module_id?: string | null
          title: string
          description?: string | null
          question_type?: string
          difficulty_level?: number
          ai_generated?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string | null
          module_id?: string | null
          title?: string
          description?: string | null
          question_type?: string
          difficulty_level?: number
          ai_generated?: boolean
          created_at?: string
        }
        Relationships: []
      }
      cert_quiz_questions: {
        Row: {
          id: string
          quiz_id: string
          question: string
          question_type: string
          options: Json | null
          correct_answer: string
          explanation: string | null
          difficulty_level: number
          order_idx: number
          ai_generated: boolean
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          question: string
          question_type?: string
          options?: Json | null
          correct_answer: string
          explanation?: string | null
          difficulty_level?: number
          order_idx?: number
          ai_generated?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          question?: string
          question_type?: string
          options?: Json | null
          correct_answer?: string
          explanation?: string | null
          difficulty_level?: number
          order_idx?: number
          ai_generated?: boolean
          created_at?: string
        }
        Relationships: []
      }
      cert_quiz_attempts: {
        Row: {
          id: string
          user_id: string
          quiz_id: string
          score: number
          total_questions: number
          correct_answers: number
          time_taken_minutes: number | null
          completed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          quiz_id: string
          score?: number
          total_questions: number
          correct_answers: number
          time_taken_minutes?: number | null
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          quiz_id?: string
          score?: number
          total_questions?: number
          correct_answers?: number
          time_taken_minutes?: number | null
          completed_at?: string
          created_at?: string
        }
        Relationships: []
      }
      cert_quiz_answers: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          user_answer: string
          is_correct: boolean
          time_spent_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          user_answer: string
          is_correct: boolean
          time_spent_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          attempt_id?: string
          question_id?: string
          user_answer?: string
          is_correct?: boolean
          time_spent_seconds?: number | null
          created_at?: string
        }
        Relationships: []
      }
      cert_flashcards: {
        Row: {
          id: string
          module_id: string
          lesson_id: string | null
          front: string
          back: string
          category: string | null
          difficulty_level: number
          ai_generated: boolean
          created_at: string
        }
        Insert: {
          id?: string
          module_id: string
          lesson_id?: string | null
          front: string
          back: string
          category?: string | null
          difficulty_level?: number
          ai_generated?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          lesson_id?: string | null
          front?: string
          back?: string
          category?: string | null
          difficulty_level?: number
          ai_generated?: boolean
          created_at?: string
        }
        Relationships: []
      }
      cert_flashcard_sessions: {
        Row: {
          id: string
          user_id: string
          flashcard_id: string
          difficulty_rating: number | null
          correct: boolean
          review_due_at: string | null
          times_studied: number
          last_studied_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          flashcard_id: string
          difficulty_rating?: number | null
          correct: boolean
          review_due_at?: string | null
          times_studied?: number
          last_studied_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          flashcard_id?: string
          difficulty_rating?: number | null
          correct?: boolean
          review_due_at?: string | null
          times_studied?: number
          last_studied_at?: string
          created_at?: string
        }
        Relationships: []
      }
      cert_learning_sessions: {
        Row: {
          id: string
          user_id: string
          cert_id: string | null
          module_id: string | null
          lesson_id: string | null
          session_type: string
          start_time: string
          end_time: string | null
          duration_minutes: number | null
          progress_percentage: number | null
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          cert_id?: string | null
          module_id?: string | null
          lesson_id?: string | null
          session_type: string
          start_time: string
          end_time?: string | null
          duration_minutes?: number | null
          progress_percentage?: number | null
          completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          cert_id?: string | null
          module_id?: string | null
          lesson_id?: string | null
          session_type?: string
          start_time?: string
          end_time?: string | null
          duration_minutes?: number | null
          progress_percentage?: number | null
          completed?: boolean
          created_at?: string
        }
        Relationships: []
      }
      cert_notes: {
        Row: {
          id: string
          user_id: string
          module_id: string | null
          lesson_id: string | null
          content: string
          highlights: string[] | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_id?: string | null
          lesson_id?: string | null
          content: string
          highlights?: string[] | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_id?: string | null
          lesson_id?: string | null
          content?: string
          highlights?: string[] | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cert_progress_detailed: {
        Row: {
          id: string
          user_id: string
          module_id: string
          lesson_id: string | null
          completion_status: string
          progress_percentage: number
          time_spent_minutes: number
          last_accessed_at: string | null
          completed_at: string | null
          mastery_score: number | null
          adaptive_difficulty: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_id: string
          lesson_id?: string | null
          completion_status?: string
          progress_percentage?: number
          time_spent_minutes?: number
          last_accessed_at?: string | null
          completed_at?: string | null
          mastery_score?: number | null
          adaptive_difficulty?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_id?: string
          lesson_id?: string | null
          completion_status?: string
          progress_percentage?: number
          time_spent_minutes?: number
          last_accessed_at?: string | null
          completed_at?: string | null
          mastery_score?: number | null
          adaptive_difficulty?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cert_revision_reminders: {
        Row: {
          id: string
          user_id: string
          module_id: string | null
          lesson_id: string | null
          reminder_type: string
          due_at: string
          priority: number
          completed: boolean
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_id?: string | null
          lesson_id?: string | null
          reminder_type: string
          due_at: string
          priority?: number
          completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_id?: string | null
          lesson_id?: string | null
          reminder_type?: string
          due_at?: string
          priority?: number
          completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      cert_tutor_conversations: {
        Row: {
          id: string
          user_id: string
          cert_id: string | null
          module_id: string | null
          lesson_id: string | null
          title: string | null
          context: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          cert_id?: string | null
          module_id?: string | null
          lesson_id?: string | null
          title?: string | null
          context?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          cert_id?: string | null
          module_id?: string | null
          lesson_id?: string | null
          title?: string | null
          context?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cert_tutor_messages: {
        Row: {
          id: string
          conversation_id: string
          chat_message_id: string | null
          learning_context: Json | null
          message_type: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          chat_message_id?: string | null
          learning_context?: Json | null
          message_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          chat_message_id?: string | null
          learning_context?: Json | null
          message_type?: string
          created_at?: string
        }
        Relationships: []
      }
      cert_projects: {
        Row: {
          id: string
          module_id: string | null
          cert_id: string | null
          title: string
          description: string | null
          instructions: string
          project_type: string
          difficulty_level: number
          ai_generated: boolean
          created_at: string
        }
        Insert: {
          id?: string
          module_id?: string | null
          cert_id?: string | null
          title: string
          description?: string | null
          instructions: string
          project_type?: string
          difficulty_level?: number
          ai_generated?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          module_id?: string | null
          cert_id?: string | null
          title?: string
          description?: string | null
          instructions?: string
          project_type?: string
          difficulty_level?: number
          ai_generated?: boolean
          created_at?: string
        }
        Relationships: []
      }
      cert_project_submissions: {
        Row: {
          id: string
          user_id: string
          project_id: string
          submission_data: Json
          ai_feedback: Json | null
          score: number | null
          status: string
          submitted_at: string
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          submission_data: Json
          ai_feedback?: Json | null
          score?: number | null
          status?: string
          submitted_at?: string
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          submission_data?: Json
          ai_feedback?: Json | null
          score?: number | null
          status?: string
          submitted_at?: string
          reviewed_at?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          created_at?: string
        }
        Relationships: []
      }
      export_logs: {
        Row: {
          id: string
          user_id: string
          export_type: string
          data_type: string
          file_path: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          export_type: string
          data_type: string
          file_path?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          export_type?: string
          data_type?: string
          file_path?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_gamification: {
        Row: {
          user_id: string
          xp: number
          level: number
          total_tasks_completed: number
          total_habits_completed: number
          streak: number
          achievements: Json
          updated_at: string
        }
        Insert: {
          user_id: string
          xp?: number
          level?: number
          total_tasks_completed?: number
          total_habits_completed?: number
          streak?: number
          achievements?: Json
          updated_at?: string
        }
        Update: {
          user_id?: string
          xp?: number
          level?: number
          total_tasks_completed?: number
          total_habits_completed?: number
          streak?: number
          achievements?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_task_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          title: string
          detail: string | null
          duration_minutes: number
          category: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          title: string
          detail?: string | null
          duration_minutes?: number
          category?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          title?: string
          detail?: string | null
          duration_minutes?: number
          category?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      task_graph_summary: {
        Row: {
          task_id: string
          user_id: string
          title: string
          date: string
          overall_priority_score: number | null
          completion_likelihood: number | null
          project_name: string | null
          certification_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_task_relations: {
        Args: { p_task_id: string }
        Returns: {
          task_id: string
          related_task_id: string
          relationship_type: string
          strength: number
          related_task_title: string
        }[]
      }
      calculate_task_priority: {
        Args: { p_task_id: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
