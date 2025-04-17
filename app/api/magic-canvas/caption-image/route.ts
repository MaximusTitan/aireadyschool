import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

// Function to caption image using Replicate's BLIP image captioning model
const captionImage = async (imageBase64: string) => {
  try {
    const output = await replicate.run(
      "salesforce/blip:2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746",
      {
        input: {
          image: imageBase64,
        },
      }
    );

    let caption = Array.isArray(output) ? output[0] : output;
    
    if (!caption || typeof caption !== 'string') {
      caption = "I'm not sure what that is. Can you tell me?";
    }
    
    // Format the caption to be more child-friendly
    caption = formatCaption(caption);
    
    return caption;

  } catch (error) {
    console.error("Caption error:", error);
    throw error;
  }
};

// Make captions more child-friendly and concise
const formatCaption = (caption: string): string => {
  // Remove "Caption:" prefix
  caption = caption.replace(/^Caption:\s*/i, "");
  
  // Remove technical language
  caption = caption.replace(/a photograph of /i, "");
  caption = caption.replace(/an image of /i, "");
  caption = caption.replace(/this is /i, "");
  caption = caption.replace(/there is /i, "");
  
  // Remove references to black backgrounds or white paper
  caption = caption.replace(/on a black background/i, "");
  caption = caption.replace(/with a black background/i, "");
  caption = caption.replace(/against a black background/i, "");
  caption = caption.replace(/on white paper/i, "");
  caption = caption.replace(/on a white background/i, "");
  caption = caption.replace(/with a white background/i, "");
  caption = caption.replace(/against a white background/i, "");
  
  // Fix common misconceptions with black drawings
  caption = caption.replace(/black and white drawing/i, "drawing");
  caption = caption.replace(/black and white sketch/i, "sketch");
  caption = caption.replace(/black and white image/i, "drawing");
  
  // Simplify language
  caption = caption.replace(/appears to be/i, "looks like");
  
  // Remove confidence indicators
  caption = caption.replace(/possibly/i, "");
  caption = caption.replace(/probably/i, "");
  
  // Make it more concise
  caption = caption.trim();
  
  // Ensure first letter is capitalized
  caption = caption.charAt(0).toUpperCase() + caption.slice(1);
  
  return caption;
};

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    const caption = await captionImage(image);

    return NextResponse.json({ caption });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}