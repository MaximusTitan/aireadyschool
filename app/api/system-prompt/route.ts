import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { SCIENCE_TEACHER_PROMPT } from '@/app/utils/systemPrompt';

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        const result = await generateText({
            model: anthropic('claude-3-haiku-20240307'),
            messages: [
                {
                    role: 'system',
                    content: SCIENCE_TEACHER_PROMPT,
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });

        return NextResponse.json({ text: result.text });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate response' },
            { status: 500 }
        );
    }
}