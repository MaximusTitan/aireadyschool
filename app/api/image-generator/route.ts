// /app/api/image-generator/route.ts
import { NextResponse } from "next/server";
import * as fal from "@fal-ai/serverless-client";

fal.config({
  credentials: process.env.FAL_KEY,
});

interface ImageResult {
  images: Array<{ url: string }>; // Adjusted to match expected structure
}

// Add retry logic
async function retryFetch(operation: () => Promise<any>, maxAttempts = 3, delay = 2000): Promise<any> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      // Increase delay for next attempt
      delay *= 1.5;
    }
  }
}

export async function POST(request: Request) {
  try {
    const { prompts } = await request.json(); // Updated to handle `prompts` as an array

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json({ message: "Image prompts are required" }, { status: 400 });
    }

    // Loop through the list of prompts and generate images for each one
    const generatedImages = await Promise.all(
      prompts.map(async (prompt) => {
        try {
          return await retryFetch(async () => {
            // Fixed subscription configuration
            const result: ImageResult = await fal.subscribe("fal-ai/fast-sdxl", {
              input: {
                prompt: `high quality, comic book style art, detailed illustration, professional comic art style, ${prompt}`,
                image_size: "landscape_16_9",
                num_inference_steps: 30,
                guidance_scale: 7.5,
                style_preset: "comic-book",
                seed: Math.floor(Math.random() * 1000000),
              },
              pollInterval: 1000, // 1 second
              timeout: 30000,     // 30 seconds
              logs: true,
              onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                  console.log("Generation in progress:", update.logs);
                }
              },
            });

            if (!result?.images?.[0]?.url) {
              throw new Error("No image URL in response");
            }

            return result.images[0].url;
          });
        } catch (error) {
          console.error(`Failed to generate image after retries:`, error);
          return null; // Handle errors gracefully by returning null for this specific prompt
        }
      })
    );

    // Filter out any failed generations (nulls) from the results
    const validImages = generatedImages.filter((url) => url !== null);

    // If no images were generated successfully, return an error
    if (validImages.length === 0) {
      return NextResponse.json({ message: "Failed to generate images for all prompts" }, { status: 500 });
    }

    // Return all successfully generated image URLs
    return NextResponse.json({ imageUrls: validImages }, { status: 200 });

  } catch (error) {
    console.error("Error generating images:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate images",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Please try again in a few moments"
      },
      { status: 500 }
    );
  }
}