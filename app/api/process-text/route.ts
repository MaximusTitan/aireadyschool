import { NextResponse } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { logTokenUsage } from '@/utils/logTokenUsage'
import { createClient } from '@/utils/supabase/server'

// Create a customized OpenAI provider instance
const openai = createOpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
  compatibility: 'strict', // Use strict mode for official OpenAI API
})

export async function POST(request: Request) {
  try {
    // Create Supabase client
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, operation, targetLanguage, targetWords }: { 
      text: string, 
      operation: string, 
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

    try {
      const { text: result, usage } = await generateText({
        model: openai('gpt-4o'),
        prompt: prompts[operation as keyof typeof prompts],
        temperature: 0.7,
        system: "You are a professional writer and editor. Provide high-quality, well-structured responses that match the requested format and length."
      })

      // Log token usage
      if (usage) {
        await logTokenUsage(
          'Text Tools',
          'GPT-4o',
          usage.promptTokens,
          usage.completionTokens,
          user.email
        );
      }

      return NextResponse.json({ result })
    } catch (error: any) {
      console.error('OpenAI API error:', error)
      
      // Check if it's a quota exceeded error
      if (error.statusCode === 429 || 
          (error.lastError?.statusCode === 429) ||
          (error.lastError?.data?.error?.code === 'insufficient_quota')) {
        return NextResponse.json(
          { 
            error: "Error 600: Too many students! AI Ready School will be back soon.",
            errorType: 'rate_limit'
          },
          { status: 429 }
        )
      }
      
      // Handle other API errors
      const errorMessage = error.lastError?.data?.error?.message || 
                          error.message || 
                          'An unexpected error occurred with the AI service'
      
      return NextResponse.json(
        { error: errorMessage, errorType: 'api_error' },
        { status: error.statusCode || error.lastError?.statusCode || 500 }
      )
    }
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Failed to process text', errorType: 'server_error' },
      { status: 500 }
    )
  }
}