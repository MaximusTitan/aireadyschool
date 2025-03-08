import { NextResponse } from "next/server"
import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { logTokenUsage } from '@/utils/logTokenUsage'
import { createClient } from "@/utils/supabase/server"

const SYSTEM_PROMPT = `You are an expert educational evaluator with years of experience in assessing student exams across various subjects and grade levels. Your task is to analyze the given question paper and the student's answer sheet to provide a comprehensive evaluation.

The input consists of:
1. A question paper PDF 
2. A student's answer sheet PDF

For each question in the paper:
1. Extract and understand the question
2. Locate the corresponding answer in the student's sheet
3. Evaluate the correctness, completeness, and quality of the answer
4. Assign an appropriate score

Provide your output in the following JSON format:
{
  "totalScore": number,
  "feedback": "Overall evaluation feedback as a string",
  "questionBreakdown": [
    {
      "question": "The question text",
      "score": number,
      "maxScore": number,
      "feedback": "Specific feedback for this answer"
    }
  ]
}

Where:
- totalScore is the sum of all individual question scores
- feedback provides overall comments on the student's performance
- questionBreakdown contains detailed analysis for each question

Your evaluation should be:
- Fair and objective
- Appropriate for the subject and grade level
- Constructive with specific feedback
- Highlighting both strengths and areas for improvement`

export async function POST(request: Request) {
  try {
    // Get current user from Supabase
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData()
    const questionPaper = formData.get("questionPaper") as File | null
    const answerSheet = formData.get("answerSheet") as File | null
    const subject = formData.get("subject") as string
    const gradeLevel = formData.get("gradeLevel") as string

    if (!questionPaper || !answerSheet || !subject || !gradeLevel) {
      return NextResponse.json(
        { error: "Please provide both question paper and answer sheet, and fill in all required fields." },
        { status: 400 }
      )
    }

    // Validate file types
    if (questionPaper.type !== "application/pdf" || answerSheet.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Invalid file type. Please upload PDF files for both question paper and answer sheet." },
        { status: 400 }
      )
    }

    // Convert files to array buffers for Claude
    const questionPaperBuffer = await questionPaper.arrayBuffer()
    const answerSheetBuffer = await answerSheet.arrayBuffer()

    const userPrompt = `Please evaluate the student's exam answers.
Subject: ${subject}
Grade Level: ${gradeLevel}

The first document is the question paper, and the second document is the student's answer sheet.
Provide a detailed evaluation with scores for each question and overall feedback.`

    // Call Claude API for evaluation using AI SDK
    const { text: aiResponse, usage } = await generateText({
        model: anthropic('claude-3-7-sonnet-20250219'),
        messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { 
          role: "user", 
          content: [
            {
              type: "text",
              text: userPrompt
            },
            {
              type: "file",
              data: Buffer.from(questionPaperBuffer),
              mimeType: "application/pdf"
            },
            {
              type: "file",
              data: Buffer.from(answerSheetBuffer),
              mimeType: "application/pdf"
            }
          ] 
        }
      ],
      maxTokens: 4000,
      temperature: 0.7,
    })

    // Log token usage
    if (usage) {
      await logTokenUsage(
        'Exam Evaluator',
        'Claude-3-Haiku',
        usage.promptTokens, 
        usage.completionTokens, 
        user?.email
      );
    }

    let evaluation
    try {
      // Always try to parse as JSON first
      evaluation = JSON.parse(aiResponse || "{}")
      
      // Validate the parsed response has the expected structure
      if (!evaluation.totalScore || !evaluation.questionBreakdown) {
        // If parsed but missing required fields, use the raw response
        evaluation = aiResponse
      }
    } catch (parseError) {
      // If JSON parsing fails, use the raw response
      evaluation = aiResponse
    }

    return NextResponse.json({ evaluation })
  } catch (error: any) {
    console.error("Error processing exam or evaluating:", error)

    // Handle specific API errors
    if (error.code === 'context_length_exceeded') {
      return NextResponse.json(
        { error: "The exam documents are too large to process. Please try with shorter documents." },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
