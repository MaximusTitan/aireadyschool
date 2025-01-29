import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import type { Flashcard } from "../types/flashcard"

export async function generateFlashcards(text: string): Promise<Flashcard[]> {
  const prompt = `
    Generate flashcards from the following text. Each flashcard should have a question and an answer.
    Format the output as a JSON array of objects, each with 'question' and 'answer' properties.
    Text: ${text}
  `

  const { text: generatedText } = await generateText({
    model: openai("gpt-4-turbo"),
    prompt: prompt,
  })

  try {
    const flashcards: Flashcard[] = JSON.parse(generatedText)
    return flashcards
  } catch (error) {
    console.error("Error parsing generated flashcards:", error)
    throw new Error("Failed to generate valid flashcards")
  }
}

