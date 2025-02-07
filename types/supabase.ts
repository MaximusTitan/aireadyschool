// types/supabase.ts
export type Database = {
    public: {
      Tables: {
        songs: {
          Row: {
            id: string
            user_id: string
            prompt: string
            lyrics: string
            reference_audio_url: string
            generated_audio_url: string
            song_description: string
            created_at: string
          }
          Insert: {
            user_id: string
            prompt: string
            lyrics: string
            reference_audio_url: string
            generated_audio_url?: string
            song_description?: string
          }
        }
      }
    }
  }