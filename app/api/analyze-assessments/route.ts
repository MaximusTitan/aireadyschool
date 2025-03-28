import { type NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { aiAnalysisSchema } from "@/app/tools/comparision/lib/ai-schema"
import { supabase } from "@/lib/supabase"
import { processAssessmentData } from "@/app/tools/comparision/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const { studentEmail } = await request.json()

    if (!studentEmail) {
      return NextResponse.json({ error: "Student email is required" }, { status: 400 })
    }

    // Get baseline assessment for the student
    const { data: baselineAssessments, error: baselineError } = await supabase
      .from("assigned_assessments")
      .select("*")
      .eq("student_email", studentEmail)
      .eq("completed", true)
      .eq("test_name", "baseline")

    if (baselineError) throw baselineError
    if (!baselineAssessments || baselineAssessments.length === 0) {
      return NextResponse.json({ error: "No baseline assessment found for this student" }, { status: 404 })
    }

    // Get final assessment for the student
    const { data: finalAssessments, error: finalError } = await supabase
      .from("assigned_assessments")
      .select("*")
      .eq("student_email", studentEmail)
      .eq("completed", true)
      .eq("test_name", "final")

    if (finalError) throw finalError
    if (!finalAssessments || finalAssessments.length === 0) {
      return NextResponse.json({ error: "No final assessment found for this student" }, { status: 404 })
    }

    // Use the most recent assessment of each type if there are multiple
    const baselineAssessment = baselineAssessments.sort(
      (a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime(),
    )[0]

    const finalAssessment = finalAssessments.sort(
      (a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime(),
    )[0]

    // Replace the cache checking code with this improved version
    // Change this:
    const { data: cachedAnalysisResults, error: cacheError } = await supabase
      .from("ai_analysis_cache")
      .select("analysis")
      .eq("student_email", studentEmail)
      .eq("baseline_assessment_id", baselineAssessment.id)
      .eq("final_assessment_id", finalAssessment.id)

    if (cacheError) {
      console.error("Error checking cache:", cacheError)
    }

    // If we have a cached result, return it
    if (cachedAnalysisResults && cachedAnalysisResults.length > 0) {
      console.log("Using cached AI analysis for student:", studentEmail)
      return NextResponse.json({ analysis: cachedAnalysisResults[0].analysis })
    }

    // Process the assessments to get basic metrics
    const processedBaseline = processAssessmentData(baselineAssessment)
    const processedFinal = processAssessmentData(finalAssessment)

    if (!processedBaseline || !processedFinal) {
      return NextResponse.json({ error: "Could not process assessment data" }, { status: 500 })
    }

    // Extract the raw evaluation data to send to OpenAI
    const baselineEvaluation =
      typeof baselineAssessment.evaluation === "string"
        ? JSON.parse(baselineAssessment.evaluation)
        : baselineAssessment.evaluation

    const finalEvaluation =
      typeof finalAssessment.evaluation === "string"
        ? JSON.parse(finalAssessment.evaluation)
        : finalAssessment.evaluation

    console.log("Generating new AI analysis for student:", studentEmail)

    // Generate AI analysis
    const result = await generateObject({
      model: openai("gpt-4o", {
        structuredOutputs: true,
      }),
      schema: aiAnalysisSchema,
      prompt: `
      You are an expert educational data analyst. Analyze these two assessments (baseline and final) for the same student and generate insights about their progress.
      
      The assessments might have different subtopic names but similar overall topics. Identify matching concepts even if they're named differently.
      
      Focus on:
      1. Topic-by-topic comparison and improvement
      2. Skill development across different areas
      3. Learning patterns and confidence changes
      4. Recommended interventions based on the data
      
      BASELINE ASSESSMENT:
      ${JSON.stringify(baselineEvaluation)}
      
      FINAL ASSESSMENT:
      ${JSON.stringify(finalEvaluation)}
      
      Generate a comprehensive analysis that highlights the student's progress, strengths, weaknesses, and recommendations for further improvement.
      
      IMPORTANT: Make sure to normalize topic names between assessments. If a topic exists in only one assessment, estimate its value in the other assessment based on related topics or subtopics.
    `,
    })

    // Store the analysis in the cache
    // Replace the cache insertion code with this improved version
    // Change this:
    // const { error: insertError } = await supabase.from("ai_analysis_cache").insert({
    //   student_email: studentEmail,
    //   baseline_assessment_id: baselineAssessment.id,
    //   final_assessment_id: finalAssessment.id,
    //   analysis: result.object,
    // })

    // if (insertError) {
    //   console.error("Error caching AI analysis:", insertError)
    // }

    // Replace with this:
    // First check if a record already exists
    const { data: existingCache } = await supabase
      .from("ai_analysis_cache")
      .select("id")
      .eq("student_email", studentEmail)
      .eq("baseline_assessment_id", baselineAssessment.id)
      .eq("final_assessment_id", finalAssessment.id)

    let cacheUpdateError = null

    if (existingCache && existingCache.length > 0) {
      // Update existing record
      const { error } = await supabase
        .from("ai_analysis_cache")
        .update({
          analysis: result.object,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingCache[0].id)

      cacheUpdateError = error
    } else {
      // Insert new record
      const { error } = await supabase.from("ai_analysis_cache").insert({
        student_email: studentEmail,
        baseline_assessment_id: baselineAssessment.id,
        final_assessment_id: finalAssessment.id,
        analysis: result.object,
      })

      cacheUpdateError = error
    }

    if (cacheUpdateError) {
      console.error("Error caching AI analysis:", cacheUpdateError)
    }

    return NextResponse.json({ analysis: result.object })
  } catch (error) {
    console.error("Error analyzing assessments:", error)
    return NextResponse.json({ error: "Failed to analyze assessments" }, { status: 500 })
  }
}

