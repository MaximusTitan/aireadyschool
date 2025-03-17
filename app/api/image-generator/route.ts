// /app/api/image-generator/route.ts
import { NextResponse } from "next/server";
import * as fal from "@fal-ai/serverless-client";
import { getComicStyle } from "@/types/comic-styles";

fal.config({
  credentials: process.env.FAL_KEY,
});

interface ImageResult {
  images: Array<{ url: string }>; // Adjusted to match expected structure
}

interface ImageGenerationRequest {
  prompts: string[];
  dialogues?: string[]; // Still receive dialogues but won't use them for image generation
  comicStyle?: string;
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
    const { prompts, dialogues = [], comicStyle = "Cartoon" } = await request.json() as ImageGenerationRequest;

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json({ message: "Image prompts are required" }, { status: 400 });
    }

    // Get the style configuration
    const styleConfig = getComicStyle(comicStyle);
    console.log(`Using comic style: ${styleConfig.name}`);

    // Loop through the list of prompts and generate images for each one
    const generatedImages = await Promise.all(
      prompts.map(async (prompt, index) => {
        try {
          return await retryFetch(async () => {
            // IMPORTANT: Only use the scene description (prompt), not the dialogue
            // Use just the prompt for the scene with no dialogue context
            const finalPrompt = `${styleConfig.positivePrompt}, ${prompt}. Create a visual scene showing this moment.`;
            
            console.log(`Generating image for panel ${index} with scene-only prompt: ${finalPrompt}`);
            
            // Updated to use flux model with style-specific parameters
            const result: ImageResult = await fal.subscribe("fal-ai/flux/dev", {
              input: {
                prompt: finalPrompt,
                negative_prompt: styleConfig.negativePrompt,
                width: 768,
                height: 512,
                guidance_scale: 7.5,
                seed: Math.floor(Math.random() * 1000000),
                scheduler: "dpmpp_2m",
                apply_watermark: false,
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