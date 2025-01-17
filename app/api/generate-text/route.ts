import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  if (!openai.apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not found" },
      { status: 500 }
    );
  }
  try {
    const { prompt } = await req.json();

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is missing or empty" },
        { status: 400 }
      );
    }
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
            You are an academic lesson content generator. Please structure the response as follows:
            - Title. A concise 3 - 5 word title followed by "---"
              - An introduction
              - Detailed body sections on causes, major events, and impact
              - A conclusion
            Ensure the content is factual and avoid hallucination. Ensure to separate the title and content with three hyphens (---)
          `,
        },
        {
          role: "user",
          content: `Generate a detailed academic lesson on the following topic: ${prompt}`,
        },
      ],
    });

    const fullResponse = response.choices[0].message.content;
    if (!fullResponse) {
      throw new Error("Failed to generate content");
    }
    const [title, content] = fullResponse.split("---").map((s) => s.trim());

    return NextResponse.json({
      title: title,
      result: content,
    });
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 500 }
      );
    } else {
      return NextResponse.json(
        { error: "An unexpected error occurred" },
        { status: 500 }
      );
    }
  }
}