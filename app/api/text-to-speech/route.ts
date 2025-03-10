import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface TextToSpeechRequest {
  text: string;
}

// Initialize ElevenLabs configuration directly from process.env
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const voiceId = 'Xb7hH8MSUJpSbSDYk0k2';
const model = 'eleven_flash_v2_5';

// Set the runtime to edge
export const runtime = 'edge';

export async function POST(request: NextRequest): Promise<Response | NextResponse> {
  try {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured in environment variables');
    }

    // Parse and validate request body
    const { text }: TextToSpeechRequest = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Create a stream to pipe the audio data
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // Process in the background
    (async () => {
      try {
        // Connect to ElevenLabs WebSocket API
        // In edge runtime, we need to include the API key as a query parameter
        const uri = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=${model}&xi-api-key=${encodeURIComponent(ELEVENLABS_API_KEY)}`;
        
        // Use native WebSocket in Edge runtime
        const ws = new WebSocket(uri);
        
        // Set up connection handlers
        ws.onopen = () => {
          // Initialize the stream with voice settings
          ws.send(JSON.stringify({
            text: ' ',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.8,
              use_speaker_boost: false,
            },
            generation_config: { chunk_length_schedule: [120, 160, 250, 290] },
          }));
          
          // Send the actual text
          ws.send(JSON.stringify({ text }));
          
          // End the text stream
          ws.send(JSON.stringify({ text: '' }));
        };
        
        // Process incoming audio chunks
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data['audio']) {
              const audioBuffer = Buffer.from(data['audio'], 'base64');
              writer.write(new Uint8Array(audioBuffer));
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };
        
        // Handle errors
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          writer.abort(new Error('WebSocket error'));
        };
        
        // Close the writer when the connection closes
        ws.onclose = () => {
          writer.close();
        };
      } catch (error) {
        console.error('Error in WebSocket processing:', error);
        writer.abort(error instanceof Error ? error : new Error('Unknown error'));
      }
    })();

    return new Response(readable, {
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