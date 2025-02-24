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
      country,           // Used in prompt but not saved
      board,            // Used in prompt but not saved
      subject,          // Used in prompt but not saved
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

    const response = await openai.chat.completions.create({
      model: "gpt-4",  // Fixed typo in model name
      messages: [
        {
          role: "system",
          content: `
            You are an assignment generator for ${country}'s ${board} education board.
            Please create a ${subject} assignment with the following structure:
            - A concise title for the assignment, followed by "---" on a new line
            - The assignment content, including clear instructions, questions, or tasks
            - Make sure the content is appropriate for grade ${gradeLevel}
            Ensure the content is factual and avoid hallucination.
          `,
        },
        {
          role: "user",
          content: prompt,
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

    // Save only the fields that exist in the database schema
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

    return NextResponse.json({
      title,
      content,
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