import { anthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"

export async function POST(req: Request) {
  const { subject, concept } = await req.json()

  const systemPrompt = `You are a kid-friendly educational simulator generator. 
  Create an interactive simulation using HTML, inline CSS, and minimal JavaScript to help children understand concepts.
  Focus on creating an engaging, colorful, and interactive layout using divs, buttons, and simple animations.
  The output should be a single string of HTML that can be directly inserted into a React component.
  Include comments explaining each part of the simulation for easy understanding.
  Use simple language and metaphors appropriate for children.
  Incorporate elements like:
  - Clickable buttons that change the simulation state
  - Animated elements to show changes or processes
  - Simple drag-and-drop functionality if appropriate
  - Clear, large text for instructions and explanations
  Do not use any external libraries or resources. Everything must be self-contained in the HTML string. Do not provide any explanation outside the HTML.`

  const userPrompt = `Create a kid-friendly, interactive simulation to explain the concept of "${concept}" in the subject of "${subject}". The simulation should be engaging, colorful, and help children understand the concept through interaction.`

  const { text } = await generateText({
    model: anthropic('claude-3-5-sonnet-20240620'),
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.5,
    maxTokens: 2000,
  })

  return Response.json({ visualization: text })
}

