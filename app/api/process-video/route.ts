import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { YoutubeTranscript } from 'youtube-transcript'

// Initialize OpenAI with error handling for missing API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''  // Provide empty string as fallback
})

// Validate environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set in environment variables')
}

async function getVideoId(url: string): Promise<string> {
  if (!url) throw new Error('URL is required')
  
  try {
    const urlObj = new URL(url)
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1)
    }
    if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      const videoId = urlObj.searchParams.get('v')
      if (!videoId) throw new Error('Invalid YouTube URL format')
      return videoId
    }
    throw new Error('Invalid YouTube URL domain')
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid YouTube URL: ${error.message}`)
    }
    throw new Error('Invalid YouTube URL')
  }
}

async function getVideoTranscript(url: string): Promise<string> {
  try {
    const videoId = await getVideoId(url)
    const transcript = await YoutubeTranscript.fetchTranscript(videoId)
    if (!transcript || transcript.length === 0) {
      throw new Error('No transcript available for this video')
    }
    return transcript.map(item => item.text).join(' ')
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Transcript fetch failed: ${error.message}`)
    }
    throw new Error('Failed to fetch video transcript')
  }
}

export async function POST(req: Request) {
  try {
    // Validate request body
    const body = await req.json().catch(() => ({}))
    if (!body.url) {
      return NextResponse.json(
        { error: 'URL is required in request body' },
        { status: 400 }
      )
    }

    // Get transcript
    let transcript
    try {
      transcript = await getVideoTranscript(body.url)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to fetch transcript' },
        { status: 400 }
      )
    }

    // Verify OpenAI API key
    if (!openai.apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    // Get summary
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates concise video summaries. Focus on the main points and key takeaways."
        },
        {
          role: "user",
          content: `Please provide a concise summary of this video transcript: ${transcript}`
        }
      ],
      max_tokens: 500
    }).catch((error) => {
      console.error('OpenAI API error:', error)
      throw new Error('Failed to generate summary')
    })

    return NextResponse.json({
      summary: completion.choices[0].message.content,
      transcript
    })
  } catch (error) {
    console.error('Error processing video:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process video' },
      { status: 500 }
    )
  }
}