import { NextResponse } from "next/server"
import createParser from "pdf2json"
import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { logTokenUsage } from '@/utils/logTokenUsage'
import { createClient } from "@/utils/supabase/server"

const output_format = `Provide section headings as given in the question paper along with the marking scheme in parentheses (e.g., "Section A (Multiple Choice Questions - 20 x 1 = 20 marks)"). For each section, start with a line "Going through each question:" then list each question's evaluation on a separate line using this format:

If the answer is correct:
"Answer: [student answer] ✓"
If the answer is incorrect:
"Answer: [student answer] X Correct Answer: [correct answer] ; Marks awarded: [awarded marks]/[total marks]"

After all questions in the section, include a summary line:
"Section [Letter] score: [obtained marks]/[total marks]"

Once all sections are scored, provide a final summary titled "Final Score Calculation:" with bullet points for each section's score and a total score line. For example:

Final Score Calculation:
- Section A: 20/20
- Section B: 10/10
- Section C: 18/18
- Section D: 20/20
- Section E: 12/12
Total score: 80/80

Ensure the output follows this format exactly, including proper symbols and spacing.`;


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
    const SYSTEM_PROMPT = `You are an expert educational evaluator with years of experience assessing student assignments across various subjects and grade levels. Your task is to evaluate the provided student answer sheet against the question paper. For each section, perform the following:

1. **Display the Section Heading:**  
   Use the section title and marking scheme exactly as provided (for example: "Section A (Multiple Choice Questions - 20 x 1 = 20 marks)").

2. **Detailed Question-by-Question Breakdown:**  
   - Start with a line reading "Going through each question:" for each section.
   - For every question in the section, show the student's answer from ${answerSheetText} in the following format:  
     - If correct:  
       'Answer: [student answer] ✓'  
     - If incorrect:  
       'Answer: [student answer] X Correct Answer: [correct answer] ; Marks awarded: [awarded marks]/[total marks]'  
   - Ensure you include any step markings for answers that are partially correct.

3. **Section Score Summary:**  
   After listing all questions in a section, provide a summary line with the section’s score (e.g., "Section A score: 20/20").

4. **Final Score Calculation:**  
   At the end, include a "Final Score Calculation" section with bullet points for each section showing the marks obtained by total marks (for example:  
   - Section A: 20/20  
   - Section B: 10/10  
   …  
   Total score: 80/80)

Your output should strictly follow the above structure. Do not include any extra titles or commentary outside of this format.`;
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

      systemPrompt = `You are an expert educational evaluator with the following rubric:\n${rubricContent}\n\nYour task is to analyze the given student assignment and provide a comprehensive evaluation based on the provided rubric. Provide output in Markdown format and refer ${output_format}. Do not reply any title.`
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
      model: anthropic('claude-3-7-sonnet-20250219'),
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

