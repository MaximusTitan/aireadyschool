import { NextResponse } from "next/server";
import GroqChat from "groq-sdk";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY as string,
});

const groq = new GroqChat({
  apiKey: process.env.GROQ_API_KEY as string,
});

export async function POST(request: Request) {
  try {
    const { context, provider, currentDetails } = await request.json();
    
    if (!context) {
      return NextResponse.json(
        { error: "Context information is required" },
        { status: 400 }
      );
    }

    // Enhanced prompt for better details
    const prompt = `
Based on the following comic information:
${context}

${currentDetails ? `Current additional details: ${currentDetails}` : ""}

I need detailed and specific story elements for this comic. Focus on:

1. STORY DEVELOPMENT: Outline a clear narrative arc with definable beginning, escalation, and resolution that fits the selected panels.

2. CHARACTER DETAILS: Specify character motivations, relationships, and unique traits beyond what's already mentioned.

3. VISUAL ELEMENTS: Describe specific visual elements that would enhance the ${context.includes('Comic Style:') ? context.split('Comic Style:')[1].split('\n')[0].trim() : 'comic'} style.

4. SCENE TRANSITIONS: Explain how the story should flow between panels in a cohesive way.

5. WORLD-BUILDING: Add depth to the setting with environmental details, cultural elements, or unique aspects of the world.

6. SPECIAL EFFECTS: Suggest specific visual effects, panel compositions, or artistic techniques to emphasize dramatic moments.

Be specific, creative, and detailed but concise (200 words or less). Return ONLY the enhanced details text, with no explanations or markdown formatting.
`;

    let enhancedDetails;

    // Use the appropriate AI provider
    if (provider === 'openai') {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "You are an expert comic book writer and artist who provides creative, detailed and specific story elements. You focus on making comics compelling, visually interesting, and narratively cohesive."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.8,
      });
      
      enhancedDetails = response.choices[0].message.content?.trim();
    } else {
      // Default to groq
      const response = await groq.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: "You are an expert comic book writer and artist who provides creative, detailed and specific story elements. You focus on making comics compelling, visually interesting, and narratively cohesive."
          },
          { role: "user", content: prompt }
        ],
        model: "mixtral-8x7b-32768",
        max_tokens: 500,
        temperature: 0.8,
      });
      
      enhancedDetails = response.choices[0].message.content?.trim();
    }

    if (!enhancedDetails) {
      throw new Error("No response generated from AI provider");
    }

    return NextResponse.json({ enhancedDetails });
  } catch (error) {
    console.error("Error enhancing details:", error);
    return NextResponse.json(
      {
        error: "Failed to enhance details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
