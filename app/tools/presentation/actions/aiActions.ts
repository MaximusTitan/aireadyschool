"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { groq } from "@ai-sdk/groq"  // Add this import

interface AIGenerationResult {
  topic: string
  learningObjective: string
  keyConceptsArray: string[]
  slideCount: number
  theme: string
  transition: string
}

async function generateWithModel(prompt: string, model: "gpt4" | "groq") {
  try {
    if (model === "gpt4") {
      return await generateText({
        model: openai("gpt-4"),
        prompt: prompt
      })
    } else {
      return await generateText({
        model: groq("mixtral-8x7b-32768"), // Changed to use Groq's free model
        prompt: prompt,
        temperature: 0.7,
        maxTokens: 4000
      })
    }
  } catch (error) {
    if (model === "gpt4") {
      console.warn("GPT-4 failed, falling back to Groq")
      return await generateText({
        model: groq("mixtral-8x7b-32768"), // Changed here too
        prompt: prompt,
        temperature: 0.7,
        maxTokens: 4000
      })
    }
    throw error
  }
}

export async function generateUsingAI(prompt: string, model: "gpt4" | "groq" = "gpt4"): Promise<AIGenerationResult> {
  try {
    const result = await generateWithModel(
      `Given the topic "${prompt}", generate a structured learning objective, extract 3-5 key concepts, determine an optimal number of slides (between 5-8), and suggest a theme and transition effect. Format the response as JSON with the following structure:
      {
        "topic": "refined topic",
        "learningObjective": "structured learning objective",
        "keyConcepts": ["concept1", "concept2", "concept3"],
        "slideCount": number,
        "theme": "suggested theme (modern, corporate, creative, minimal, or dark)",
        "transition": "suggested transition (none, fade, slide, convex, concave, or zoom)"
      }`,
      model
    )

    if (!result.text) {
      throw new Error("No response received from AI")
    }

    const parsedResult = JSON.parse(result.text)
    return {
      topic: parsedResult.topic,
      learningObjective: parsedResult.learningObjective,
      keyConceptsArray: parsedResult.keyConcepts,
      slideCount: parsedResult.slideCount,
      theme: parsedResult.theme,
      transition: parsedResult.transition,
    }
  } catch (error) {
    console.error("Error in generateUsingAI:", error)
    throw new Error("Failed to generate content using AI")
  }
}

export async function extractFromText(text: string, model: "gpt4" | "groq" = "gpt4"): Promise<AIGenerationResult> {
  try {
    const result = await generateWithModel(
      `Given the following text, extract the main topic, generate a structured learning objective, identify 3-5 key concepts, determine an optimal number of slides (between 5-8), and suggest a theme and transition effect. Format the response as JSON with the following structure:
      {
        "topic": "main topic",
        "learningObjective": "structured learning objective",
        "keyConcepts": ["concept1", "concept2", "concept3"],
        "slideCount": number,
        "theme": "suggested theme (modern, corporate, creative, minimal, or dark)",
        "transition": "suggested transition (none, fade, slide, convex, concave, or zoom)"
      }

      Text: "${text}"`,
      model
    )

    if (!result.text) {
      throw new Error("No response received from AI")
    }

    const parsedResult = JSON.parse(result.text)
    return {
      topic: parsedResult.topic,
      learningObjective: parsedResult.learningObjective,
      keyConceptsArray: parsedResult.keyConcepts,
      slideCount: parsedResult.slideCount,
      theme: parsedResult.theme,
      transition: parsedResult.transition,
    }
  } catch (error) {
    console.error("Error in extractFromText:", error)
    throw new Error("Failed to extract information from the text")
  }
}

