import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Check for environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL. Please ensure this environment variable is set in your Vercel project settings.",
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Please ensure this environment variable is set in your Vercel project settings.",
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
