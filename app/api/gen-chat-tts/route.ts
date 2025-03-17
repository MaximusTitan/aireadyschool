import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ElevenLabsClient } from 'elevenlabs';

// Setup constants directly from process.env
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const voiceId = 'cgSgspJ2msm6clMCkdW9';
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

    // Initialize ElevenLabs client
    const client = new ElevenLabsClient({
      apiKey: ELEVENLABS_API_KEY,
    });

    try {
      // Use the direct API method rather than WebSockets
      const response = await client.textToSpeech.convert(voiceId, {
        output_format: "mp3_44100_128",
        model_id: model,
        text,
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.75,
          use_speaker_boost: true,
        },
      });

      // Convert Readable stream to Buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response) {
        chunks.push(new Uint8Array(chunk));
      }
      const audioData = Buffer.concat(chunks);
      
      // Convert to base64 for safe transmission
      const base64Audio = audioData.toString('base64');
      
      // Send the entire audio file as a single chunk
      // This avoids decoding issues with chunked audio
      return NextResponse.json({
        type: 'audio',
        content: base64Audio
      });
      
    } catch (error) {
      console.error("Error in TTS conversion:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Error generating audio' },
        { status: 500 }
      );
    }
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