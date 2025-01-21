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
            You are an assignment generator. Please create an assignment with the following structure:
            - A concise title for the assignment, followed by "---" on a new line
            - The assignment content, including instructions, questions, or tasks
            
            Ensure the content is factual and avoid hallucination. Always separate the title and content with three hyphens (---) on a new line.
          `,
        },
        {
          role: "user",
          content: `Generate an assignment on the following topic: ${prompt}`,
        },
      ],
    });

    const generatedContent = response.choices[0].message.content;
    if (!generatedContent) {
      throw new Error("Failed to generate content");
    }

    // Parse the generated content
    const [title, content] = generatedContent.split("---").map((s) => s.trim());

    if (!title || !content) {
      throw new Error("Generated content is not in the expected format");
    }

    return NextResponse.json({
      title: title,
      content: content,
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