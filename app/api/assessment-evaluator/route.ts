import { NextResponse } from "next/server"
import createParser from "pdf2json"
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { logTokenUsage } from '@/utils/logTokenUsage'
import { createClient } from "@/utils/supabase/server"

const SYSTEM_PROMPT = `You are an expert educational evaluator with years of experience in assessing student assignments across various subjects and grade levels. Your task is to analyze the given student assignment and provide a comprehensive evaluation based on the following criteria:

1. Content Understanding (0-25 points):
   - Assess the student's grasp of the subject matter.
   - Evaluate the depth and accuracy of information presented.

2. Critical Thinking (0-25 points):
   - Analyze the student's ability to synthesize information and form logical arguments.
   - Assess the presence of original insights or creative problem-solving approaches.

3. Structure and Organization (0-20 points):
   - Evaluate the logical flow and coherence of the assignment.
   - Assess the use of appropriate transitions and the overall structure.

4. Language and Communication (0-20 points):
   - Assess the clarity and effectiveness of the student's writing.
   - Evaluate grammar, vocabulary, and style appropriate for the grade level.

5. Research and Citation (0-10 points):
   - Evaluate the quality and relevance of sources used (if applicable).
   - Assess proper citation and referencing practices.

For each criterion, provide a score and a brief explanation justifying the score. After evaluating all criteria, sum up the scores to give a total out of 100 points.

Additionally, provide:
1. A brief summary of the assignment's strengths (2-3 sentences).
2. Areas for improvement (2-3 specific suggestions).
3. An overall comment on the student's performance (3-4 sentences).

Your evaluation should be constructive, encouraging, and aimed at helping the student improve their academic skills. Tailor your language and expectations to the appropriate grade level of the student.

Format your response as follows:
{
  "contentUnderstanding": { "score": X, "comment": "..." },
  "criticalThinking": { "score": X, "comment": "..." },
  "structureAndOrganization": { "score": X, "comment": "..." },
  "languageAndCommunication": { "score": X, "comment": "..." },
  "researchAndCitation": { "score": X, "comment": "..." },
  "totalScore": X,
  "strengths": "...",
  "areasForImprovement": "...",
  "overallComment": "..."
}`

export async function POST(request: Request) {
  try {
    // Get current user from Supabase
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData()
    const questionPaperText = formData.get("questionPaperText") as string
    const answerSheetText = formData.get("answerSheetText") as string
    const rubric = formData.get("rubric") as File | null
    const rubricTextInput = formData.get("rubricText") as string

    if (!questionPaperText && !answerSheetText) {
      return NextResponse.json(
        { error: "Please fill in all required fields and provide an assignment (file or text)." },
        { status: 400 }
      )
    }

    // Handle rubric
    let systemPrompt = SYSTEM_PROMPT
    if (rubric || rubricTextInput) {
      let rubricContent = ""
      if (rubric) {
        if (
          rubric.type !== "application/pdf" &&
          rubric.type !== "text/plain"
        ) {
          return NextResponse.json(
            { error: "Invalid rubric file type. Please upload a PDF or TXT file." },
            { status: 400 }
          )
        }

        if (rubric.type === "application/pdf") {
          const rubricBuffer = Buffer.from(await rubric.arrayBuffer())
          const rubricParser = new createParser()
          rubricContent = await new Promise<string>((resolve, reject) => {
            rubricParser.on("pdfParser_dataReady", (pdfData) => {
              resolve(
                pdfData.Pages.map((page) =>
                  page.Texts.map((text) =>
                    text.R.map((r) => decodeURIComponent(r.T)).join(" ")
                  ).join(" ")
                ).join("\n")
              )
            })
            rubricParser.on("pdfParser_dataError", reject)
            rubricParser.parseBuffer(rubricBuffer)
          })
        } else if (rubric.type === "text/plain") {
          rubricContent = await rubric.text()
        }
      } else if (rubricTextInput) {
        rubricContent = rubricTextInput
      }

      systemPrompt = `You are an expert educational evaluator with the following rubric:\n${rubricContent}\n\nYour task is to analyze the given student assignment and provide a comprehensive evaluation based on the provided rubric. Provide output in Markdown format. Do not reply any title.`
    }

    // Prepare the prompt for the AI
    const userPrompt = `Please evaluate the answers in the answer sheet based on the Question Paper provided.
    Questoin Paper:
    ${questionPaperText}
    
    Student's Answer Sheet:
    ${answerSheetText}
    `

    // Call OpenAI API for evaluation using AI SDK
    const { text: aiResponse, usage } = await generateText({
      model: openai('gpt-4o'),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      maxTokens: 1500,
      temperature: 0.7,
      providerOptions: {
        openai: {
          structuredOutputs: true,
        }
      }
    })

    // Log token usage
    if (usage) {
      await logTokenUsage(
        'Evaluator',
        'GPT-4o',
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
      if (!evaluation.contentUnderstanding || !evaluation.totalScore) {
        // If parsed but missing required fields, use the raw response
        evaluation = aiResponse
      }
    } catch (parseError) {
      // If JSON parsing fails, use the raw response
      evaluation = aiResponse
    }

    return NextResponse.json({ evaluation })
  } catch (error: any) {
    console.error("Error processing assignment or evaluating:", error)

    // Handle specific API errors
    if (error.code === 'context_length_exceeded') {
      return NextResponse.json(
        { error: "Assignment is too long. Please try with a shorter text." },
        { status: 413 }
      )
    }

    if (error.code === 'rate_limit_exceeded') {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again in a few moments." },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: "Failed to process assignment or evaluate." },
      { status: 500 }
    )
  }
}

