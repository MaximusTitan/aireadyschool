import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { text, mode } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const systemPrompt = mode === "enhance" 
      ? `You are an expert writer. Enhance the given text to make it more professional, clear, and engaging while:
         - Maintaining its core meaning
         - Preserving the original text structure and formatting
         - Not adding any markdown symbols, hashtags, or special characters
         - Not adding any headings or section markers
         - Keeping the text in a simple paragraph format as provided
         - Preserving any existing line breaks but not adding new ones
         Output should be plain text without any formatting symbols.`
      : `You are an expert writer. Rewrite the entire document while:
         - Improving clarity and engagement
         - Maintaining the original document structure and formatting
         - Not adding any markdown symbols, hashtags, or special characters
         - Not adding any headings or section markers
         - Keeping paragraphs in their original format
         - Preserving any existing line breaks but not adding new ones
         Output should be plain text without any formatting symbols.`;

    const userPrompt = mode === "enhance"
      ? `Enhance this text while preserving its format and structure. Do not add any markdown, hashtags, or special characters:\n\n${text}`
      : `Rewrite this document while preserving its format and structure. Do not add any markdown, hashtags, or special characters:\n\n${text}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    let enhancedText = completion.choices[0]?.message?.content || '';

    // Clean up any remaining markdown or special characters
    enhancedText = enhancedText
      .replace(/#{1,6}\s/g, '') // Remove heading markers
      .replace(/\*\*/g, '')     // Remove bold markers
      .replace(/\*/g, '')       // Remove italic markers
      .replace(/---/g, '')      // Remove horizontal rules
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize multiple line breaks
      .trim();

    if (!enhancedText) {
      throw new Error("No response from AI");
    }

    return NextResponse.json({ enhancedText });
  } catch (error) {
    console.error("Error enhancing text:", error);
    return NextResponse.json(
      { error: "Failed to enhance text" },
      { status: 500 }
    );
  }
}
