import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { logTokenUsage } from '@/utils/logTokenUsage';

// Initialize Supabase admin client using new env variable names
const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  try {
    // Get authenticated user
    const supabaseAuth = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      prompt,
      email,
      country,
      board,
      subject,
      gradeLevel,
      assignmentType,
      textInput,
      learningObjective,
      collaboration,
      dueDate,
    } = await req.json();

    if (!prompt || !email) {
      return NextResponse.json(
        { error: "Required fields are missing" },
        { status: 400 }
      );
    }

    const systemPrompt = `
      You are an assignment generator for ${country}'s ${board} education board.
      Please create a ${subject} assignment with the following structure:
      - A concise title for the assignment, followed by "---" on a new line
      - The assignment content, including clear instructions, questions, or tasks
      - Make sure the content is appropriate for grade ${gradeLevel}
      Ensure the content is factual and avoid hallucination.
    `;

    const { text, usage } = await generateText({
      model: openai('gpt-4o'),
      prompt: `${systemPrompt}\n\n${prompt}`,
      temperature: 0.7,
      maxTokens: 2000,
    });

    // Log token usage
    if (usage) {
      await logTokenUsage(
        'Assignment Generator',
        'GPT-4o',
        usage.promptTokens,
        usage.completionTokens,
        user.email
      );
    }

    const [title, content] = text.split("---").map((s) => s.trim());
    if (!title || !content) {
      throw new Error("Generated content is not in the expected format");
    }

    // Save to database
    await supabase.from("assignment_history").insert([
      {
        email,
        grade_level: gradeLevel,
        assignment_type: assignmentType,
        topic: textInput,
        learning_objective: learningObjective,
        collaboration,
        due_date: dueDate,
        title,
        content,
        created_at: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({ title, content });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate assignment",
        details: error instanceof Error ? error.message : "An unknown error occurred",
        stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}