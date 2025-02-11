export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      shared_presentations: {
        Row: {
          id: string
          title: string
          slides: Json
          created_at: string
          theme: string | null
          transition: string | null
        }
        Insert: {
          id?: string
          title: string
          slides: Json
          created_at?: string
          theme?: string | null
          transition?: string | null
        }
        Update: {
          id?: string
          title?: string
          slides?: Json
          created_at?: string
          theme?: string | null
          transition?: string | null
        }
      }
    }
  }
}

