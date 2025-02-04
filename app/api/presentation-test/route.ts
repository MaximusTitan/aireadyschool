import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function POST(req: Request) {
  const { topic } = await req.json();

  const prompt = `Create a professional presentation about "${topic}". 
Return the response as a JSON array of slides. Each slide should have a "title" and "content" (array of bullet points). 
Format: [{"title": "Slide Title", "content": ["Point 1", "Point 2"]}].
Include exactly 6 slides:
1. Title slide with topic overview
2. Introduction
3-4. Main content slides
5. Key takeaways
6. Conclusion
Keep bullet points concise and professional.`;

  const { text } = await generateText({
    model: openai('gpt-4'),
    prompt: prompt,
    temperature: 0.7,
    maxTokens: 1000,
  });

  return Response.json({ answer: text });
}
