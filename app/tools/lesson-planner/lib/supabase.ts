import { createClient } from "@supabase/supabase-js"

// Check if we're in a development environment
const isDevelopment = process.env.NODE_ENV === "development"

// Use mock values for development if environment variables are not set
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || (isDevelopment ? "https://xndjwmkypyilvkyczvbj.supabase.co" : undefined)
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (isDevelopment
    ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuZGp3bWt5cHlpbHZreWN6dmJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNTA3MDQsImV4cCI6MjA1MTcyNjcwNH0.t9YnDMzYMc3kbpQZnSPgKsT6iAg30Emb7QzakJX5yrE"
    : undefined)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase environment variables. Please check your .env file or environment settings.\n" +
      "Required variables:\n" +
      "- NEXT_PUBLIC_SUPABASE_URL\n" +
      "- NEXT_PUBLIC_SUPABASE_ANON_KEY",
  )

  if (!isDevelopment) {
    throw new Error("Supabase environment variables are required in production.")
  }
}

// Create the Supabase client
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey)
}
