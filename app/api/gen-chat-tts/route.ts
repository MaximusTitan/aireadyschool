import { createClient } from "@deepgram/sdk";
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 0;

if (!process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY) {
  throw new Error('Missing DEEPGRAM_API_KEY environment variable');
}

export async function POST(request: NextRequest) {
  const deepgram = createClient(process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY ?? "");

  try {
    // Extract the text from the request body
    const text = await request.json();
    
    if (typeof text !== 'string') {
      throw new Error('Invalid input: expected string');
    }

    // Remove markdown and clean up the text
    const cleanText = text
      .replace(/\[.*?\]/g, '') // Remove markdown links
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove code blocks
      .trim();

    const result = await deepgram.speak.request({
      text: cleanText,
    });

    const stream = await result.getStream();
    const headers = await result.getHeaders();

    const response = new NextResponse(stream, { headers });
    response.headers.set("Surrogate-Control", "no-store");
    response.headers.set(
      "Cache-Control",
      "s-maxage=0, no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    console.error('Deepgram API error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Text-to-speech conversion failed' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
