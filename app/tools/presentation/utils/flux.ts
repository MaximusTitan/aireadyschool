'use server'

import { fal } from "@fal-ai/client"

if (!process.env.FAL_KEY) {
  console.error('FAL_KEY is not set. Please set this environment variable in your Vercel project settings.')
}

fal.config({
  credentials: process.env.FAL_KEY,
})

const MAX_RETRIES = 3
const RETRY_DELAY = 2000 // 2 seconds

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function attemptImageGeneration(prompt: string, attempt: number = 1): Promise<string> {
  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY is not set. Image generation is unavailable.')
  }

  try {
    console.log(`Attempt ${attempt} - Generating image for prompt: "${prompt}"`)
    
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt,
        image_size: "square_hd",
        steps: 50,
        seed: Math.floor(Math.random() * 1000000),
        scheduler: "euler_a",
        guidance_scale: 7.5,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    })

    if (!result.data?.images?.[0]?.url) {
      throw new Error('No image URL in response')
    }

    console.log(`Successfully generated image on attempt ${attempt}`)
    console.log('Request ID:', result.requestId)
    return result.data.images[0].url

  } catch (error) {
    console.error(`Attempt ${attempt} failed:`, error)
    if (attempt < MAX_RETRIES) {
      console.log(`Retrying after ${RETRY_DELAY}ms...`)
      await delay(RETRY_DELAY)
      return attemptImageGeneration(prompt, attempt + 1)
    }
    throw error
  }
}

export async function generateImage(prompt: string): Promise<string> {
  if (!process.env.FAL_KEY) {
    console.error('FAL_KEY is not set. Using placeholder image.')
    return `https://via.placeholder.com/1024x1024?text=${encodeURIComponent('Image generation unavailable')}`
  }

  try {
    return await attemptImageGeneration(prompt)
  } catch (error) {
    console.error('Final error in generateImage:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    } else {
      console.error('Unknown error type:', typeof error)
    }
    return `https://via.placeholder.com/1024x1024?text=${encodeURIComponent(prompt)}`
  }
}

