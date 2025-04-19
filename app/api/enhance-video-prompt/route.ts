import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
    try {
        const { currentPrompt } = await request.json();

        const enhancementPrompt = `Convert this video motion description into a calm, safe, 
        non-violent, and natural movement description suitable for AI video generation.
        Focus on gentle movements, subtle transitions, and natural flow.

        Original description: "${currentPrompt}"

        Guidelines:
        - Remove any references to violence, weapons, or combat
        - Focus on natural movements and transitions
        - Use neutral descriptive language
        - Keep character descriptions generic
        - Emphasize cinematic qualities
        - Make it suitable for all audiences
        - Keep the core creative intent but make it safe

        Enhanced description:`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: enhancementPrompt }],
            temperature: 0.7,
            max_tokens: 150
        });

        const enhancedPrompt = completion.choices[0].message.content;

        return NextResponse.json({ 
            success: true, 
            enhancedPrompt 
        });

    } catch (error) {
        console.error('Error enhancing video prompt:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to enhance prompt' 
        }, { 
            status: 500 
        });
    }
}
