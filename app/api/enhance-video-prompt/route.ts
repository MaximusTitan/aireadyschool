import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  try {
    const { sceneText, visualDetails, currentPrompt } = await req.json();

    const prompt = `Given this scene description and visual details, create a cinematic motion prompt that describes:
1. Camera movement (e.g., zoom, pan, dolly)
2. Character motion
3. Background effects or environment changes

Scene: ${sceneText}
Visual Details: ${visualDetails}
Current Motion Description: ${currentPrompt || 'None'}

Respond with a concise, detailed description focused on motion and cinematography.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 200
    });

    return NextResponse.json({
      success: true,
      enhancedPrompt: completion.choices[0].message.content
    });

  } catch (error) {
    console.error('Error enhancing video prompt:', error);
    return NextResponse.json(
      { error: 'Failed to enhance video prompt' },
      { status: 500 }
    );
  }
}
