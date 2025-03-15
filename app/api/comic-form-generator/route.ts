import { NextResponse } from "next/server";
import { callAI, Message, extractJSON } from "@/utils/ai-client";

export async function POST(request: Request) {
  try {
    const { title, provider = 'groq' } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Prepare a message for AI
    const messages: Message[] = [
      {
        role: "system",
        content: "You are a helpful comic book generator assistant. Generate suitable details for a comic based on a title provided by the user. Always respond with JSON."
      },
      {
        role: "user",
        content: `Based on this comic title: "${title}", suggest appropriate values for:
        1. Main Characters (comma-separated list)
        2. Setting/Background
        3. Number of Panels (choose from: 4, 6, or 8)
        4. Comic Style (choose from: Cartoon, Manga, Classic, 3D)
        5. Dialogue Tone (choose from: Funny, Action-Packed, Dramatic)
        6. Ending Style (choose from: Happy Ending, Mystery, To Be Continued...)
        7. Additional Details (brief description)
        
        Return ONLY a valid JSON object with these fields: mainCharacters, setting, numPanels, comicStyle, dialogueTone, endingStyle, additionalDetails. Do not include any explanatory text before or after the JSON.`
      },
    ];

    console.log(`Generating comic form data using ${provider}...`);
    
    const data = await callAI(messages, { 
      provider: provider as 'openai' | 'groq',
      maxTokens: 500
    });
    
    const result = data.choices?.[0]?.message?.content?.trim();

    if (!result) {
      throw new Error("Empty response from AI API.");
    }

    console.log("AI response:", result);
    
    // Extract JSON from the response
    try {
      const jsonResponse = extractJSON(result);
      // Make sure the title is included in the response
      jsonResponse.title = title;
      return NextResponse.json(jsonResponse, { status: 200 });
    } catch (error) {
      console.error("JSON extraction error:", error);
      
      // If JSON extraction fails, try a more permissive approach
      // Return a simplified response with whatever we can salvage
      return NextResponse.json({
        title: title,
        mainCharacters: title.includes(" vs ") ? title.split(" vs ").join(", ") : title,
        setting: "Comic book world",
        numPanels: "6",
        comicStyle: "Classic",
        dialogueTone: "Action-Packed",
        endingStyle: "To Be Continued...",
        additionalDetails: `An epic story about ${title}`,
        error: "Failed to parse AI response"
      }, { status: 200 });
    }
  } catch (error) {
    console.error("Error generating comic form data:", error);
    return NextResponse.json(
      { error: "Failed to generate comic form data.", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
