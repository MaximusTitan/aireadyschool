import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  try {
    const { assessment, userAnswers, message } = await req.json();

    let prompt = "";
    if (message) {
      prompt = `Please provide your answer in markdown format focusing only on addressing questions that were answered incorrectly.
      
The student asked a follow-up question: "${message}".

Context of incorrect answers only:
${assessment.map((q: any, i: number) => {
  const userAnswer = userAnswers[i];
  const isCorrect = 
    (q.correctAnswer !== undefined && typeof q.correctAnswer === "number")
      ? userAnswer === q.correctAnswer
      : (typeof q.correctAnswer === "boolean")
        ? userAnswer === q.correctAnswer
        : (typeof q.answer === "string")
          ? userAnswer?.toLowerCase() === q.answer.toLowerCase()
          : false;
          
  if (!isCorrect) {
    return `Q${i + 1}: ${q.question} | Your Answer: ${userAnswer}`;
  }
  return null;
}).filter(Boolean).join("\n")}

Please respond exclusively using markdown syntax.`;
    } else {
      prompt = `Please analyze only the incorrect answers in this assessment using markdown format:

# Assessment Review

## Incorrect Answers Analysis
${assessment.map((q: any, i: number) => {
  const userAnswer = userAnswers[i];
  let isCorrect = false;
  let answerDetails = '';
  
  if (q.options) { // For MCQ
    isCorrect = userAnswer === q.correctAnswer;
    answerDetails = isCorrect ? '' : `
Options:
${q.options.map((opt: string, idx: number) => `${idx + 1}. ${opt}`).join('\n')}
Student chose: ${userAnswer !== null ? q.options[userAnswer] : 'No answer'}
Correct answer: ${q.options[q.correctAnswer]}`;
  } else if (q.correctAnswer !== undefined && typeof q.correctAnswer === 'boolean') {
    isCorrect = userAnswer === q.correctAnswer;
    answerDetails = isCorrect ? '' : `
Student answered: ${userAnswer !== null ? userAnswer.toString() : 'No answer'}
Correct answer: ${q.correctAnswer.toString()}`;
  } else if (q.answer) {
    isCorrect = userAnswer?.toLowerCase() === q.answer.toLowerCase();
    answerDetails = isCorrect ? '' : `
Student answered: ${userAnswer || 'No answer'}
Correct answer: ${q.answer}`;
  }

  return !isCorrect ? `
### Question ${i + 1}: ${q.question}
${answerDetails}` : '';
}).filter(Boolean).join('\n\n')}

For each incorrect answer:
1. Explain why the student's answer was incorrect
2. Provide the correct solution with explanation
3. Suggest a relevant learning resource or example

## Summary of Areas for Improvement
1. List key concepts that need review (based only on incorrect answers)
2. Provide specific improvement suggestions for the topics where mistakes were made

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
