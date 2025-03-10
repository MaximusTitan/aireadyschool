import { NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(req: Request) {
  try {
    const { title, content } = await req.json()

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key is not set" }, { status: 500 })
    }

    const prompt = `
    As an expert educator, generate detailed and informative notes for the following lesson activity:

    Title: ${title}
    Content: ${content}

    Please structure your response as follows:

    1. Key Concepts: List and briefly explain 3-5 main concepts related to this topic.
    2. Background Information: Provide relevant background information or context for this topic.
    3. Important Elements: Mention and describe 2-3 significant elements (e.g., people, places, theories, equations) related to this topic.
    4. Examples or Applications: Give 2-3 specific examples or real-world applications that illustrate the main points.
    5. Analysis: Offer a short analysis of the topic's significance or impact in its field.
    6. Practice Questions: Provide 3-5 thought-provoking questions that test understanding of the material.

    Ensure all content is factual, relevant to ${title}, and appropriate for the grade level implied by the activity. Adapt the structure as needed to best fit the subject matter.
    `

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 1500,
    })

    return NextResponse.json({ notes: text })
  } catch (error) {
    console.error("Error generating notes:", error)
    return NextResponse.json({ error: "Failed to generate notes" }, { status: 500 })
  }
}

