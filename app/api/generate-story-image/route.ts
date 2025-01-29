// app/api/generate/route.ts
import { NextResponse } from 'next/server'
import { fal } from "@fal-ai/client"

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()
    
    // Enhance the prompt for better story-related images
    const enhancedPrompt = `Illustration for a story scene: ${prompt}. Digital art style, vibrant colors, story book illustration, detailed, professional quality`;

    fal.config({
      credentials: process.env.FAL_KEY
    })

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: enhancedPrompt,
        image_size: "landscape_16_9",
        num_inference_steps: 10,
        num_images: 1,
        enable_safety_checker: true
      }
    })

    if (!result.data?.images?.[0]) {
      throw new Error('No image generated');
    }

    return NextResponse.json({ imageUrl: result.data.images[0].url });
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}