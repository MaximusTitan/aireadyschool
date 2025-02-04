import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const G_API_KEY = process.env.G_API_KEY

if (!G_API_KEY) {
  throw new Error("Missing Gemini API Key")
}

const genAI = new GoogleGenerativeAI(G_API_KEY)

export async function POST(req: Request) {
  try {
    const { content } = await req.json()

    if (!content) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const prompt = `Generate a concise and captivating title for the following research content. The title should provide context for the whole research and be no longer than 10 words:

${content.substring(0, 500)}...

Title:`

    const result = await model.generateContent(prompt)
    const title = result.response.text().trim()

    return NextResponse.json({ title })
  } catch (error) {
    console.error("Error generating title:", error)
    return NextResponse.json(
      { error: "Failed to generate title", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

