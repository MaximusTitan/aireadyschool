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
      prompt = `Please analyze this assessment in markdown format following this structure:

# Assessment Analysis

## Question-by-Question Review
${assessment.map((q: any, i: number) => {
  const userAnswer = userAnswers[i];
  let answerDetails = '';
  
  if (q.options) { // For MCQ
    answerDetails = `
Options:
${q.options.map((opt: string, idx: number) => `${idx + 1}. ${opt}`).join('\n')}
Student chose: ${userAnswer !== null ? q.options[userAnswer] : 'No answer'}
Correct answer: ${q.options[q.correctAnswer]}`;
  } else if (q.correctAnswer !== undefined && typeof q.correctAnswer === 'boolean') { // For True/False
    answerDetails = `
Student answered: ${userAnswer !== null ? userAnswer.toString() : 'No answer'}
Correct answer: ${q.correctAnswer.toString()}`;
  } else if (q.answer) { // For Fill in the blank
    answerDetails = `
Student answered: ${userAnswer || 'No answer'}
Correct answer: ${q.answer}`;
  }

  return `
Question ${i + 1}: ${q.question}
${answerDetails}`;
}).join('\n\n')}

For each question:
1. Start with "### Question X:"
2. Show the correct answer
3. Provide a brief solution/explanation (4-5 sentences)
4. If the student's answer was wrong, explain specifically why their chosen answer was incorrect

## Overall Review
After individual questions:
1. List key concepts that need review (bullet points)
2. Provide improvement suggestions

Use markdown formatting for clear organization.`;
    }
    
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.8,
      maxTokens: 3000, // Increased token limit for more detailed responses
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
