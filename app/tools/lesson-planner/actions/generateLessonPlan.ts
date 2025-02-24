import { supabase } from "@/app/tools/lesson-planner/lib/supabase"

// Check for the OpenAI API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

// Mock function for development without an API key
async function mockGenerateLessonPlan(prompt: string) {
  console.log("Using mock lesson plan generator")
  return {
    days: [
      {
        day: 1,
        topicHeading: "Introduction to the Topic",
        learningOutcomes: ["Understand basic concepts", "Identify key terms"],
        schedule: [
          {
            type: "introduction",
            title: "Overview",
            content: "Brief introduction to the subject",
            timeAllocation: 15,
          },
          // Add more mock schedule items as needed
        ],
        teachingAids: ["Textbook", "Whiteboard"],
        assignment: {
          description: "Review key concepts",
          tasks: ["Read chapter 1", "Answer review questions"],
        },
      },
    ],
    assessmentPlan: {
      formativeAssessments: [
        {
          topic: "Basic Concepts",
          type: "Quiz",
          description: "Short quiz on fundamental ideas",
          evaluationCriteria: ["Accuracy", "Completeness"],
        },
      ],
      summativeAssessments: [
        {
          topic: "Chapter Review",
          type: "Test",
          description: "End-of-chapter test",
          evaluationCriteria: ["Comprehension", "Application of concepts"],
        },
      ],
      progressTrackingSuggestions: ["Weekly progress reports", "Periodic self-assessments"],
    },
    remedialStrategies: [
      {
        targetGroup: "Struggling students",
        strategy: "Additional support sessions",
        description: "One-on-one tutoring for students who need extra help",
      },
    ],
  }
}

export async function generateLessonPlan(formData: FormData) {
  const subject = formData.get("subject") as string
  const chapterTopic = formData.get("chapterTopic") as string
  const grade = formData.get("grade") as string
  const board = formData.get("board") as string
  const classDuration = formData.get("classDuration") as string
  const numberOfDays = Number.parseInt(formData.get("numberOfDays") as string, 10)
  const learningObjectives = formData.get("learningObjectives") as string

  console.log("Generating lesson plan for:", {
    subject,
    chapterTopic,
    grade,
    board,
    numberOfDays,
    learningObjectives,
  })

  try {
    let generatedPlan

    if (!OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY is not set. Using mock data for development.")
      generatedPlan = await mockGenerateLessonPlan(
        `Create a ${numberOfDays}-day lesson plan for ${subject} - ${chapterTopic}`,
      )
    } else {
      console.log("Sending request to OpenAI API")
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are a professional curriculum developer. Create detailed lesson plans following this exact JSON structure. DO NOT include any comments or explanations in your response - return ONLY valid JSON:
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
}`,
            },
            {
              role: "user",
              content: `Create a complete ${numberOfDays}-day lesson plan for teaching ${subject} - ${chapterTopic} for grade ${grade} (${board} board). Each class is ${classDuration} minutes long.

Learning objectives: ${learningObjectives || "To be determined based on the topic"}

Include all days in the plan. Return ONLY a complete, valid JSON object with no comments or additional text.`,
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
      console.log("Received response from OpenAI API")

      if (!data.choices || data.choices.length === 0 || !data.choices[0].message || !data.choices[0].message.content) {
        console.error("API returned an empty or invalid response:", JSON.stringify(data))
        throw new Error("Failed to generate lesson plan: Received empty or invalid response from OpenAI API")
      }

      const content = data.choices[0].message.content
      try {
        // Remove any JavaScript comments and clean the response
        const cleanedContent = content
          .replace(/\/\/.*/g, "") // Remove single-line comments
          .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
          .trim()

        console.log("Cleaned OpenAI response:", cleanedContent)
        generatedPlan = JSON.parse(cleanedContent)
      } catch (parseError) {
        console.error("Error parsing OpenAI response. Original content:", content)
        console.error("Parse error:", parseError)
        if (parseError instanceof Error) {
          throw new Error(`Failed to parse lesson plan: ${parseError.message}. Please try again.`)
        } else {
          throw new Error("Failed to parse lesson plan: An unknown error occurred. Please try again.")
        }
      }
    }

    // Validate the required structure
    if (!generatedPlan.days || !Array.isArray(generatedPlan.days)) {
      throw new Error("Invalid plan structure: missing or invalid 'days' array")
    }
    if (!generatedPlan.assessmentPlan) {
      throw new Error("Invalid plan structure: missing 'assessmentPlan'")
    }
    if (!generatedPlan.remedialStrategies || !Array.isArray(generatedPlan.remedialStrategies)) {
      throw new Error("Invalid plan structure: missing or invalid 'remedialStrategies' array")
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
        plan_data: generatedPlan,
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
    if (error instanceof Error) {
      throw new Error(`Error generating lesson plan: ${error.message}`)
    } else {
      throw new Error("An unknown error occurred while generating the lesson plan")
    }
  }
}
