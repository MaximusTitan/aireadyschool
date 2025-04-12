import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  try {
    const { imageDescription, sceneDescription } = await req.json();

    const prompt = `Create a concise 5-second narration script (approximately 100-120 characters) for this scene.
The script should be natural, engaging, and focused only on the essential action.
Avoid sound effects, technical directions, or camera notes.
Make it flow smoothly for voice narration.

Scene Description: ${sceneDescription}
Visual Details: ${imageDescription}

Requirements:
- Keep it between 100-120 characters
- Make it sound natural for voice narration
- Focus on the main action and most important details
- Use present tense
- Avoid any brackets, quotes, or special formatting`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 100,
      presence_penalty: 0.2,
      frequency_penalty: 0.3
    });

    const audioScript = completion.choices[0].message.content?.trim();

    // Ensure the script is within length limits
    const cleanScript = audioScript
      ?.replace(/[\[\](){}]/g, '')
      .replace(/["']/g, '')
      .trim()
      .slice(0, 120); // Hard limit at 120 characters

    return NextResponse.json({
      success: true,
      audioScript: cleanScript,
      characterCount: cleanScript?.length || 0
    });

  } catch (error) {
    console.error('Error generating audio script:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio script' },
      { status: 500 }
    );
  }
}
