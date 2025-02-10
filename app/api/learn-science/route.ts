import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { LEARN_SCIENCE_PROMPT } from '@/app/utils/systemPrompt';

interface Message {
    text: string;
    isBot: boolean;
    timestamp: string;
}

export async function POST(req: Request) {
    try {
        const { prompt, messages } = await req.json();

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        const formattedMessages = messages.map((msg: Message) => ({
            role: msg.isBot ? 'assistant' : 'user',
            content: msg.text,
        }));

        const result = await generateText({
            model: anthropic('claude-3-haiku-20240307'),
            messages: [
                {
                    role: 'system',
                    content: LEARN_SCIENCE_PROMPT,
                },
                ...formattedMessages,
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