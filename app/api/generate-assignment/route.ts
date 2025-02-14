import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js"; // Import Supabase client

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Initialize Supabase admin client using new env variable names
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  if (!openai.apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not found" },
      { status: 500 }
    );
  }

  try {
    const {
      prompt,
      email,
      gradeLevel,
      assignmentType,
      textInput,
      learningObjective,
      collaboration,
      dueDate,
    } = await req.json();
    // Validate prompt existence
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is missing or empty" },
        { status: 400 }
      );
    }
    // email should be provided to tie the assignment with the user

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
            You are an assignment generator. Please create an assignment with the following structure:
            - A concise title for the assignment, followed by "---" on a new line
            - The assignment content, including instructions, questions, or tasks
            Ensure the content is factual and avoid hallucination. Always separate the title and content with three hyphens (---) on a new line.
          `,
        },
        {
          role: "user",
          content: `Generate an assignment on the following topic: ${prompt}`,
        },
      ],
    });

    const generatedContent = response.choices[0].message.content;
    if (!generatedContent) {
      throw new Error("Failed to generate content");
    }

    const [title, content] = generatedContent.split("---").map((s) => s.trim());
    if (!title || !content) {
      throw new Error("Generated content is not in the expected format");
    }

    // Save the assignment along with all form inputs into Supabase
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
      },
    ]);

    return NextResponse.json({
      title: title,
      content: content,
    });
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 500 }
      );
    } else {
      return NextResponse.json(
        { error: "An unexpected error occurred" },
        { status: 500 }
      );
    }
  }
}