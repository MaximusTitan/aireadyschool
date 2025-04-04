import { NextRequest, NextResponse } from "next/server";
import { generatePresentation } from "@/app/tools/presentation/actions/generatePresentation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, theme, transition, slideCount = 8 } = body;

    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    // Generate the presentation with explicit image generation
    const presentation = await generatePresentation(
      topic,
      theme || "modern",
      slideCount || 8,
      "", // learningObjective
      "general", // gradeLevel
      "", // relevantTopic
      false, // includeQuiz
      false, // includeQuestions
      false, // includeFeedback
      true, // generateImages - ALWAYS set to true
      "gpt4o" // model
    );

    // Get the authenticated user from cookies
    // This will properly re-use the existing session from the lesson planner
    const cookieStore = cookies();
    const supabase = createClient();
    
    const { data: { user }, error: userError } = await (await supabase).auth.getUser();
    
    if (userError || !user?.email) {
      console.warn("User not authenticated, presentation generated but not saved");
      // Still return the presentation for use
      return NextResponse.json({
        success: false,
        authError: "Not authenticated",
        presentation: presentation
      });
    }

    // Save the presentation using a direct Supabase call 
    // (bypassing the savePresentations server action that's failing)
    const { data, error } = await (await supabase)
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
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({
        success: false,
        dbError: error.message,
        presentation: presentation
      });
    }

    // Successfully saved
    return NextResponse.json({
      success: true,
      presentation: presentation,
      url: `/tools/presentation/view/${data.id}`,
      presentationId: data.id
    });
  } catch (error: any) {
    console.error("Error generating presentation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate presentation" },
      { status: 500 }
    );
  }
}