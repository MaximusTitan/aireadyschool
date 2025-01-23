"use server"

import { generateContent, type GenerateResponse } from "./lib/openai"
import { generatePoster } from "./lib/flux"

export async function generateEventAnnouncement(eventType: string, details: string): Promise<GenerateResponse> {
  console.log("Generating school event announcement for:", eventType)
  const systemPrompt =
    "You are a professional school announcement writer. Create engaging and informative announcements for school events."
  const userPrompt = `Create a school announcement for a ${eventType} event with the following details: ${details}`
  return generateContent(userPrompt, systemPrompt)
}

export async function generateVideoScript(
  videoType: string,
  highlights: string,
  targetAudience: string,
  duration: string,
): Promise<GenerateResponse> {
  console.log("Generating video script for:", videoType)
  const systemPrompt =
    "You are a professional video script writer for educational institutions. Create engaging scripts for school promotional videos."
  const userPrompt = `Create a ${duration}-second video script for a ${videoType} video targeting ${targetAudience}. Key highlights: ${highlights}`
  return generateContent(userPrompt, systemPrompt)
}

export async function generateSocialMediaPost(
  platform: string,
  postType: string,
  content: string,
): Promise<GenerateResponse> {
  console.log("Generating social media content for:", platform)
  const systemPrompt =
    "You are a social media expert for educational institutions. Create engaging posts and relevant hashtags."
  const userPrompt = `Create a ${postType} post for ${platform} with the following content: ${content}`
  return generateContent(userPrompt, systemPrompt)
}

export async function generateNewsletterOutline(
  newsletterType: string,
  topics: string,
  audience: string,
): Promise<GenerateResponse> {
  console.log("Generating newsletter outline for:", newsletterType)
  const systemPrompt =
    "You are a professional school newsletter creator. Create detailed and engaging newsletter outlines."
  const userPrompt = `Create a ${newsletterType} newsletter outline for ${audience} with the following topics: ${topics}`
  return generateContent(userPrompt, systemPrompt)
}

export async function generateNewsletter(
  newsletterType: string,
  content: string,
  audience: string,
): Promise<GenerateResponse> {
  console.log("Generating newsletter for:", newsletterType)
  const systemPrompt =
    "You are a professional newsletter writer for educational institutions. Create informative and engaging newsletters for various audiences."
  const userPrompt = `Create a ${newsletterType} newsletter for ${audience} with the following content: ${content}`
  return generateContent(userPrompt, systemPrompt)
}

export async function generateTrends(topic: string): Promise<GenerateResponse> {
  console.log("Generating trends for:", topic)
  const systemPrompt = "You are a trend analysis expert in education. Format your response exactly as specified."
  const userPrompt = `Analyze trends in education for: ${topic}
  Format your response EXACTLY like this, including the exact headers and dashes:
  Trending Topics:
  - [First trend]
  - [Second trend]
  - [Third trend]
  - [Fourth trend]
  - [Fifth trend]

  Relevant Hashtags:
  #[hashtag1] #[hashtag2] #[hashtag3] #[hashtag4] #[hashtag5]

  Explanation:
  [Your explanation here]`
  return generateContent(userPrompt, systemPrompt)
}

export async function generateKeywords(topic: string): Promise<GenerateResponse> {
  console.log("Generating keywords for:", topic)
  const systemPrompt =
    "You are a keyword research expert for educational institutions. Return only valid JSON in the specified format."
  const userPrompt = `Generate keywords for: ${topic}. 
  Return ONLY a JSON array with exactly this structure (no additional text):
  [
    {
      "keyword": "example keyword",
      "relevance": 0.95,
      "type": "short-tail",
      "difficulty": "easy"
    }
  ]
  Include 10 keywords, use only "short-tail" or "long-tail" for type, and only "easy", "medium", or "hard" for difficulty.`
  return generateContent(userPrompt, systemPrompt)
}

export async function generateMarketingPoster(options: {
  posterType: string
  content: {
    title: string
    subtitle: string
    description: string
    date: string
    venue: string
  }
  style: string
}): Promise<GenerateResponse> {
  console.log("Generating marketing poster with options:", JSON.stringify(options, null, 2))

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000) // 25 seconds timeout

    const result = await generatePoster(options, controller.signal)
    clearTimeout(timeoutId)

    console.log("Poster generated successfully:", JSON.stringify(result, null, 2))

    if (result.imageUrl) {
      return {
        success: true,
        content: result.imageUrl,
      }
    } else {
      throw new Error("No image URL found in the API response")
    }
  } catch (error) {
    console.error("Error in generateMarketingPoster:", error)
    let errorMessage = "Failed to generate poster"
    if (error instanceof Error) {
      errorMessage = error.name === "AbortError" ? "Poster generation timed out. Please try again." : error.message
    }
    return {
      success: false,
      content: "",
      error: errorMessage,
    }
  }
}

