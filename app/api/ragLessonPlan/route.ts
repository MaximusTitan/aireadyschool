import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { logTokenUsage } from '@/utils/logTokenUsage';
import { z } from "zod";

// Reuse the same schemas from generateLessonPlan
const scheduleItemSchema = z.object({
  type: z.enum(["introduction", "mainContent", "activity", "conclusion", "review", "assessment"]),
  title: z.string(),
  content: z.string(),
  timeAllocation: z.number(),
});

const daySchema = z.object({
  day: z.number(),
  topicHeading: z.string(),
  learningOutcomes: z.array(z.string()),
  schedule: z.array(scheduleItemSchema),
  teachingAids: z.array(z.string()),
  assignment: z.object({
    description: z.string(),
    tasks: z.array(z.string()),
  }).required(),
  assessment: z.object({
    topic: z.string(),
    learningObjectives: z.array(z.string()),
  }).required(),
});

const assessmentSchema = z.object({
  topic: z.string(),
  type: z.string(),
  description: z.string(),
  evaluationCriteria: z.array(z.string()),
});

const lessonPlanSchema = z.object({
  days: z.array(daySchema),
  assessmentPlan: z.object({
    formativeAssessments: z.array(assessmentSchema),
    summativeAssessments: z.array(assessmentSchema),
    progressTrackingSuggestions: z.array(z.string()),
  }),
  remedialStrategies: z.array(
    z.object({
      targetGroup: z.string(),
      strategy: z.string(),
      description: z.string(),
    })
  ),
});

export async function POST(request: Request) {
  try {
    // Parse the request body
    const {
      subject,
      grade,
      chapterTopic,
      board,
      classDuration,
      numberOfDays,
      learningObjectives,
      lessonObjectives,
      additionalInstructions,
      userEmail,
      assessmentId,
      studentId,
      selectedDocument, // New parameter for the selected document ID
    } = await request.json();

    // Validate required fields
    if (!chapterTopic || !classDuration || !numberOfDays || !selectedDocument) {
      return NextResponse.json(
        { error: "Missing required fields including selected document" },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - authentication required" },
        { status: 401 }
      );
    }

    // Fetch the document content from knowledge_base
    const { data: documentData, error: documentError } = await supabase
      .from("knowledge_base")
      .select("*")
      .eq("id", selectedDocument)
      .single();

    if (documentError || !documentData) {
      return NextResponse.json(
        { error: "Failed to fetch document content" },
        { status: 404 }
      );
    }

    console.log("Generating RAG-based lesson plan for:", {
      subject: documentData.subject,
      chapterTopic,
      grade: documentData.grade,
      board: documentData.education_board,
      classDuration,
      numberOfDays,
      learningObjectives,
      userEmail,
      lessonObjectives,
      additionalInstructions: additionalInstructions || "Not provided",
      documentUrl: documentData.file_url,
    });

    // Create the RAG-enhanced prompt
    const prompt = `Create a complete ${numberOfDays}-day lesson plan for teaching ${documentData.subject} - ${chapterTopic} for grade ${documentData.grade} (${documentData.education_board} board). Each class is ${classDuration} minutes long.
                    Use the content from this document: ${documentData.file_url}
                    Lesson Objectives: ${lessonObjectives || "To be determined based on the topic and document"}
                    Learning Objectives: ${learningObjectives || "To be determined based on the topic and document"}
                    ${additionalInstructions ? `Additional Instructions: ${additionalInstructions}` : ""}
                    Include all days in the plan with detailed content for each session, incorporating relevant information from the provided document.`;

    // Generate the lesson plan using structured output with Zod schema
    const result = await generateObject({
      model: openai("gpt-4.1", {
        structuredOutputs: true,
      }),
      schema: lessonPlanSchema,
      prompt: prompt,
      schemaName: 'lessonPlan',
      schemaDescription: 'A complete, detailed lesson plan structure incorporating content from the provided document.'
    });

    // Get the generated lesson plan directly from the structured output
    const lessonPlan = result.object;
    
    // Log token usage if available
    if (result.usage) {
      await logTokenUsage(
        'RAG Lesson Planner',
        'GPT-4.1',
        result.usage.promptTokens,
        result.usage.completionTokens,
        user.email
      );
    }

    console.log("Storing RAG-based lesson plan in Supabase");
    
    // Store the lesson plan in the lesson_plans table
    const { data: insertedData, error: insertError } = await supabase
      .from("lesson_plans")
      .insert({
        subject: documentData.subject,
        chapter_topic: chapterTopic,
        grade: documentData.grade,
        board: documentData.education_board,
        class_duration: Number.parseInt(classDuration),
        number_of_days: Number.parseInt(numberOfDays.toString()),
        learning_objectives: learningObjectives,
        lesson_objectives: lessonObjectives,
        additional_instructions: additionalInstructions,
        plan_data: lessonPlan,
        user_email: userEmail,
        // document_id: selectedDocument, // Store reference to the source document
      })
      .select();

    if (insertError) {
      console.error("Error inserting lesson plan:", insertError);
      return NextResponse.json(
        { error: `Failed to save lesson plan: ${insertError.message}` },
        { status: 500 }
      );
    }

    // If an assessmentId was provided, update the assigned_assessments table with the lesson plan
    if (assessmentId) {
      console.log(`Updating assigned_assessments with lesson plan for assessment ID: ${assessmentId}`);
      
      const completeLessonPlanData = {
        id: insertedData[0].id,
        subject: documentData.subject,
        chapter_topic: chapterTopic,
        grade: documentData.grade,
        board: documentData.education_board,
        class_duration: Number.parseInt(classDuration),
        number_of_days: Number.parseInt(numberOfDays.toString()),
        learning_objectives: learningObjectives,
        lesson_objectives: lessonObjectives,
        additional_instructions: additionalInstructions,
        plan_data: lessonPlan,
        created_at: new Date().toISOString(),
        document_id: selectedDocument,
      };

      const { error: updateError } = await supabase
        .from("assigned_assessments")
        .update({ lesson_plan: completeLessonPlanData })
        .eq("assessment_id", assessmentId);

      if (updateError) {
        console.error("Error updating assigned_assessments with lesson plan:", updateError);
      } else {
        console.log("Successfully updated assigned_assessments with lesson plan data");
      }
    }

    if (!insertedData || insertedData.length === 0) {
      return NextResponse.json(
        { error: "Failed to retrieve inserted lesson plan data" },
        { status: 500 }
      );
    }

    console.log("RAG-based lesson plan stored successfully");
    return NextResponse.json(insertedData[0]);
  } catch (error) {
    console.error("Error generating RAG-based lesson plan:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
