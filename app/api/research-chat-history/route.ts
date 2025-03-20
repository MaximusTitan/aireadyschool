import { createClient } from '@/utils/supabase/server'
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Get auth user first
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    // Only get chat history for the authenticated user, now including references_json
    const { data, error } = await supabase
      .from("chat_history_new")
      .select("id, email, prompt, response, references_json, timestamp, conversation")
      .eq("email", user.email)
      .order("timestamp", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to fetch chat history", details: error }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "No data returned from Supabase" }, { status: 500 })
    }

    // Ensure references_json is always an array, even if it's null in the database
    const formattedData = data.map((entry) => ({
      ...entry,
      references: Array.isArray(entry.references_json) ? entry.references_json : [],
      conversation: Array.isArray(entry.conversation) ? entry.conversation : [],
    }))

    return NextResponse.json({ chatHistory: formattedData })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
