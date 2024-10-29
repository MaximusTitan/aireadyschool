import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { YoutubeTranscript } from 'youtube-transcript'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

async function getVideoId(url: string): Promise<string> {
  try {
    const urlObj = new URL(url)
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1)
    }
    return urlObj.searchParams.get('v') || ''
  } catch {
    throw new Error('Invalid YouTube URL')
  }
}

async function getVideoTranscript(url: string): Promise<string> {
  const videoId = await getVideoId(url)
  if (!videoId) {
    throw new Error('Invalid YouTube URL')
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId)
    return transcript.map(item => item.text).join(' ')
  } catch (error) {
    throw new Error('Failed to fetch video transcript')
  }
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    
    let transcript
    try {
      transcript = await getVideoTranscript(url)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to fetch transcript' },
        { status: 400 }
      )
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
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
    })

    return NextResponse.json({
      summary: completion.choices[0].message.content,
      transcript
    })
  } catch (error) {
    console.error('Error processing video:', error)
    return NextResponse.json(
      { error: 'Failed to process video' },
      { status: 500 }
    )
  }
}