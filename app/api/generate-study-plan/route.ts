import { NextResponse } from "next/server"
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { logTokenUsage } from '@/utils/logTokenUsage';
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OpenAI API key is not set")
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
  }

  try {
    const body = await req.json()
    const {
      country,
      grade,
      board,
      subject,
      syllabus,
      learningGoal,
      areasOfImprovement,
      availableDays,
      availableStudyTimePerDay,
    } = body

    // Get current user from Supabase
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prompt = `Create a detailed study plan for a ${grade} grade student in ${country} following the ${board} curriculum for the subject ${subject}. The plan should help achieve the following learning goal: ${learningGoal}. The syllabus/topics to cover are: ${syllabus}. Areas needing improvement: ${areasOfImprovement}. The plan should span ${availableDays} days, with ${availableStudyTimePerDay} hours available for study each day.

    Please format the study plan as a structured JSON array with the following structure:
    [
      {
        "day": 1,
        "focusAreas": [
          {
            "topic": "Topic Name",
            "objective": "Concise learning objective"
          }
        ],
        "activities": [
          {
            "action": "Action to take for improvement",
            "suggestion": "Practical suggestion on how to do it"
          }
        ]
      }
    ]

    Guidelines:
    1. Ensure the plan is logically structured, goal-oriented, and concise.
    2. Cover learning, practice, revision, and self-assessment throughout the plan.
    3. Tailor the plan to the student's specific needs, considering their areas of improvement.
    4. Provide at least one focus area and two activities for each day.
    5. The JSON should be valid and properly formatted.
    6. Keep focus areas and activities brief and to-the-point for better table formatting.
    7. DO NOT include any explanations, markdown formatting, or additional text outside of the JSON structure.
    8. Make sure to add mock test in the last day of the study plan.

    Respond ONLY with the JSON array, nothing else.`

    // Generate text using GPT-4o
    const { text: studyPlanString, usage } = await generateText({
      model: openai('gpt-4o'),
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 2000,
    });

    // Log token usage
    if (usage) {
      await logTokenUsage(
        'StudyPlanner', 
        'GPT-4o', 
        usage.promptTokens, 
        usage.completionTokens, 
        user?.email
      );
    }

    if (!studyPlanString) {
      throw new Error("No study plan generated")
    }

    // Remove any potential markdown formatting or extra text
    const cleanedStudyPlanString = studyPlanString.replace(/```json\s*|\s*```/g, "").trim()

    // Parse the JSON string to ensure it's valid
    let studyPlan
    try {
      studyPlan = JSON.parse(cleanedStudyPlanString)
    } catch (error) {
      const parseError = error as Error
      console.error("Error parsing OpenAI response:", parseError)
      return NextResponse.json(
        { error: `Invalid JSON in OpenAI response: ${parseError.message}`, rawResponse: studyPlanString },
        { status: 500 },
      )
    }

    // Add metadata to the response
    const response = {
      metadata: {
        country,
        grade,
        board,
        subject,
        learningGoal,
        availableDays,
        availableStudyTimePerDay,
      },
      studyPlan,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("Error in API route:", error)
    return NextResponse.json(
      { error: `An error occurred while generating the study plan: ${error.message}` },
      { status: 500 },
    )
  }
}

