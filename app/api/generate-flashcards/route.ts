import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { Flashcard } from "@/app/tools/flash-card/types/flashcard"
import { nanoid } from "nanoid"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { text, cardCount = 5 } = await req.json()

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text input is required" }, { status: 400 })
    }

    const prompt = `
      Generate ${cardCount} educational flashcards from the following text. Include a mix of different question types.
      Return the response as a JSON array of objects with the following structure:
      [
        {
          "question": "the question text",
          "answer": "the correct answer",
          "type": "basic"
        }
      ]

      Rules:
      1. Keep questions and answers clear and concise
      2. Ensure answers are factually correct
      3. Generate questions that test understanding, not just memorization

      Text to process:
      ${text}
    `

    try {
      const { text: generatedText } = await generateText({
        model: openai("gpt-4-turbo"),
        prompt,
        temperature: 0.7,
        maxTokens: 1000,
      })

      // Extract JSON content from the response
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error("No valid JSON found in the response")
      }

      const jsonContent = jsonMatch[0]
      const flashcards: Partial<Flashcard>[] = JSON.parse(jsonContent)

      const formattedFlashcards = flashcards.map((card) => ({
        id: nanoid(),
        question: card.question || "",
        answer: card.answer || "",
        type: card.type || "basic",
        created_at: new Date(),
      }))

      return NextResponse.json(formattedFlashcards)
    } catch (error: unknown) {
      console.error("OpenAI API Error:", error)
      if (
        typeof error === 'object' && 
        error !== null && 
        'name' in error && 
        'statusCode' in error && 
        error.name === "AI_APICallError" && 
        error.statusCode === 401
      ) {
        return NextResponse.json(
          { error: "OpenAI API key is invalid or not set correctly. Please check your environment variables." },
          { status: 401 },
        )
      }
      throw error // Re-throw for general error handling
    }
  } catch (error) {
    console.error("Error in generate route:", error)
    const errorMessage = error && typeof error === 'object' && 'message' in error
      ? String(error.message)
      : 'Unknown error occurred';
    return NextResponse.json({ error: "Failed to generate flashcards", details: errorMessage }, { status: 500 })
  }
}

