import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { studentEmail } = await request.json()

    // Start with delete operation first
    let query = supabase.from("ai_analysis_cache").delete()

    // If a student email is provided, add the filter
    if (studentEmail) {
      query = query.eq("student_email", studentEmail)
    }

    const { error } = await query

    if (error) {
      console.error("Database error when clearing cache:", error)
      return NextResponse.json({ error: `Failed to clear cache: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: studentEmail ? `Cache cleared for student: ${studentEmail}` : "All analysis cache cleared",
    })
  } catch (error) {
    console.error("Error clearing analysis cache:", error)
    return NextResponse.json({ error: "Failed to clear analysis cache" }, { status: 500 })
  }
}

