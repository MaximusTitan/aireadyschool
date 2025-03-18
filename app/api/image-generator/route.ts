import { NextResponse } from "next/server";
import * as fal from "@fal-ai/serverless-client";
import { getComicStyle } from "@/types/comic-styles";

fal.config({
  credentials: process.env.FAL_KEY,
});

interface ImageResult {
  images: Array<{ url: string }>;
}

interface ImageGenerationRequest {
  prompts: string[];
  dialogues?: string[];
  comicStyle?: string;
  characterDescriptions?: {
    mainCharacter?: { appearance: string };
    supportingCharacters?: Array<{ appearance: string }>;
  };
}

// Add retry logic with backoff
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
    const { prompts, dialogues = [], comicStyle = "Cartoon", characterDescriptions } = await request.json() as ImageGenerationRequest;

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json({ message: "Image prompts are required" }, { status: 400 });
    }

    // Get the style configuration
    const styleConfig = getComicStyle(comicStyle);
    console.log(`Using comic style: ${styleConfig.name}`);

    // Create a much more detailed character consistency prompt
    const mainCharDesc = characterDescriptions?.mainCharacter?.appearance || '';
    const supportingCharsDesc = characterDescriptions?.supportingCharacters?.map((c: any) => c.appearance).join(', ') || '';
    
    // Extract key visual attributes for stronger prompting
    const extractVisualAttributes = (description: string) => {
      // Match patterns like "tall with blonde hair" or "wearing a red coat"
      const attributes = description.match(/([a-z]+ [a-z]+ [a-z]+|[a-z]+ [a-z]+)/gi) || [];
      return attributes.join(', ');
    };
    
    const mainCharVisuals = extractVisualAttributes(mainCharDesc);
    
    // Create a much stronger character consistency prompt
    const characterConsistencyPrompt = `
      Main character: ${mainCharDesc} ${mainCharVisuals ? `(key features: ${mainCharVisuals})` : ''}
      Supporting characters: ${supportingCharsDesc}
      Characters must have EXACTLY the same appearance, clothing, face, hairstyle, and accessories in ALL panels.
      Maintain consistent character heights, builds, and proportions throughout.
    `.trim();

    const basePrompt = `
      ${styleConfig.positivePrompt},
      ${characterConsistencyPrompt},
      Professional comic book art, consistent character designs, high quality illustration
    `.trim();

    const enhancedNegativePrompt = `
      ${styleConfig.negativePrompt},
      inconsistent character design, varying appearances, wrong clothing, different faces,
      deformed features, bad anatomy, incorrect character details, changing hairstyles,
      inconsistent skin tones, varying heights, changing eye colors
    `.trim();

    // Generate a single seed to be used for ALL panels
    // This is crucial for character consistency
    const persistentSeed = Math.floor(Math.random() * 1000000);
    console.log(`Using persistent seed ${persistentSeed} for all panels to maintain character consistency`);

    // Loop through the list of prompts and generate images for each one
    const generatedImages = await Promise.all(
      prompts.map(async (prompt, index) => {
        try {
          return await retryFetch(async () => {
            // For title panel (index 0), use a different prompt structure
            const isTitlePanel = index === 0;
            
            const finalPrompt = isTitlePanel ? 
              `
                ${basePrompt}
                Title panel for comic: ${prompt}
                Characters shown in dynamic pose, clear facial details, establishing the visual style.
                ${characterConsistencyPrompt}
              `.replace(/\s+/g, ' ').trim() :
              `
                ${basePrompt}
                Scene: ${prompt}
                Characters must look EXACTLY THE SAME as in previous panels.
                ${index > 1 ? "Reference previous panels for exact character appearance." : ""}
                High quality comic art style with consistent character designs.
              `.replace(/\s+/g, ' ').trim();
            
            console.log(`Generating image for panel ${index} with prompt: ${finalPrompt.substring(0, 100)}...`);
            
            // Use the same seed for ALL panels to maintain character consistency
            // Only vary the guidance scale slightly to allow for different poses while keeping appearance
            const result: ImageResult = await fal.subscribe("fal-ai/flux/dev", {
              input: {
                prompt: finalPrompt,
                negative_prompt: enhancedNegativePrompt,
                width: 768,
                height: 512,
                guidance_scale: 8.5 + (index * 0.1), // Slight variation in guidance to allow pose changes
                seed: persistentSeed, // Use the SAME seed for all panels
                num_inference_steps: 50,
                scheduler: "euler_a",
                apply_watermark: false,
              },
              pollInterval: 1000,
              timeout: 30000,
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
          return null;
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