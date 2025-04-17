import { NextResponse } from "next/server";

// Function to caption image using Replicate API directly
const captionImage = async (imageBase64: string) => {
  try {
    // Create prediction
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746",
        input: {
          image: imageBase64,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.statusText}`);
    }

    const prediction = await response.json();
    
    // Poll for the result
    const result = await pollPrediction(prediction.id);
    let caption = Array.isArray(result) ? result[0] : result;
    
    if (!caption || typeof caption !== 'string') {
      caption = "I'm not sure what that is. Can you tell me?";
    }
    
    return formatCaption(caption);

  } catch (error) {
    console.error("Caption error:", error);
    throw error;
  }
};

// Function to poll prediction result
async function pollPrediction(id: string, maxAttempts = 30) {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check prediction status');
    }

    const prediction = await response.json();
    if (prediction.status === 'succeeded') {
      return prediction.output;
    } else if (prediction.status === 'failed') {
      throw new Error('Image captioning failed');
    }

    await delay(1000);
  }
  
  throw new Error('Timeout waiting for prediction');
}

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