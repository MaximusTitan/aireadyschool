import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function PUT(request: Request) {
  try {
    const { assessmentId, questionIndex, answer } = await request.json();
    if (!assessmentId || typeof questionIndex !== "number") {
      return NextResponse.json({ error: "Missing or invalid parameters" }, { status: 400 });
    }

    const supabase = await createClient();
    // Fetch current assessment; expecting columns: answers and questions
    const { data: assessmentData, error } = await supabase
      .from("assessments")
      .select("answers, questions")
      .eq("id", assessmentId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Initialize answers if not present
    let currentAnswers: any[] = assessmentData.answers || new Array(assessmentData.questions.length).fill(null);

    // Update answer at the specified index
    currentAnswers[questionIndex] = answer;

    const { data, error: updateError } = await supabase
      .from("assessments")
      .update({ answers: currentAnswers })
      .eq("id", assessmentId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Error saving answer:", err);
    return NextResponse.json({ error: "Failed to save answer" }, { status: 500 });
  }
}
