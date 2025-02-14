import { anthropic } from '@ai-sdk/anthropic';
import { generateText, tool } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
    GENERIC_TEACHER_PROMPT,
    SCIENCE_TEACHER_PROMPT,
    MATH_TEACHER_PROMPT,
    ENGLISH_TEACHER_PROMPT
} from '@/app/utils/systemPrompt';

interface Message {
    text: string;
    isBot: boolean;
    timestamp: string;
}

const subjectTool = tool({
    description: 'Switch to a specific subject system prompt',
    parameters: z.object({
        subject: z.enum(['science', 'math', 'english']),
    }),
    execute: async ({ subject }) => {
        const prompts = {
            science: SCIENCE_TEACHER_PROMPT,
            math: MATH_TEACHER_PROMPT,
            english: ENGLISH_TEACHER_PROMPT,
        };
        return { systemPrompt: prompts[subject] };
    },
});

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
                    content: messages.length === 1 ? GENERIC_TEACHER_PROMPT : messages[0].text,
                },
                ...formattedMessages,
            ],
            maxSteps: 2,
            tools: {
                selectSubject: subjectTool,
            },
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