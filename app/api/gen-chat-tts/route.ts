import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ElevenLabsClient } from 'elevenlabs';

// Setup constants directly from process.env
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const voiceId = 'Xb7hH8MSUJpSbSDYk0k2';
const model = 'eleven_flash_v2_5'; // Using fast model for lower latency

interface GenerateRequest {
  text?: string;
  priority?: string; // Add priority field
}

interface TranscriptionRequest {
  audioData: string;
}

export const runtime = 'edge';

// Speech-to-text endpoint
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

// Text-to-speech endpoint
export async function POST(request: NextRequest): Promise<Response> {
  try {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    // Parse request
    const { text = "Welcome to the text-to-speech service.", priority = "normal" }: GenerateRequest = await request.json().catch(() => ({}));
    
    // Initialize a ReadableStream for the process
    const encoder = new TextEncoder();
    
    // Create a stream for the final output
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Check if the request was aborted
          const isRequestAborted = () => {
            return request.signal && request.signal.aborted;
          };

          // Break text into smaller chunks for faster initial processing
          // This helps get the first audio chunk to the client faster
          const textChunks = breakTextIntoChunks(text, 200); // Break into ~200 character chunks
          
          // Process the text with ElevenLabs WebSocket
          const uri = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=${model}`;
          
          await new Promise<void>((resolve, reject) => {
            try {
              // Create WebSocket connection
              const ws = new WebSocket(uri);
              
              // Check for abort periodically
              const abortChecker = setInterval(() => {
                if (isRequestAborted()) {
                  clearInterval(abortChecker);
                  try {
                    ws.close();
                  } catch (e) {
                    console.error("Error closing websocket on abort:", e);
                  }
                  reject(new Error('Request aborted'));
                }
              }, 100);
              
              ws.onopen = () => {
                // Initialize the stream with optimized settings for lower latency
                ws.send(JSON.stringify({
                  text: ' ',
                  voice_settings: {
                    stability: 0.4, // Lower stability for faster generation
                    similarity_boost: 0.75,
                    use_speaker_boost: true, // Enable speaker boost
                  },
                  xi_api_key: ELEVENLABS_API_KEY, // Add API key in the first message
                  generation_config: { 
                    chunk_length_schedule: [50, 100, 150, 200], // Smaller initial chunks for faster playback
                  },
                }));
                
                // Send the first chunk immediately for faster response
                ws.send(JSON.stringify({ text: textChunks[0] }));
                
                // Send the rest of text chunks after a small delay
                setTimeout(() => {
                  if (textChunks.length > 1) {
                    const remainingText = textChunks.slice(1).join(" ");
                    ws.send(JSON.stringify({ text: remainingText }));
                  }
                  // End the text stream
                  ws.send(JSON.stringify({ text: '' }));
                }, 50); // Small delay to prioritize first chunk
              };
              
              // Process incoming audio chunks
              ws.onmessage = (event) => {
                try {
                  if (isRequestAborted()) {
                    clearInterval(abortChecker);
                    ws.close();
                    reject(new Error('Request aborted'));
                    return;
                  }
                  
                  const data = JSON.parse(event.data);
                  if (data['audio']) {
                    // Send the audio chunk to the client immediately
                    controller.enqueue(encoder.encode(JSON.stringify({
                      type: 'audio',
                      content: data['audio'].trim()  // Base64 encoded audio data
                    }) + '\n'));
                  } else if (data['message']) {
                    // Log any message from ElevenLabs
                    console.log("ElevenLabs message:", data['message']);
                  }
                } catch (error) {
                  console.error('Error processing WebSocket message:', error);
                }
              };
              
              // Handle errors
              ws.onerror = (error) => {
                clearInterval(abortChecker);
                console.error('WebSocket error:', error);
                reject(new Error('WebSocket error during audio generation'));
              };
              
              // Resolve when connection closes
              ws.onclose = () => {
                clearInterval(abortChecker);
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
      },
      cancel() {
        console.log("Stream was canceled by the client");
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'X-Content-Type-Options': 'nosniff', // Prevent MIME sniffing
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  } catch (error) {
    console.error('Text-to-speech error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error generating audio' },
      { status: 500 }
    );
  }
}

// Helper function to break text into smaller chunks
function breakTextIntoChunks(text: string, maxChunkLength: number): string[] {
  if (text.length <= maxChunkLength) return [text];
  
  // Try to break at sentence boundaries first
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxChunkLength) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = sentence;
      } else {
        // If a single sentence is longer than maxChunkLength, break it at word boundaries
        const words = sentence.split(/\s+/);
        let tempChunk = '';
        
        for (const word of words) {
          if ((tempChunk + word).length <= maxChunkLength) {
            tempChunk += (tempChunk ? ' ' : '') + word;
          } else {
            if (tempChunk) {
              chunks.push(tempChunk);
              tempChunk = word;
            } else {
              // If a single word is longer than maxChunkLength, break it at character boundaries
              // (should be very rare)
              chunks.push(word.substring(0, maxChunkLength));
              tempChunk = word.substring(maxChunkLength);
            }
          }
        }
        
        if (tempChunk) {
          currentChunk = tempChunk;
        }
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}