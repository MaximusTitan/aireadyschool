import { createClient } from "@/utils/supabase/server";
import { LessonPlanFormData, LessonPlanResponse } from "../types";
import { supabase } from "@/lib/supabase";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

// Replace the mockGenerateLessonPlan function with an OpenAI implementation
const generateLessonPlanWithOpenAI = async (prompt: string) => {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional curriculum developer. Create detailed lesson plans following this exact JSON structure and the provided dynamic lesson plan structure. DO NOT include any comments or explanations in your response - return ONLY valid JSON:
{
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
  }
}`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`OpenAI API request failed with status ${response.status}: ${errorBody}`)
      throw new Error(`OpenAI API request failed with status ${response.status}: ${errorBody}`)
    }

    const data = await response.json()

    if (!data.choices || data.choices.length === 0 || !data.choices[0].message || !data.choices[0].message.content) {
      console.error("API returned an empty or invalid response:", JSON.stringify(data))
      throw new Error("Received empty or invalid response from OpenAI API")
    }

    const content = data.choices[0].message.content
    try {
      // Remove any potential non-JSON content
      const jsonStartIndex = content.indexOf("{")
      const jsonEndIndex = content.lastIndexOf("}")
      if (jsonStartIndex === -1 || jsonEndIndex === -1) {
        throw new Error("Could not find valid JSON in the response")
      }
      const jsonContent = content.slice(jsonStartIndex, jsonEndIndex + 1)

      // Parse the JSON
      return JSON.parse(jsonContent)
    } catch (parseError) {
      console.error("Error parsing OpenAI response. Original content:", content)
      console.error("Parse error:", parseError)
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error'
      throw new Error(`Failed to parse lesson plan: ${errorMessage}`)
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error)
    throw new Error("Failed to generate lesson plan. Please try again later.")
  }
}

// Add user_email parameter to the function
export async function generateLessonPlan(formData: FormData, userEmail: string) {
  const subject = formData.get("subject") as string
  const chapterTopic = formData.get("chapterTopic") as string
  const grade = formData.get("grade") as string
  const board = formData.get("board") as string
  const classDuration = formData.get("classDuration") as string
  const numberOfDays = Number.parseInt(formData.get("numberOfDays") as string, 10)
  const learningObjectives = formData.get("learningObjectives") as string
  const lessonObjectives = formData.get("lessonObjectives") as string
  const additionalInstructions = formData.get("additionalInstructions") as string | null

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
  })

  try {
    let generatedPlan

    if (!OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY is not set. Using mock data for development.")
      // Use a simplified mock data structure
      generatedPlan = {
        days: [
          {
            day: 1,
            topicHeading: "Introduction to " + chapterTopic,
            learningOutcomes: ["Students will be able to define key terms related to " + chapterTopic],
            schedule: [
              {
                type: "introduction",
                title: "Introduction to " + chapterTopic,
                content: "Introduce the topic and key terms.",
                timeAllocation: 10,
              },
              {
                type: "mainContent",
                title: "Main Concepts",
                content: "Explain the main concepts of " + chapterTopic,
                timeAllocation: 20,
              },
              {
                type: "activity",
                title: "Group Activity",
                content: "Students will work in groups to apply concepts.",
                timeAllocation: 10,
              },
              {
                type: "conclusion",
                title: "Conclusion",
                content: "Summarize the main points of " + chapterTopic,
                timeAllocation: 5,
              },
            ],
            teachingAids: ["Whiteboard", "Markers", "Handouts"],
            assignment: {
              description: "Complete the worksheet on " + chapterTopic,
              tasks: ["Answer the questions on the worksheet."],
            },
          },
        ],
        assessmentPlan: {
          formativeAssessments: [
            {
              topic: "Key terms of " + chapterTopic,
              type: "Quiz",
              description: "Short quiz on key terms.",
              evaluationCriteria: ["Accuracy", "Completeness"],
            },
          ],
          summativeAssessments: [],
          progressTrackingSuggestions: ["Monitor student participation."],
        },
      }
    } else {
      console.log("Sending request to OpenAI API")
      const prompt = `Create a complete ${numberOfDays}-day lesson plan for teaching ${subject} - ${chapterTopic} for grade ${grade} (${board} board). Each class is ${classDuration} minutes long.

Lesson Objectives: ${lessonObjectives || "To be determined based on the topic"}
Learning Objectives: ${learningObjectives || "To be determined based on the topic"}
${additionalInstructions ? `Additional Instructions: ${additionalInstructions}` : ""}

Include all days in the plan. Return ONLY a complete, valid JSON object with no comments or additional text.`

      generatedPlan = await generateLessonPlanWithOpenAI(prompt)
    }

    console.log("Storing lesson plan in Supabase")
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
        lesson_objectives: lessonObjectives,
        additional_instructions: additionalInstructions,
        plan_data: generatedPlan,
        user_email: userEmail, // Add the user email
      })
      .select()

    if (insertError) {
      console.error("Error inserting lesson plan:", insertError)
      throw new Error(`Failed to save lesson plan: ${insertError.message}`)
    }

    if (!insertedData || insertedData.length === 0) {
      throw new Error("Failed to retrieve inserted lesson plan data")
    }

    console.log("Lesson plan stored successfully")
    return insertedData[0]
  } catch (error) {
    console.error("Error in generateLessonPlan:", error)
    throw new Error(`Error generating lesson plan: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

