import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase/server"
import { logTokenUsage } from "@/utils/logTokenUsage"

const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

export async function POST(req: Request) {
  try {
    // Get authenticated user
    const supabaseAuth = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { country, board, classLevel, subject, topic, assessmentType, difficulty, questionCount, learningOutcomes } =
      await req.json()

    interface LearningOutcome {
      outcome: string
    }

    let prompt = `Generate a ${difficulty} difficulty ${subject} assessment for ${classLevel} students in ${country} following the ${board} curriculum, on the topic of "${topic}" with ${questionCount} questions. The assessment should address the following learning outcomes:\n${(learningOutcomes as string[]).map((outcome: string, index: number) => `${index + 1}. ${outcome}`).join("\n")}\n\n`

    switch (assessmentType) {
      case "mcq":
        prompt += `Create multiple-choice questions. For each question, provide 4 options (A, B, C, D) with one correct answer. Format the output as a JSON array of objects, where each object has 'question', 'options' (an array of 4 strings), and 'correctAnswer' (index of the correct option) fields.`
        break
      case "truefalse":
        prompt += `Create true/false questions. Format the output as a JSON array of objects, where each object has 'question' and 'correctAnswer' (boolean) fields.`
        break
      case "fillintheblank":
        prompt += `Create fill-in-the-blank questions. Format the output as a JSON array of objects, where each object has 'question' (with a blank represented by '___'), 'answer' (the correct word or phrase to fill the blank), and 'options' (an array of 4 strings including the correct answer) fields.`
        break
      case "shortanswer": // new branch
        prompt += `Create short answer questions. For each question, provide a brief question and its correct answer. Format the output as a JSON array of objects, where each object has 'question' and 'answer' fields.`
        break
      default:
        throw new Error("Invalid assessment type")
    }

    try {
      const { text, usage } = await generateText({
        model: openai("gpt-4o"),
        prompt: prompt,
        temperature: 0.9,
        maxTokens: 2000,
      })

      // Log token usage with authenticated user's email
      if (usage) {
        await logTokenUsage("Assessment Generator", "GPT-4o", usage.promptTokens, usage.completionTokens, user.email)
      }

      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error("No valid JSON found in the response")
      }

      const assessment = JSON.parse(jsonMatch[0])

      if (!Array.isArray(assessment)) {
        throw new Error("Invalid assessment format: Expected an array of questions")
      }

      // Save the assessment to the database, adding user_email
      const { data, error } = await supabase
        .from("assessments")
        .insert({
          country,
          board,
          class_level: classLevel,
          subject,
          topic,
          assessment_type: assessmentType,
          difficulty,
          questions: assessment,
          learning_outcomes: learningOutcomes,
          user_email: user.email,
        })
        .select()

      if (error) {
        console.error("Supabase error:", error)
        throw new Error(`Failed to save assessment: ${error.message}`)
      }

      return NextResponse.json({ assessment, id: data[0].id })
    } catch (error) {
      console.error("Error generating assessment:", error)

      let errorMessage = "An unexpected error occurred while generating the assessment."
      let statusCode = 500
      let errorDetails = "An unknown error occurred"

      if (error instanceof Error) {
        errorDetails = error.message
        if (error.message.includes("insufficient_quota") || error.message.includes("exceeded your current quota")) {
          errorMessage = "You have exceeded your API quota. Please try again later or contact support."
          statusCode = 429
        } else if (error.message.includes("No valid JSON found")) {
          errorMessage = "The AI model returned an invalid response. Please try again."
          statusCode = 422
        }
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: process.env.NODE_ENV === "development" ? errorDetails : undefined,
        },
        { status: statusCode },
      )
    }
  } catch (error) {
    console.error("Error generating assessment:", error)
    const errorMessage = "Failed to generate assessment"
    let errorDetails = "An unknown error occurred"

    if (error instanceof Error) {
      errorDetails = error.message
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? errorDetails : undefined,
        stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

// Add a new PUT route to update questions and answers
export async function PUT(req: Request) {
  try {
    const supabaseAuth = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, questions, answers } = await req.json()

    const updateData: any = {}
    if (questions) updateData.questions = questions
    if (answers) updateData.answers = answers

    const { data, error } = await supabase
      .from("assessments")
      .update(updateData)
      .eq("id", id)
      .eq("user_email", user.email)
      .select()

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      throw new Error("No data returned after update")
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error updating assessment:", error)
    return NextResponse.json(
      {
        error: "Failed to update assessment",
        details: error instanceof Error ? error.message : "An unknown error occurred",
        stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

