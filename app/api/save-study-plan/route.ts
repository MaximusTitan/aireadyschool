import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const {
      grade,
      board,
      subject,
      syllabus,
      learning_goal,
      areas_of_improvement,
      available_days,
      available_study_time,
      studyPlan,
      user_email  // new field from client
    } = body

    const { data, error } = await supabase
      .from("study_plans")
      .insert({
        grade,
        board,
        subject,
        syllabus,
        learning_goal,
        areas_of_improvement,
        available_days,
        available_study_time,
        user_email,  // insert the user email
        Day: JSON.stringify(studyPlan.map((day: any) => day.day)),
        "Focus Areas": JSON.stringify(studyPlan.map((day: any) => day.focusAreas)),
        Activities: JSON.stringify(studyPlan.map((day: any) => day.activities)),
      })
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Error in API route:", error)
    return NextResponse.json(
      { error: `An error occurred while saving the study plan: ${error.message}` },
      { status: 500 },
    )
  }
}

