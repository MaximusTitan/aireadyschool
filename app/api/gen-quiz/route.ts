import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { subject, difficulty } = await req.json();

  if (!subject?.trim() || !difficulty?.trim()) {
    return Response.json({ error: "Subject and difficulty are required." }, { status: 400 });
  }

  // Removed the .length(4) constraint from the array
  const quizSchema = z.object({
    question: z.string(),
    options: z.array(
      z.object({
        id: z.string(),
        text: z.string(),
        isCorrect: z.boolean(),
      })
    ),
    explanation: z.string(),
    subject: z.string(),
    difficulty: z.string(),
    topic: z.string().nullable(),
  });

  try {
    const result = await generateObject({
      model: openai('gpt-4o-2024-08-06', {
        structuredOutputs: true,
      }),
      schemaName: 'quiz',
      schemaDescription: `Generate a ${difficulty} level quiz question about ${subject}`,
      schema: quizSchema,
      prompt: `Create a ${difficulty} level multiple-choice quiz question about ${subject}.

Important requirements:
- You must provide EXACTLY 4 options, no more and no less
- Only ONE option should be marked as correct (isCorrect: true)
- Each option must have a unique id (can be "a", "b", "c", "d" or similar)
- Make sure it's educational and age-appropriate
- Include a brief explanation for why the correct answer is right

The response must follow the exact schema structure provided.`,
      temperature: 0.7,
      maxTokens: 500,
    });

    // Validate the number of options after generation
    if (result.object.options.length !== 4) {
      throw new Error("Generated quiz does not have exactly 4 options");
    }

    // Validate that exactly one option is correct
    const correctOptions = result.object.options.filter(opt => opt.isCorrect);
    if (correctOptions.length !== 1) {
      throw new Error("Generated quiz does not have exactly one correct answer");
    }

    return Response.json(result.object);

  } catch (err) {
    console.error('Quiz generation error:', err);
    return Response.json({ 
      error: "Failed to generate quiz",
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}