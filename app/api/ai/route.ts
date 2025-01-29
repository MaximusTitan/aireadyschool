import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function POST(req: Request) {
  const { topic } = await req.json();

  const prompt = `${topic}`;

  const { text } = await generateText({
    model: openai('gpt-4o'),
    prompt: prompt,
    temperature: 0.7,
    maxTokens: 500,
  });

  return Response.json({ answer: text });
}
