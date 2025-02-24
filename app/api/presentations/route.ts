import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Updated to use shared_presentations table instead of presentations
    const { data: presentations, error } = await supabase
      .from("shared_presentations")  // Changed from "presentations" to "shared_presentations"
      .select("*")
      .eq("email", user.email)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      throw error
    }

    return NextResponse.json({ presentations: presentations || [] })
  } catch (error) {
    console.error("Error fetching presentations:", error)
    return NextResponse.json({ error: "Failed to fetch presentations" }, { status: 500 })
  }
}

// Add POST method to save presentations
export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const presentation = await request.json()

    const { data, error } = await supabase
      .from("shared_presentations")
      .insert([
        {
          title: presentation.topic,
          slides: presentation.slides,
          theme: presentation.theme,
          transition: presentation.transition,
          email: user.email
        }
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, presentation: data })
  } catch (error) {
    console.error("Error saving presentation:", error)
    return NextResponse.json({ error: "Failed to save presentation" }, { status: 500 })
  }
}
