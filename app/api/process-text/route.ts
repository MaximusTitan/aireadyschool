import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const client = new OpenAI({ 
  apiKey: process.env['OPENAI_API_KEY'],
})

export async function POST(request: Request) {
  try {
    const { text, operation, targetLanguage, targetWords }: { 
      text: string, 
      operation: keyof typeof prompts, 
      targetLanguage?: string,
      targetWords?: number 
    } = await request.json()

    const prompts = {
      rewrite: `Rewrite the following text in a different way while maintaining its meaning and tone. Make it engaging and natural:\n${text}`,
      proofread: `Proofread and correct the following text. Fix any grammatical errors, spelling mistakes, and improve clarity. Explain the major corrections made:\n${text}`,
      translate: `Translate the following text to ${targetLanguage}. Maintain the tone and style of the original text, ensuring the translation sounds natural to native speakers:\n${text}`,
      questions: `Generate thought-provoking questions based on the following text. Include both factual and analytical questions:\n${text}`,
      expand: `Expand the following text to exactly ${targetWords} words. Add relevant details, examples, and explanations while maintaining the original message and tone:\n${text}`,
      summarize: `Summarize the following text in exactly ${targetWords} words. Preserve the key points and main message while being concise:\n${text}`,
    }

    const completion = await client.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a professional writer and editor. Provide high-quality, well-structured responses that match the requested format and length."
        },
        { 
          role: "user", 
          content: prompts[operation] 
        }
      ],
      model: "gpt-4",
      temperature: 0.7,
    })

    return NextResponse.json({ result: completion.choices[0].message.content })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Failed to process text' },
      { status: 500 }
    )
  }
}