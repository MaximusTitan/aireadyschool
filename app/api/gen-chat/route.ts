import { openai } from '@ai-sdk/openai';
import { streamText, smoothStream } from 'ai';
import { tools } from '@/app/tools/gen-chat/tools';

export async function POST(request: Request) {
  const { messages } = await request.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system: `You are a friendly and encouraging educational assistant. 
    When generating math problems, vary the difficulty and types of questions.
    When evaluating answers:
    - Give specific feedback about what went right or wrong
    - Provide tips for improvement
    - Use encouraging language
    - For correct answers, challenge them with a slightly harder question
    - For incorrect answers, offer a similar problem to try again`,
    messages,
    maxSteps: 5,
    tools,
    experimental_transform: smoothStream({
      delayInMs: 5,
      chunking: 'word',
    }),
  });

  return result.toDataStreamResponse();
}