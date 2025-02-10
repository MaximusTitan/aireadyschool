import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/client";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
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
          type: z.enum(["introduction", "mainContent", "activity", "conclusion"]),
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
    const formData = await request.formData();
    const subject = formData.get("subject") as string;
    const chapterTopic = formData.get("chapterTopic") as string;
    const grade = formData.get("grade") as string;
    const board = formData.get("board") as string;
    const classDuration = formData.get("classDuration") as string;
    const numberOfDays = Number.parseInt(formData.get("numberOfDays") as string, 10);
    const learningObjectives = formData.get("learningObjectives") as string;

    // ...existing logging code...

    const systemPrompt = `You are a professional curriculum developer. Create detailed lesson plans following this exact JSON structure. DO NOT include any comments or explanations in your response - return ONLY valid JSON:
{
  "days": [
    {
      "day": number,
      "topicHeading": string,
      "learningOutcomes": string[],
      "schedule": [
        {
          "type": "introduction" | "mainContent" | "activity" | "conclusion",
          "title": string,
          "content": string,
          "timeAllocation": number
        }
      ],
      "teachingAids": string[],
      "assignment": {
        "description": string,
        "tasks": string[]
      }
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
  },
  "remedialStrategies": [
    {
      "targetGroup": string,
      "strategy": string,
      "description": string
    }
  ]
}`;

    const userPrompt = `Create a complete ${numberOfDays}-day lesson plan for teaching ${subject} - ${chapterTopic} for grade ${grade} (${board} board). Each class is ${classDuration} minutes long.

Learning objectives: ${learningObjectives || "To be determined based on the topic"}

Include all days in the plan. Return ONLY a complete, valid JSON object with no comments or additional text.`;

    // Use the structured output generator
    const { object: generatedPlan } = await generateObject({
      model: openai("gpt-4o", {
        structuredOutputs: true,
      }),
      schemaName: "lessonPlan",
      schemaDescription: "Detailed lesson plan as per provided prompt.",
      schema: lessonPlanSchema,
      prompt: userPrompt,
    });

    const supabase = await createClient();
    const { data: insertedData, error: insertError } = await supabase
      .from("lesson_plans")
      .insert({
        subject,
        chapter_topic: chapterTopic,
        grade,
        board,
        class_duration: Number.parseInt(classDuration),
        number_of_days: numberOfDays,
        learning_objectives: learningObjectives,
        plan_data: generatedPlan,
      })
      .select();

    if (insertError || !insertedData || insertedData.length === 0) {
      const msg = insertError ? insertError.message : "Failed to retrieve inserted lesson plan data";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json(insertedData[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
