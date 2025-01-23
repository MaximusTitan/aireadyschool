import OpenAI from "openai"

export type GenerateResponse = {
  success: boolean
  content: string
  error?: string
}

let openai: OpenAI | null = null

export function getOpenAIInstance() {
  if (typeof window !== "undefined") {
    throw new Error("OpenAI instance cannot be accessed on the client side")
  }

  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set in environment variables")
    }

    openai = new OpenAI({ apiKey })
  }

  return openai
}

export async function generateContent(prompt: string, systemPrompt: string): Promise<GenerateResponse> {
  try {
    const openai = getOpenAIInstance()

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error("No content generated")
    }

    return {
      success: true,
      content,
    }
  } catch (error) {
    console.error("Error generating content:", error)
    return {
      success: false,
      content: "",
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

