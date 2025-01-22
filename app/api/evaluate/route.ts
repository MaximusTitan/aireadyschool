import { NextResponse } from "next/server"
import createParser from "pdf2json"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const gradeLevel = formData.get("gradeLevel") as string
    const subject = formData.get("subject") as string

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Invalid file type. Please upload a PDF." }, { status: 400 })
    }

    // Read file content
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    let text = ""

    const parser = new createParser()
    text = await new Promise((resolve, reject) => {
      parser.on("pdfParser_dataReady", (pdfData) => {
        resolve(
          pdfData.Pages.map((page) =>
            page.Texts.map((text) => text.R.map((r) => decodeURIComponent(r.T)).join(" ")).join(" "),
          ).join("\n"),
        )
      })
      parser.on("pdfParser_dataError", reject)
      parser.parseBuffer(fileBuffer)
    })

    // Prepare the prompt for the AI
    const userPrompt = `Grade Level: ${gradeLevel}\nSubject: ${subject}\n\nStudent Assignment:\n${text}\n\nPlease evaluate this assignment based on the criteria provided.`

    // Call OpenAI API for evaluation
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const aiResponse = completion.choices[0].message.content
    const evaluation = JSON.parse(aiResponse || "{}")

    return NextResponse.json({ evaluation })
  } catch (error) {
    console.error("Error processing PDF or evaluating assignment:", error)
    return NextResponse.json({ error: "Failed to process PDF or evaluate assignment." }, { status: 500 })
  }
}

