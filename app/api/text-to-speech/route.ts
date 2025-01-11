import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface TextToSpeechRequest {
  text: string;
}

interface ElevenLabsError {
  detail?: {
    message?: string;
    status?: string;
  };
  message?: string;
}

export async function POST(request: NextRequest): Promise<Response | NextResponse> {
  try {
    // Validate API key existence
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    if (!apiKey) {
      throw new Error('ELEVEN_LABS_API_KEY is not configured in environment variables');
    }

    // Parse and validate request body
    const { text }: TextToSpeechRequest = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/9BWtsMINqrJLrRacOk9x/stream', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    // Handle API-specific errors
    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData: ElevenLabsError = await response.json();
        errorMessage = errorData.detail?.message || errorData.message || errorMessage;
      } catch {
        // If error parsing fails, use default message
      }

      if (response.status === 401) {
        throw new Error('Invalid or missing API key. Please check your ElevenLabs API key configuration.');
      }

      throw new Error(`ElevenLabs API error: ${errorMessage}`);
    }

    const audioBuffer = await response.arrayBuffer();
    
    // Validate audio buffer
    if (!audioBuffer || audioBuffer.byteLength === 0) {
      throw new Error('Received empty audio response from ElevenLabs');
    }

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Text-to-speech error:', error);
    
    // Determine appropriate status code
    let statusCode = 500;
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        statusCode = 401;
      } else if (error.message.includes('Text is required')) {
        statusCode = 400;
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error generating speech' },
      { status: statusCode }
    );
  }
}