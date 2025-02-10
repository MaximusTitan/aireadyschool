import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("chat_history_new")
      .select("id, email, prompt, response, timestamp, conversation")
      .order("timestamp", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to fetch chat history", details: error }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "No data returned from Supabase" }, { status: 500 })
    }

    // Ensure conversation is an array, even if it's null in the database
    const formattedData = data.map((entry) => ({
      ...entry,
      conversation: Array.isArray(entry.conversation) ? entry.conversation : [],
    }))

    return NextResponse.json({ chatHistory: formattedData })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred", details: error }, { status: 500 })
  }
}
