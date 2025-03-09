import { NextResponse } from 'next/server';

export async function GET() {
  // Only include the API key if it exists in environment variables
  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json(
      { error: 'ElevenLabs API key not configured' },
      { status: 500 }
    );
  }

  // Return the API key to the client
  return NextResponse.json({ apiKey: process.env.ELEVENLABS_API_KEY });
}
