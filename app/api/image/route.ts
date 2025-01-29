// app/api/generate/route.ts
import { NextResponse } from 'next/server'
import { fal } from "@fal-ai/client"

export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Configure FAL client
        fal.config({
            credentials: process.env.FAL_KEY
        })

        // Generate images
        const result = await fal.subscribe("fal-ai/flux/schnell", {
            input: {
                prompt: body.prompt,
                image_size: body.image_size,
                num_inference_steps: body.num_inference_steps,
                num_images: body.num_images,
                enable_safety_checker: body.enable_safety_checker
            }
        })

        return NextResponse.json(result.data)
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json(
            { error: 'Failed to generate image' },
            { status: 500 }
        )
    }
}
