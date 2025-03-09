import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { ElevenLabsClient } from 'elevenlabs';

// Setup constants directly from process.env
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const voiceId = 'Xb7hH8MSUJpSbSDYk0k2';
const model = 'eleven_flash_v2_5';

interface GenerateRequest {
  prompt?: string;
}

interface TranscriptionRequest {
  audioData: string;
}

export const runtime = 'edge';

// New endpoint for speech-to-text
export async function PUT(request: NextRequest): Promise<Response> {
  try {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    // Parse request with audio data
    const { audioData }: TranscriptionRequest = await request.json();
    
    if (!audioData) {
      throw new Error('Audio data is missing');
    }

    // Initialize ElevenLabs client
    const client = new ElevenLabsClient({
      apiKey: ELEVENLABS_API_KEY,
    });

    // Convert base64 to blob
    const binaryString = atob(audioData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBlob = new Blob([bytes], { type: "audio/mp3" });

    // Perform speech-to-text conversion
    const transcription = await client.speechToText.convert({
      file: audioBlob,
      model_id: "scribe_v1", // Current model
      tag_audio_events: true,
      language_code: "eng",
    });

    return NextResponse.json({
      text: transcription.text,
    });
    
  } catch (error) {
    console.error('Speech-to-text error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error processing speech-to-text' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    // Parse request
    const { prompt = "Invent a new holiday and describe its traditions." }: GenerateRequest = await request.json().catch(() => ({}));
    
    // Initialize a ReadableStream for the combined process
    const encoder = new TextEncoder();
    
    // Create a stream for the final output
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Generate text with OpenAI
          const textResult = streamText({
            model: openai('gpt-4o-mini'),
            prompt,
            temperature: 0.7,
            maxTokens: 500,
          });

          // Collect the complete generated text
          let fullText = '';
          for await (const textChunk of textResult.textStream) {
            fullText += textChunk;
            
            // Stream the text chunk to the client
            controller.enqueue(encoder.encode(JSON.stringify({
              type: 'text',
              content: textChunk
            }) + '\n'));
          }
          
          // Process the full text with ElevenLabs WebSocket
          // Connect to the WebSocket without including API key in the URI
          const uri = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=${model}`;
          
          // We're setting up a Promise to handle the WebSocket connection
          await new Promise<void>((resolve, reject) => {
            try {
              // Create WebSocket connection
              const ws = new WebSocket(uri);
              
              ws.onopen = () => {
                // Initialize the stream with voice settings and include the API key
                ws.send(JSON.stringify({
                  text: ' ',
                  voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.8,
                    use_speaker_boost: false,
                  },
                  xi_api_key: ELEVENLABS_API_KEY, // Add API key in the first message
                  generation_config: { chunk_length_schedule: [120, 160, 250, 290] },
                }));
                
                // Send the generated text
                ws.send(JSON.stringify({ text: fullText }));
                
                // End the text stream
                ws.send(JSON.stringify({ text: '' }));
              };
              
              // Process incoming audio chunks
              ws.onmessage = (event) => {
                try {
                  const data = JSON.parse(event.data);
                  if (data['audio']) {
                    // Log audio chunk size for debugging
                    console.log(`Received audio chunk of size: ${data['audio'].length} bytes`);
                    
                    // Ensure the audio data is properly formatted base64
                    // ElevenLabs should return valid base64, but let's make sure
                    const audioBase64 = data['audio'].trim();
                    
                    // Send the audio chunk to the client
                    controller.enqueue(encoder.encode(JSON.stringify({
                      type: 'audio',
                      content: audioBase64  // Base64 encoded audio data
                    }) + '\n'));
                  } else if (data['message']) {
                    // Log any message from ElevenLabs
                    console.log("ElevenLabs message:", data['message']);
                  } else {
                    // Log any other data structure for debugging
                    console.log("Received non-audio data from ElevenLabs:", data);
                  }
                } catch (error) {
                  console.error('Error processing WebSocket message:', error);
                  console.error('Raw message data:', typeof event.data === 'string' ? event.data.substring(0, 100) + '...' : 'Binary data');
                }
              };
              
              // Handle errors
              ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                reject(new Error('WebSocket error during audio generation'));
              };
              
              // Resolve when connection closes
              ws.onclose = () => {
                resolve();
              };
            } catch (error) {
              reject(error);
            }
          });
          
          // End the stream
          controller.close();
        } catch (error) {
          console.error('Stream processing error:', error);
          controller.error(error);
        }
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Generate text-audio error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error generating content' },
      { status: 500 }
    );
  }
}
