import { openai } from '@ai-sdk/openai';
import { streamText, smoothStream } from 'ai';
import { tools } from '@/app/tools/image-generator/tools';

export async function POST(request: Request) {  
  const { messages } = await request.json();

  try {
    const result = streamText({
      model: openai('gpt-4o'),
      system: `You are an AI image generation assistant. Help users create images by:
      1. Understanding their requirements
      2. Suggesting improvements to their prompts
      3. Using the generateImage tool to create images
      4. Providing feedback and suggestions for better results

      Always use the generateImage tool with these parameters:
      - style: "realistic_image", "digital_illustration", or "vector_illustration"
      - imageSize: "square_hd", "landscape_4_3", or "portrait_hd"
      - numInferenceSteps: 1
      - numImages: 1
      - enableSafetyChecker: true

      If the user's request is unclear, ask for clarification about the subject matter and preferred style.`,
      messages,
      maxSteps: 5,
      tools,
      experimental_transform: smoothStream({
        delayInMs: 5,
        chunking: 'word',
      }),
    });

    return result.toDataStreamResponse();
  } catch (error) {
    throw error;
  }
}