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
      user_profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          language: 'ar' | 'en'
          theme: 'light' | 'dark'
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          language?: 'ar' | 'en'
          theme?: 'light' | 'dark'
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          language?: 'ar' | 'en'
          theme?: 'light' | 'dark'
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      chats: {
        Row: {
          id: string
          user_id: string
          title_ar: string | null
          title_en: string | null
          is_archived: boolean
          pdf_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title_ar?: string | null
          title_en?: string | null
          is_archived?: boolean
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title_ar?: string | null
          title_en?: string | null
          is_archived?: boolean
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          role: 'user' | 'assistant'
          content_ar: string
          thinking_block: string | null
          follow_up_questions: Json | null
          reply_length: 'short' | 'detailed' | 'article' | null
          token_count: number | null
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          role: 'user' | 'assistant'
          content_ar: string
          thinking_block?: string | null
          follow_up_questions?: Json | null
          reply_length?: 'short' | 'detailed' | 'article' | null
          token_count?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          role?: 'user' | 'assistant'
          content_ar?: string
          thinking_block?: string | null
          follow_up_questions?: Json | null
          reply_length?: 'short' | 'detailed' | 'article' | null
          token_count?: number | null
          created_at?: string
        }
      }
      references: {
        Row: {
          id: string
          category: string
          author: string | null
          title: string
          year: number | null
          language: string | null
          url: string | null
          source_type: string | null
          format: string | null
          subject_focus: string | null
          created_at: string
        }
        Insert: {
          id?: string
          category: string
          author?: string | null
          title: string
          year?: number | null
          language?: string | null
          url?: string | null
          source_type?: string | null
          format?: string | null
          subject_focus?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          category?: string
          author?: string | null
          title?: string
          year?: number | null
          language?: string | null
          url?: string | null
          source_type?: string | null
          format?: string | null
          subject_focus?: string | null
          created_at?: string
        }
      }
      topics: {
        Row: {
          id: string
          name_ar: string
          name_en: string
          category: string | null
          description_ar: string | null
          description_en: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name_ar: string
          name_en: string
          category?: string | null
          description_ar?: string | null
          description_en?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name_ar?: string
          name_en?: string
          category?: string | null
          description_ar?: string | null
          description_en?: string | null
          created_at?: string
        }
      }
      message_references: {
        Row: {
          message_id: string
          reference_id: string
        }
        Insert: {
          message_id: string
          reference_id: string
        }
        Update: {
          message_id?: string
          reference_id?: string
        }
      }
      message_topics: {
        Row: {
          message_id: string
          topic_id: string
        }
        Insert: {
          message_id: string
          topic_id: string
        }
        Update: {
          message_id?: string
          topic_id?: string
        }
      }
    }
  }
}