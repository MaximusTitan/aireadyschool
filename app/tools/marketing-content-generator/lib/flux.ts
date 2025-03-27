interface PosterOptions {
    posterType: string
    content: {
      title: string
      subtitle: string
      description: string
      date: string
      venue: string
      phoneNumber?: string
      schoolWebsite?: string
    }
    style: string
  }
  
  interface PosterResponse {
    imageUrl: string
  }

interface ThumbnailOptions {
  prompt: string;
  style: string;
  ratio: "16:9" | "9:16" | "5:2";
  logo?: File | null;
}

export async function generateImage(options: ThumbnailOptions): Promise<{ imageUrl: string }> {
  const apiKey = process.env.FLUX_API_KEY;
  if (!apiKey) {
    throw new Error("FLUX_API_KEY is not set in environment variables");
  }

  // Map style preferences to Fal AI styles
  const styleMap: { [key: string]: string } = {
    digital: "digital_illustration/cover",
    "3d": "digital_illustration/handmade_3d",
    neon: "digital_illustration/neon_calm",
    dark: "digital_illustration/noir",
    tech: "vector_illustration/line_circuit",
    minimal: "vector_illustration/thin",
    anime: "digital_illustration/young_adult_book",
  };

  // Map ratios to Fal AI image sizes
  const ratioToImageSize = {
    "16:9": "landscape_16_9",
    "9:16": "portrait_16_9",
    "5:2": "landscape_4_3", // Best approximation for banner
  };

  const imageSize = ratioToImageSize[options.ratio] || "landscape_16_9";
  console.log(`Using image size: ${imageSize} for ratio: ${options.ratio}`);

  // Ensure prompt is within limits
  const truncatedPrompt = options.prompt.slice(0, 900); // Leave room for additional instructions

  try {
    const requestBody = {
      prompt: truncatedPrompt,
      style: styleMap[options.style] || "digital_illustration/cover",
      image_size: imageSize,
      num_images: 1,
      steps: 10,
      seed: Math.floor(Math.random() * 1000000),
    };

    console.log("Sending request to Fal AI:", {
      ...requestBody,
      prompt: requestBody.prompt.substring(0, 100) + "..." // Log truncated version
    });

    const response = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error("Fal AI error response:", responseText);
      console.error("Request body:", requestBody);
      throw new Error(`Fal AI API error (${response.status}): ${responseText}`);
    }

    try {
      const data = JSON.parse(responseText);
      if (!data.images?.[0]?.url) {
        throw new Error("Missing image URL in response");
      }
      return { imageUrl: data.images[0].url };
    } catch (parseError) {
      console.error("Failed to parse Fal AI response:", responseText);
      throw new Error("Invalid response format from Fal AI");
    }
  } catch (error) {
    console.error("Error in generateImage:", error);
    throw error;
  }
}
  
  export async function generatePoster(options: PosterOptions, signal: AbortSignal): Promise<PosterResponse> {
    const apiKey = process.env.FLUX_API_KEY
    if (!apiKey) {
      throw new Error("FLUX_API_KEY is not set in environment variables")
    }
  
    console.log("Generating poster with options:", JSON.stringify(options, null, 2))
  
    const contactDetails = []
    if (options.content.phoneNumber) {
      contactDetails.push(`Phone: ${options.content.phoneNumber}`)
    }
    if (options.content.schoolWebsite) {
      contactDetails.push(`Website: ${options.content.schoolWebsite}`)
    }
    const contactString =
      contactDetails.length > 0 ? `Contact Details (place in bottom-right corner): ${contactDetails.join(", ")}` : ""
  
    try {
      const response = await fetch("https://fal.run/fal-ai/flux/schnell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Key ${apiKey}`,
        },
        body: JSON.stringify({
          prompt: `Create a professional and eye-catching vector illustration style poster for school marketing. This should be a ${options.posterType} poster with the following details:
            Title: ${options.content.title}
            Subtitle: ${options.content.subtitle}
            Description: ${options.content.description}
            Date: ${options.content.date}
            Venue: ${options.content.venue}
            ${contactString}
            Style: Vibrant and modern educational design suitable for ${options.posterType}. Use appropriate imagery and color scheme for the theme. If contact details are provided, display them in a subtle but readable manner in the bottom-right corner of the poster.`,
          style: "vector_illustration",
          image_size: "square_hd",
          num_images: 1,
          steps: 10,
        }),
        signal: signal,
      })
  
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Fal AI API error response:", errorText)
        throw new Error(`Fal AI API error: ${response.status} ${response.statusText}. ${errorText}`)
      }
  
      const data = await response.json()
      console.log("Fal AI API response:", JSON.stringify(data, null, 2))
  
      if (!data.images || !Array.isArray(data.images) || data.images.length === 0 || !data.images[0].url) {
        console.error("Invalid Fal AI API response:", data)
        throw new Error("Invalid response from Fal AI API: missing image URL")
      }
  
      return { imageUrl: data.images[0].url }
    } catch (error) {
      console.error("Error in generatePoster:", error)
      throw error
    }
  }

