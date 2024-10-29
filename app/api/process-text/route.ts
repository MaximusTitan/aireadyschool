import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const client = new OpenAI({ 
  apiKey: process.env['OPENAI_API_KEY'],
})

export async function POST(request: Request) {
  try {
    const { text, operation, targetLanguage }: { text: string, operation: keyof typeof prompts, targetLanguage?: string } = await request.json()

    const prompts = {
      rewrite: `Rewrite the following text in a different way while maintaining its meaning:\n${text}`,
      proofread: `Proofread and correct the following text, fixing any grammatical errors, spelling mistakes, and improving clarity:\n${text}`,
      translate: `Translate the following text to ${targetLanguage}:\n${text}`,
      questions: `Generate relevant questions based on the following text:\n${text}`,
      expand: `Expand the following text with additional details and explanations:\n${text}`,
      summarize: `Provide a concise summary of the following text:\n${text}`,
    }

    const completion = await client.chat.completions.create({
      messages: [{ role: "user", content: prompts[operation] }],
      model: "gpt-3.5-turbo",
    })

    return NextResponse.json({ 
      result: completion.choices[0].message.content 
    })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Failed to process text' },
      { status: 500 }
    )
  }
}