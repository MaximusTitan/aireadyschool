// /app/api/prompt-generator/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const model = "gpt-4o";

    // Prepare a message for OpenAI
    const messages = [
      {
        role: "user",
        content: `Based on the following prompt, generate 5 prompts for images that would describe a comic sequence in a progressive manner. The first prompt should be a catchy title of the story, and after that, each prompt should depict a scene from the story and be returned as a JSON object with keys in the format "Scene N" (where N is a number from 1 to N). The values should describe the scene: ${prompt}`,
      },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI API Error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim();

    if (!result) {
      throw new Error("Empty response from OpenAI API.");
    }

    // Clean up the raw response if it contains markdown or extra formatting
    const cleanedResult = result
      .replace(/^```json/, "") // Remove leading ```json
      .replace(/```$/, "") // Remove trailing ```
      .trim();

    // Attempt to parse JSON output
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(cleanedResult);
    } catch (error) {
      throw new Error(
        `Failed to parse response as JSON. Cleaned response: ${cleanedResult}`
      );
    }

    // Validate JSON structure
    if (
      typeof jsonResponse !== "object" ||
      Array.isArray(jsonResponse) ||
      Object.keys(jsonResponse).length === 0
    ) {
      throw new Error(
        `Unexpected JSON structure. Received: ${JSON.stringify(jsonResponse)}`
      );
    }

    // Extract values into a list
    const prompts = Object.values(jsonResponse);

    return NextResponse.json({ prompts }, { status: 200 });
  } catch (error) {
    console.error("Error generating prompts:", error);
    return NextResponse.json(
      { error: "Failed to generate prompts.", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
