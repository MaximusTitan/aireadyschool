// /app/api/prompt-generator/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { prompt } = await request.json();

  if (!prompt) {
    return NextResponse.json({ message: "Prompt is required" }, { status: 400 });
  }

  const model = "gpt-4"; // Use the latest model as needed

  // Prepare a message to generate multiple prompts in one API call
  const messages = [
    {
      role: "user",
      content: `Based on the following prompt, generate 5 prompts for images that would describe a comic sequence in a progressive manner.The first prompt should be a catchy title of the story and after that each prompt should depict a scene from the story and be returned as a JSON object with keys in the format "Scene N" (where N is a number from 1 to N). The values should describe the scene: ${prompt}`,
    },
  ];

  try {
    // Make a single API call to OpenAI to generate all 10 prompts
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1000, // Adjust as needed
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim();

    // Parse the result into JSON format
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(result);
      console.log("Parsed JSON Response:", jsonResponse);
    } catch (error) {
      throw new Error("Failed to parse response as JSON. Ensure the response is in the correct format.");
    }

    // Extract values from the JSON response and convert them to a list
    const prompts = Object.values(jsonResponse);
    console.log("Prompts List:", prompts);

    // Return the prompts list
    return NextResponse.json({ prompts: prompts }, { status: 200 });

  } catch (error) {
    const errorMessage = (error as Error).message;
    return NextResponse.json(
      { message: "Error generating content", error: errorMessage },
      { status: 500 }
    );
  }
}