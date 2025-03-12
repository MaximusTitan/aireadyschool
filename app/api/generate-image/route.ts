'use server'

import { NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

// Configure the Fal client with credentials
if (!process.env.FLUX_API_KEY) {
  console.error('FLUX_API_KEY is not set. Please set this environment variable.');
}

// Set up the client once at the module level
fal.config({
  credentials: process.env.FLUX_API_KEY,
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function attemptImageGeneration(prompt: string, attempt: number = 1): Promise<string> {
  try {
    console.log(`Attempt ${attempt} - Generating image for prompt: "${prompt}"`);
    
    const result = await fal.subscribe("fal-ai/recraft-v3", {
      input: {
        prompt,
        image_size: "square_hd",
        style: "digital_illustration"
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log('Generation in progress:', update.status);
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    if (!result.data?.images?.[0]?.url) {
      throw new Error('No image URL in response');
    }

    console.log(`Successfully generated image on attempt ${attempt}`);
    return result.data.images[0].url;

  } catch (error) {
    console.error(`Attempt ${attempt} failed:`, error);

    if (attempt < MAX_RETRIES) {
      console.log(`Retrying after ${RETRY_DELAY}ms...`);
      await delay(RETRY_DELAY);
      return attemptImageGeneration(prompt, attempt + 1);
    }
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Image prompt is required' },
        { status: 400 }
      );
    }

    if (!process.env.FLUX_API_KEY) {
      throw new Error('FLUX_API_KEY is not set in environment variables');
    }

    const imageUrl = await attemptImageGeneration(prompt);
    
    return NextResponse.json({ 
      imageUrl,
      success: true 
    });

  } catch (error) {
    console.error('Error generating image:', error);
    
    // Create a fallback URL using Unsplash
    const fallbackPrompt = encodeURIComponent("abstract art");
    const fallbackImage = `https://source.unsplash.com/800x600/?${fallbackPrompt}`;
    
    return NextResponse.json({ 
      imageUrl: fallbackImage,
      error: error instanceof Error ? error.message : 'Failed to generate image',
      fallback: true
    });
  }
}
