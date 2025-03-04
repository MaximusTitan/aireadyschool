import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { logTokenUsage } from '@/utils/logTokenUsage';
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    // Get current user from Supabase
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { questions } = await req.json();
    if (!questions || !Array.isArray(questions)) {
      throw new Error("Invalid payload");
    }
    
    // Build a prompt that asks OpenAI to evaluate each answer.
    // Format each question entry for clarity.
    const prompt = `
Evaluate the following short answer assessment. For each question, assign a score out of 5 based on the correctness and completeness of the student's answer. Provide the scores as a JSON array of numbers corresponding to each question.

Questions:
${questions.map((q: any, index: number) => 
  `${index + 1}. Question: "${q.question}"
   Correct Answer: "${q.correctAnswer}"
   Student Answer: "${q.userAnswer}"
  `).join("\n")}
`;
    const { text, usage } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0,
      maxTokens: 500,
    });

    // Log token usage
    if (usage) {
      await logTokenUsage(
        'Assessment Evaluator - Short Answer', 
        'GPT-4o', 
        usage.promptTokens, 
        usage.completionTokens, 
        user?.email
      );
    }

    // Expecting a JSON array in the response.
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No valid JSON array found in the response.");
    }
    const scores = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(scores)) {
      throw new Error("Evaluation did not return an array of scores.");
    }
    return NextResponse.json({ scores });
  } catch (error) {
    console.error("Error evaluating short answers:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
