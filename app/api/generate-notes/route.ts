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
    As an expert educator, provide a simple class explanation for the following lesson:

    Title: ${title}
    Content: ${content}

    Please provide a concise markdown-formatted explanation that:
    - Summarizes the main topic in 1-2 paragraphs
    - Lists 3-4 key points students should understand
    - Includes 1-2 simple examples to illustrate the concept

    Use markdown formatting (bullet points, bold for emphasis, etc.) to make the explanation clear and readable.
    Keep the language appropriate for the grade level implied by the activity.
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

