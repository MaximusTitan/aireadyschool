import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function POST(req: Request) {
  const { title, description, genre, ageGroup, tone, length } = await req.json();

  const wordCount = {
    short: 300,
    medium: 600,
    long: 1000
  }[length as 'short' | 'medium' | 'long'] || 600;

  const prompt = `Create a ${tone} story for ${ageGroup} readers in the ${genre} genre.
    Title: "${title}"
    Description: ${description}
    Target length: approximately ${wordCount} words

    Story Guidelines:
    - Keep the language and themes appropriate for ${ageGroup} readers
    - Maintain a ${tone} tone throughout the narrative
    - Include vivid descriptions that can be visualized
    - Create memorable characters and engaging dialogue
    - Ensure a clear beginning, middle, and end structure
    - Include themes that resonate with ${ageGroup} readers
    
    Please write the story:`;

  const { text } = await generateText({
    model: openai('gpt-4o'),
    prompt: prompt,
    temperature: 0.7,
    maxTokens: Math.max(wordCount * 2, 1000),
  });

  return Response.json({ story: text });
}
