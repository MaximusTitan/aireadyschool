import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      console.error('GROQ_API_KEY is not set')
      return NextResponse.json(
        { error: 'API key not configured. Please check your environment variables.' },
        { status: 500 }
      )
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: `You are a friendly language learning assistant for children in grades 1-4. 
            Your responses should be:
            1. Simple and easy to understand
            2. Encouraging and positive
            3. Educational and focused on language learning
            4. Age-appropriate
            5. Include translations when teaching new words
            6. Use emojis occasionally to make it fun
            7. Keep responses brief and engaging`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Groq API error:', {
        status: response.status,
        statusText: response.statusText,
        error: data
      })
      return NextResponse.json(
        { error: `AI service error: ${data.error?.message || response.statusText}` },
        { status: response.status }
      )
    }
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid response format from Groq:', data)
      return NextResponse.json(
        { error: 'Invalid response format from AI service' },
        { status: 500 }
      )
    }

    return NextResponse.json({ response: data.choices[0].message.content })
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process chat request' },
      { status: 500 }
    )
  }
} 