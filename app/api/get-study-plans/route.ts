import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("study_plans").select("*").order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Error fetching study plans:", error)
    return NextResponse.json(
      { error: `An error occurred while fetching study plans: ${error.message}` },
      { status: 500 },
    )
  }
}

