import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface TextToSpeechRequest {
  text: string;
}

export async function POST(request: NextRequest): Promise<Response | NextResponse> {
  try {
    const { text }: TextToSpeechRequest = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/9BWtsMINqrJLrRacOk9x', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVEN_LABS_API_KEY!,
      },
      body: JSON.stringify({
        text,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Error generating speech: ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('Text-to-speech error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error generating speech' },
      { status: 500 }
    );
  }
}