import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  try {
    const { assessment, userAnswers, message } = await req.json();

    let prompt = "";
    if (message) {
      prompt = `Please provide your answer in markdown format. 
Ensure that you include a top-level header, bullet points, and any necessary code blocks.

The student asked a follow-up question: "${message}".

Context:
${assessment.map((q: any, i: number) => {
  const userAnswer = userAnswers[i];
  const correctness = 
    (q.correctAnswer !== undefined && typeof q.correctAnswer === "number")
      ? (userAnswer === q.correctAnswer ? "Correct" : "Incorrect")
      : (typeof q.correctAnswer === "boolean")
        ? (userAnswer === q.correctAnswer ? "Correct" : "Incorrect")
        : (typeof q.answer === "string")
          ? (userAnswer?.toLowerCase() === q.answer.toLowerCase() ? "Correct" : "Incorrect")
          : "Unknown";
  return `Q${i + 1}: ${q.question} | Your Answer: ${userAnswer} | ${correctness}`;
}).join("\n")}

Please respond exclusively using markdown syntax.
`;
    } else {
      prompt = `Please provide your response entirely in markdown format. 
Your answer must start with a top-level header, include bullet lists, and use code blocks where appropriate.

Analyze the following assessment summary. For each question, indicate whether the student's answer is correct or incorrect. For incorrect answers, explain the mistake, list key concepts to review, and provide actionable improvement suggestions using bullet points.

Assessment Questions and Answers:
${assessment.map((q: any, i: number) => {
  const userAnswer = userAnswers[i];
  const correctness = 
    (q.correctAnswer !== undefined && typeof q.correctAnswer === "number")
      ? (userAnswer === q.correctAnswer ? "Correct" : "Incorrect")
      : (typeof q.correctAnswer === "boolean")
        ? (userAnswer === q.correctAnswer ? "Correct" : "Incorrect")
        : (typeof q.answer === "string")
          ? (userAnswer?.toLowerCase() === q.answer.toLowerCase() ? "Correct" : "Incorrect")
          : "Unknown";
  return `Q${i + 1}: ${q.question} | Your Answer: ${userAnswer} | ${correctness}`;
}).join("\n")}

Please structure your response with a summary section and detailed bullet points for topics that need further practice.
`;
    }
    
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.7,
      maxTokens: 1000,
    });

    return NextResponse.json({ explanation: text.trim() });
  } catch (error) {
    console.error("Error generating assessment summary:", error);
    return NextResponse.json(
      { error: "Failed to generate summary explanation" },
      { status: 500 }
    );
  }
}
