interface PosterOptions {
    theme: string
    content: {
      title: string
      subtitle: string
      description: string
      contact: string
      website: string
      features: string[]
    }
    customization: {
      primaryColor: string
      accentColor: string
      font: string
    }
  }
  
  interface PosterResponse {
    image: {
      url: string
    }
  }
  
  export async function generateSchoolPoster(options: PosterOptions): Promise<PosterResponse> {
    const apiKey = process.env.FLUX_API_KEY
    if (!apiKey) {
      throw new Error("FLUX_API_KEY is not set in environment variables")
    }
  
    console.log("Generating school poster with options:", JSON.stringify(options, null, 2))
  
    try {
      const response = await fetch("https://fal.run/fal-ai/recraft-v3", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Key ${apiKey}`,
        },
        body: JSON.stringify({
          prompt: `Create a professional school marketing poster with the following details:
            Theme: ${options.theme}
            Title: ${options.content.title}
            Subtitle: ${options.content.subtitle}
            Description: ${options.content.description}
            Features: ${options.content.features.join(", ")}
            Contact: ${options.content.contact}
            Website: ${options.content.website}
            Style: Modern education design with curved elements
            Colors: Primary color ${options.customization.primaryColor}, Accent color ${options.customization.accentColor}
            Font: ${options.customization.font}`,
          input: {
            type: "poster",
            style: {
              primaryColor: options.customization.primaryColor,
              secondaryColor: options.customization.accentColor,
              font: options.customization.font,
            },
          },
        }),
      })
  
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Fal AI API error response:", errorText)
        throw new Error(`Fal AI API error: ${response.status} ${response.statusText}. ${errorText}`)
      }
  
      const data = await response.json()
      console.log("Fal AI API response:", JSON.stringify(data, null, 2))
  
      if (!data.image || !data.image.url) {
        console.error("Invalid Fal AI API response:", data)
        throw new Error("Invalid response from Fal AI API: missing image URL")
      }
  
      return {
        image: {
          url: data.image.url,
        },
      }
    } catch (error) {
      console.error("Error in generateSchoolPoster:", error)
      throw error
    }
  }
  
  