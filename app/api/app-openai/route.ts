import { NextResponse } from 'next/server'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export async function POST(request: Request) {
    try {

        const body = await request.json()
        const { prompt } = body

        const { text } = await generateText({
            model: openai('gpt-4o'),
            prompt: prompt,
        })

        return NextResponse.json({ text })
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json(
            { error: 'Failed to generate response' },
            { status: 500 }
        )
    }
}
