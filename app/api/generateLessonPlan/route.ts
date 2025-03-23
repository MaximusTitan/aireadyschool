import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { logTokenUsage } from '@/utils/logTokenUsage';
import { z } from "zod";

// Define the lesson plan schema
const lessonPlanSchema = z.object({
  days: z.array(
    z.object({
      day: z.number(),
      topicHeading: z.string(),
      learningOutcomes: z.array(z.string()),
      schedule: z.array(
        z.object({
          type: z.enum(["introduction", "mainContent", "activity", "conclusion", "review", "assessment"]),
          title: z.string(),
          content: z.string(),
          timeAllocation: z.number(),
        })
      ),
      teachingAids: z.array(z.string()),
      assignment: z.object({
        description: z.string(),
        tasks: z.array(z.string()),
      }),
    })
  ),
  assessmentPlan: z.object({
    formativeAssessments: z.array(
      z.object({
        topic: z.string(),
        type: z.string(),
        description: z.string(),
        evaluationCriteria: z.array(z.string()),
      })
    ),
    summativeAssessments: z.array(
      z.object({
        topic: z.string(),
        type: z.string(),
        description: z.string(),
        evaluationCriteria: z.array(z.string()),
      })
    ),
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
      assessmentId, // Extract assessmentId if provided
      studentId // Extract studentId if provided
    } = await request.json();

    // Validate required fields
    if (!subject || !grade || !chapterTopic || !board || !classDuration || !numberOfDays) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    console.log("Generating lesson plan for:", {
      subject,
      chapterTopic,
      grade,
      board,
      classDuration,
      numberOfDays,
      learningObjectives,
      userEmail,
      lessonObjectives,
      additionalInstructions: additionalInstructions || "Not provided",
      assessmentId: assessmentId || "Not provided",
      studentId: studentId || "Not provided"
    });

    // Create the user prompt
    const prompt = `Create a complete ${numberOfDays}-day lesson plan for teaching ${subject} - ${chapterTopic} for grade ${grade} (${board} board). Each class is ${classDuration} minutes long.

Lesson Objectives: ${lessonObjectives || "To be determined based on the topic"}
Learning Objectives: ${learningObjectives || "To be determined based on the topic"}
${additionalInstructions ? `Additional Instructions: ${additionalInstructions}` : ""}

Include all days in the plan. Return ONLY a complete, valid JSON object with no comments or additional text.`;

    // Define the system prompt
  // Construct system prompt
  const systemPrompt = `You are a professional curriculum developer. Create detailed lesson plans following this exact JSON structure and the provided dynamic lesson plan structure. DO NOT include any comments or explanations in your response - return ONLY valid JSON:\n\n{
    "days": [
      {
        "day": number,
        "topicHeading": string,
        "learningOutcomes": string[],
        "schedule": [
          {
            "type": "introduction" | "mainContent" | "activity" | "conclusion" | "review" | "assessment",
            "title": string,
            "content": string,
            "timeAllocation": number
          }
        ]
      }
    ],
    "assessmentPlan": {
      "formativeAssessments": [
        {
          "topic": string,
          "type": string,
          "description": string,
          "evaluationCriteria": string[]
        }
      ],
      "summativeAssessments": [
        {
          "topic": string,
          "type": string,
          "description": string,
          "evaluationCriteria": string[]
        }
      ],
      "progressTrackingSuggestions": string[]
    }
}\n\nIMPORTANT GUIDELINES:\n1. Provide EXTENSIVE and DETAILED content for each activity. Each activity's "content" field should contain at least 50-100 words with specific teaching instructions, examples, questions to ask students, and detailed explanations.\n2. For each activity, include step-by-step instructions that a teacher could follow directly.\n3. Include age-appropriate examples, analogies, and real-world connections in the content.\n4. Ensure learning outcomes are specific, measurable, and aligned with educational standards.\n5. Make assignments challenging but achievable, with clear instructions and expectations.\n6. Include a variety of assessment types (quizzes, projects, discussions, etc.)\n7. DO NOT include any comments or explanations outside the JSON structure.\n8. Return ONLY valid JSON with no additional text.`;

   // Generate the lesson plan
    const { text: rawResponse, usage } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 4000
    });

    // Log token usage if available
    if (usage) {
      await logTokenUsage(
        'Lesson Planner',
        'GPT-4o',
        usage.promptTokens,
        usage.completionTokens,
        user.email
      );
    }

    // Process the response
    let lessonPlan;
    try {
      // Extract JSON from the response
      const jsonStartIndex = rawResponse.indexOf("{");
      const jsonEndIndex = rawResponse.lastIndexOf("}");
      
      if (jsonStartIndex === -1 || jsonEndIndex === -1) {
        throw new Error("Could not find valid JSON in the response");
      }
      
      const jsonContent = rawResponse.slice(jsonStartIndex, jsonEndIndex + 1);
      lessonPlan = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error("Error parsing AI response. Original content:", rawResponse);
      console.error("Parse error:", parseError);
      return NextResponse.json(
        { error: "Failed to parse lesson plan response" },
        { status: 500 }
      );
    }

    console.log("Storing lesson plan in Supabase");
    
    // Store the lesson plan in the lesson_plans table
    const { data: insertedData, error: insertError } = await supabase
      .from("lesson_plans")
      .insert({
        subject,
        chapter_topic: chapterTopic,
        grade,
        board,
        class_duration: Number.parseInt(classDuration),
        number_of_days: Number.parseInt(numberOfDays.toString()),
        learning_objectives: learningObjectives,
        lesson_objectives: lessonObjectives,
        additional_instructions: additionalInstructions,
        plan_data: lessonPlan,
        user_email: userEmail,
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
      
      // Create the complete lesson plan object with all data
      const completeLessonPlanData = {
        id: insertedData[0].id,
        subject,
        chapter_topic: chapterTopic,
        grade,
        board,
        class_duration: Number.parseInt(classDuration),
        number_of_days: Number.parseInt(numberOfDays.toString()),
        learning_objectives: learningObjectives,
        lesson_objectives: lessonObjectives,
        additional_instructions: additionalInstructions,
        plan_data: lessonPlan,
        created_at: new Date().toISOString()
      };

      // Update the assigned_assessments table
      const { error: updateError } = await supabase
        .from("assigned_assessments")
        .update({ lesson_plan: completeLessonPlanData })
        .eq("assessment_id", assessmentId);

      if (updateError) {
        console.error("Error updating assigned_assessments with lesson plan:", updateError);
        // We'll continue even if this fails, as the primary insertion succeeded
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

    console.log("Lesson plan stored successfully");
    return NextResponse.json(insertedData[0]);
  } catch (error) {
    console.error("Error generating lesson plan:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

