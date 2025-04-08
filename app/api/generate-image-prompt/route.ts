import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  try {
    const { sceneText } = await req.json()

    const prompt = `Enhance this image prompt to be more detailed and specific. 
    Add details about:
    - Composition and camera angle
    - Lighting and atmosphere
    - Color palette and mood
    - Specific details to focus on
    - Art style and quality parameters

    Original prompt: "${sceneText}"

    Return only the enhanced prompt without any explanations or formatting.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 200,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    })

    const enhancedPrompt = completion.choices[0].message.content?.trim()

    return NextResponse.json({ 
      success: true,
      prompt: enhancedPrompt 
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to enhance prompt' },
      { status: 500 }
    )
  }
}
