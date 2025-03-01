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

// Helper function to extract JSON from AI response
function extractJsonFromResponse(text: string): any {
  try {
    // Try direct parsing first
    return JSON.parse(text);
  } catch (error) {
    // If that fails, try to extract JSON from markdown code blocks or other text
    const jsonRegex = /\{[\s\S]*\}/;
    const match = text.match(jsonRegex);
    
    if (match && match[0]) {
      try {
        return JSON.parse(match[0]);
      } catch (nestedError) {
        console.error("Error parsing extracted JSON content:", nestedError);
        console.error("Extracted content:", match[0]);
        throw new Error("Failed to parse extracted JSON content");
      }
    } else {
      console.error("No JSON object found in the response");
      console.error("Full response:", text);
      throw new Error("No valid JSON found in the AI response");
    }
  }
}

async function generateWithModel(prompt: string, model: "gpt4o" | "groq") {
  try {
    if (model === "gpt4o") {
      return await generateText({
        model: openai("gpt-4o"),
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
    if (model === "gpt4o") {
      console.warn("GPT-4o failed, falling back to Groq")
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

export async function generateUsingAI(prompt: string, model: "gpt4o" | "groq" = "gpt4o"): Promise<AIGenerationResult> {
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
      throw new Error("No response received from AI");
    }
    
    const parsedResult = extractJsonFromResponse(result.text);
    
    return {
      topic: parsedResult.topic || prompt,
      learningObjective: parsedResult.learningObjective || "",
      keyConceptsArray: parsedResult.keyConcepts || [],
      slideCount: parsedResult.slideCount || 5,
      theme: parsedResult.theme || "modern",
      transition: parsedResult.transition || "slide",
    }
  } catch (error) {
    console.error("Error in generateUsingAI:", error);
    throw new Error("Failed to generate content using AI");
  }
}

export async function extractFromText(text: string, model: "gpt4o" | "groq" = "gpt4o"): Promise<AIGenerationResult> {
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
      throw new Error("No response received from AI");
    }
    
    const parsedResult = extractJsonFromResponse(result.text);
    
    return {
      topic: parsedResult.topic || "Extracted Content",
      learningObjective: parsedResult.learningObjective || "",
      keyConceptsArray: parsedResult.keyConcepts || [],
      slideCount: parsedResult.slideCount || 5,
      theme: parsedResult.theme || "modern",
      transition: parsedResult.transition || "slide",
    }
  } catch (error) {
    console.error("Error in extractFromText:", error);
    throw new Error("Failed to extract information from the text");
  }
}

