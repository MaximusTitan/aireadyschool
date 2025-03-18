import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { messages, threadId } = await req.json();
        const supabase = await createClient();
        
                // Generate title using first few messages
        const { text: newTitle } = await generateText({
            model: openai('gpt-4o-mini'),
            prompt: `Generate a very brief simple title (max 4 words) based on this conversation, keep it user friendly, this is for the chat title of users first few conversations, do not use any double quotes: ${messages.slice(0, 3).map((m: { content: any; }) => m.content).join(' ')}`,
            temperature: 0.7,
            maxTokens: 20,
        });

        // Update the thread title
        const { error } = await supabase
            .from('chat_threads')
            .update({ title: newTitle || 'New Chat' })
            .eq('id', threadId);

        if (error) throw error;

        return NextResponse.json({ title: newTitle });
    } catch (error) {
        console.error('Error generating title:', error);
        return NextResponse.json({ error: 'Failed to generate title' }, { status: 500 });
    }
}
