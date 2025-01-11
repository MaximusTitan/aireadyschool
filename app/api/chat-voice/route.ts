import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { NextRequest } from 'next/server';

interface ChatRequest {
  message: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { message }: ChatRequest = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Keep your responses clear and concise, focusing on the most important information. Limit response to 100 words maximum'
        },
        { role: 'user', content: message }
      ],
    });

    return NextResponse.json({
      response: completion.choices[0].message.content ?? '',
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error processing chat request' },
      { status: 500 }
    );
  }
}