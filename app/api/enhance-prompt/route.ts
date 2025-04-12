import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const enhancedPromptResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `Enhance this image prompt for a cinematic, realistic image. Add specific details about lighting, atmosphere, camera angles, and visual style while maintaining the original meaning: "${prompt}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const enhancedPrompt = enhancedPromptResponse.choices[0].message.content;

    return NextResponse.json({ enhancedPrompt });
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    return NextResponse.json(
      { error: 'Failed to enhance prompt' },
      { status: 500 }
    );
  }
}
