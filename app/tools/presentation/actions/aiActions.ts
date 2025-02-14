"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

interface AIGenerationResult {
  topic: string
  learningObjective: string
  keyConceptsArray: string[]
  slideCount: number
  theme: string
  transition: string
}
//mayur
export async function generateUsingAI(prompt: string): Promise<AIGenerationResult> {
  try {
    const result = await generateText({
      model: openai("gpt-4"),
      prompt: `Given the topic "${prompt}", generate a structured learning objective, extract 3-5 key concepts, determine an optimal number of slides (between 5-8), and suggest a theme and transition effect. Format the response as JSON with the following structure:
      {
        "topic": "refined topic",
        "learningObjective": "structured learning objective",
        "keyConcepts": ["concept1", "concept2", "concept3"],
        "slideCount": number,
        "theme": "suggested theme (modern, corporate, creative, minimal, or dark)",
        "transition": "suggested transition (none, fade, slide, convex, concave, or zoom)"
      }`,
    })

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

export async function extractFromText(text: string): Promise<AIGenerationResult> {
  try {
    const result = await generateText({
      model: openai("gpt-4"),
      prompt: `Given the following text, extract the main topic, generate a structured learning objective, identify 3-5 key concepts, determine an optimal number of slides (between 5-8), and suggest a theme and transition effect. Format the response as JSON with the following structure:
      {
        "topic": "main topic",
        "learningObjective": "structured learning objective",
        "keyConcepts": ["concept1", "concept2", "concept3"],
        "slideCount": number,
        "theme": "suggested theme (modern, corporate, creative, minimal, or dark)",
        "transition": "suggested transition (none, fade, slide, convex, concave, or zoom)"
      }

      Text: "${text}"`,
    })

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

