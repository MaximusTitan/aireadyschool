import { NextResponse } from "next/server"
import { createMistral } from '@ai-sdk/mistral'
import { generateText } from 'ai'
import { logTokenUsage } from '@/utils/logTokenUsage'
import { createClient } from "@/utils/supabase/server"

const SYSTEM_PROMPT = `You are an OCR (Optical Character Recognition) specialist that extracts text from images and documents.
Your task is to analyze the provided file and extract all the text content from it.
Return only the extracted text content without any additional commentary, explanations, or formatting.
Preserve the original formatting structure as much as possible, including paragraphs, bullet points, and section breaks.`

// Create a custom Mistral provider instance
const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY,
})

export async function POST(request: Request) {
  try {
    // Get current user from Supabase
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "Please provide a URL to extract text from." },
        { status: 400 }
      )
    }

    // Validate URL format
    let docUrl;
    try {
      docUrl = new URL(url);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid URL format." },
        { status: 400 }
      )
    }

    const userPrompt = `Extract all text from this document at the URL.`

    // Use direct API call with URL
    try {
      const result = await generateText({
        model: mistral('mistral-small-latest'),
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: userPrompt },
              { 
                type: 'file',
                data: docUrl,
                mimeType: 'application/pdf', // Assuming PDF for URLs, Mistral will detect the actual type
              }
            ],
          },
        ],
        maxTokens: 4000,
        temperature: 0.2,
        providerOptions: {
          mistral: {
            documentImageLimit: 8,
            documentPageLimit: 64,
          },
        },
      });

      // Log token usage
      if (result.usage) {
        await logTokenUsage(
          'OCR Tool',
          'Mistral-Small',
          result.usage.promptTokens, 
          result.usage.completionTokens, 
          user?.email
        );
      }

      return NextResponse.json({ extractedText: result.text })
    } catch (apiError: any) {
      console.error("API Error details:", apiError);
      throw apiError;
    }

  } catch (error: any) {
    console.error("Error processing OCR:", error)

    // Handle specific API errors
    if (error.code === 'context_length_exceeded') {
      return NextResponse.json(
        { error: "The document is too large to process. Please try with a smaller file." },
        { status: 400 }
      )
    }

    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return NextResponse.json(
        { error: "Could not access the URL. Please make sure it's publicly accessible." },
        { status: 400 }
      )
    }

    return NextResponse.json({
      error: error.message || "An unexpected error occurred",
      details: JSON.stringify(error, Object.getOwnPropertyNames(error))
    }, { status: 500 })
  }
}