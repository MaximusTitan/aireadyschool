import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { logTokenUsage } from '@/utils/logTokenUsage';

export async function GET(request: NextRequest) {
  try {
    // Get the query parameters
    const searchParams = request.nextUrl.searchParams;
    const assessmentId = searchParams.get('assessmentId');
    const studentId = searchParams.get('studentId');

    if (!assessmentId || !studentId) {
      return NextResponse.json(
        { error: "Missing assessmentId or studentId" },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();
    
    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - authentication required" },
        { status: 401 }
      );
    }

    // Fetch the assigned assessment data
    const { data: assignedAssessment, error: assignedError } = await supabase
      .from("assigned_assessments")
      .select("evaluation, assessment_id, student_answers, score")
      .eq("assessment_id", assessmentId)
      .eq("student_id", studentId)
      .single();

    if (assignedError) {
      console.error("Error fetching assigned assessment:", assignedError);
      return NextResponse.json(
        { error: "Failed to fetch assigned assessment" },
        { status: 404 }
      );
    }

    // If there's no evaluation data
    if (!assignedAssessment.evaluation) {
      return NextResponse.json(
        { error: "No evaluation data available for this assessment" },
        { status: 404 }
      );
    }

    // Fetch the assessment details
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select("subject, topic, class_level, board, assessment_type, questions, learning_outcomes")
      .eq("id", assessmentId)
      .single();

    if (assessmentError) {
      console.error("Error fetching assessment:", assessmentError);
      return NextResponse.json(
        { error: "Failed to fetch assessment details" },
        { status: 404 }
      );
    }

    // Check if we have existing lesson plan data
    if (assignedAssessment?.evaluation?.lesson_plan) {
      const existingPlan = assignedAssessment.evaluation.lesson_plan;
      
      // Create response with existing data and raw evaluation JSON
      return NextResponse.json({
        lessonObjectives: existingPlan.lessonObjectives || "",
        learningOutcomes: existingPlan.learningOutcomes || "",
        additionalInstructions: JSON.stringify(assignedAssessment.evaluation, null, 2)
      });
    }

    // Generate lesson objectives and learning outcomes based on assessment data
    const prompt = `
I need to create lesson objectives and learning outcomes based on a student's assessment results. Here's the data:

Assessment Information:
- Subject: ${assessment.subject}
- Topic: ${assessment.topic}
- Grade Level: ${assessment.class_level}
- Board: ${assessment.board || 'Not specified'}
- Assessment Type: ${assessment.assessment_type}
${assessment.learning_outcomes ? `- Learning Outcomes: ${Array.isArray(assessment.learning_outcomes) 
  ? assessment.learning_outcomes.join(', ')
  : typeof assessment.learning_outcomes === 'string' 
    ? assessment.learning_outcomes
    : JSON.stringify(assessment.learning_outcomes)}` : ''}

Student Performance:
- Score: ${assignedAssessment.score !== null ? `${assignedAssessment.score}%` : 'Not available'}
${assignedAssessment.evaluation?.areas_for_improvement ? `- Areas for improvement: ${Array.isArray(assignedAssessment.evaluation.areas_for_improvement) 
  ? assignedAssessment.evaluation.areas_for_improvement.join(', ')
  : assignedAssessment.evaluation.areas_for_improvement}` : ''}
${assignedAssessment.evaluation?.strengths ? `- Strengths: ${Array.isArray(assignedAssessment.evaluation.strengths)
  ? assignedAssessment.evaluation.strengths.join(', ')
  : assignedAssessment.evaluation.strengths}` : ''}

Based on this information, please generate only:

1. Lesson Objectives: A concise paragraph describing what the lesson should aim to achieve, focusing on addressing any identified areas for improvement.

2. Learning Outcomes: A list of 3-5 specific, measurable learning outcomes that students should be able to demonstrate after the lesson.

Return your response as a JSON object with the fields: lessonObjectives, learningOutcomes.
`;

    // Generate content using AI
    const { text: generatedContent, usage } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.7,
      maxTokens: 800
    });

    // Log token usage
    if (usage) {
      await logTokenUsage(
        'Assessment Lesson Plan Generator',
        'GPT-4o',
        usage.promptTokens,
        usage.completionTokens,
        user.email
      );
    }

    // Parse the generated content
    let parsedContent;
    try {
      // Find JSON in the response
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in the response");
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.log("Raw response:", generatedContent);
      
      // Attempt to extract content without JSON parsing
      const lessonObjectivesMatch = generatedContent.match(/Lesson Objectives:(.*?)(?=Learning Outcomes:|$)/s);
      const learningOutcomesMatch = generatedContent.match(/Learning Outcomes:(.*?)(?=$)/s);
      
      parsedContent = {
        lessonObjectives: lessonObjectivesMatch ? lessonObjectivesMatch[1].trim() : "",
        learningOutcomes: learningOutcomesMatch ? learningOutcomesMatch[1].trim() : ""
      };
    }

    // Create the response object with generated content and raw evaluation JSON
    const responseData = {
      lessonObjectives: parsedContent?.lessonObjectives || "",
      learningOutcomes: parsedContent?.learningOutcomes || "",
      additionalInstructions: JSON.stringify(assignedAssessment.evaluation, null, 2)
    };

    // Save the generated content to the database
    if (parsedContent) {
      // Update the evaluation object with lesson plan data
      let evaluation = assignedAssessment.evaluation || {};
      evaluation.lesson_plan = responseData;
      
      const { error: updateError } = await supabase
        .from("assigned_assessments")
        .update({ evaluation })
        .eq("assessment_id", assessmentId)
        .eq("student_id", studentId);
      
      if (updateError) {
        console.error("Error updating assigned assessment with lesson plan data:", updateError);
      }
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error generating assessment-based lesson plan inputs:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
