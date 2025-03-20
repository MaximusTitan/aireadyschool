import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const G_API_KEY = process.env.G_API_KEY
const LANGSEARCH_API_KEY = process.env.LANGSEARCH_API_KEY

if (!G_API_KEY) {
  throw new Error("Missing Gemini API Key")
}

if (!LANGSEARCH_API_KEY) {
  throw new Error("Missing LangSearch API Key")
}

const genAI = new GoogleGenerativeAI(G_API_KEY)

export const maxDuration = 300 // Set max duration to 5 minutes (300 seconds)

interface SearchResult {
  title: string
  url: string
  snippet: string
  summary: string
}

interface SearchResponse {
  results?: SearchResult[]
  error?: string
}

async function performWebSearch(query: string): Promise<SearchResponse> {
  console.log("Performing web search for query:", query)

  try {
    const response = await fetch("https://api.langsearch.com/v1/web-search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LANGSEARCH_API_KEY}`,
      },
      body: JSON.stringify({
        query: query,
        freshness: "onLimit",
        summary: true,
        count: 5,
      }),
    })

    if (!response.ok) {
      throw new Error(`Web search failed: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.data?.webPages?.value || !Array.isArray(data.data.webPages.value)) {
      throw new Error("Invalid response format from search API")
    }

    const results = data.data.webPages.value.map((result: any) => ({
      title: result.name,
      url: result.url,
      snippet: result.snippet,
      summary: result.summary || result.snippet,
    }))

    console.log(`Web search completed successfully with ${results.length} results`)
    return { results }
  } catch (error) {
    console.error("Web search error:", error)
    return {
      error: error instanceof Error ? error.message : "Failed to perform web search",
      results: [],
    }
  }
}

function isSimpleQuestion(question: string): boolean {
  // List of keywords that might indicate a simple question
  const simpleKeywords = ["what", "who", "when", "where", "why", "how", "is", "are", "can", "does", "do"]
  const words = question.toLowerCase().split(" ")
  return words.length < 10 && simpleKeywords.includes(words[0])
}

export async function POST(req: Request) {
  console.log("Research Chat API route called")
  try {
    const { messages, initialContent } = await req.json()

    if (!messages?.length) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 })
    }

    const currentMessage = messages[messages.length - 1].content
    if (!currentMessage?.trim()) {
      return NextResponse.json({ error: "Empty message content" }, { status: 400 })
    }

    // Extract the conversation history for context
    let conversationContext = ""
    if (messages.length > 1) {
      conversationContext = messages
        .slice(Math.max(0, messages.length - 6)) // Get the latest 5 exchanges for context
        .map((msg: any) => `${msg.role}: ${msg.content}`)
        .join("\n\n")
    }

    console.log("Processing chat request:", currentMessage)
    console.log(`With ${messages.length-1} previous messages in chat history`)

    // Perform web search
    const searchResponse = await performWebSearch(currentMessage)
    let searchContext = ""
    if (searchResponse.results && searchResponse.results.length > 0) {
      searchContext = searchResponse.results
        .map(
          (result: SearchResult, index: number) =>
            `Source [${index + 1}]:
Title: ${result.title || "Untitled"}
URL: ${result.url || "No URL provided"}
Summary: ${result.summary || "No summary available"}
`,
        )
        .join("\n\n")
    } else {
      console.warn("No search results available or search error occurred")
      searchContext = "No relevant search results found."
    }

    const isSimple = isSimpleQuestion(currentMessage)
const prompt = `You are an AI assistant helping with questions about the following research content:

${initialContent}

Chat history:
${conversationContext}

User's latest question: "${currentMessage}"

Here are some relevant web search results:

${searchContext}

${isSimple ? "Provide a concise and direct answer to the user's question. Keep your response under 50 words if possible." : "Please provide a helpful and informative response based on the research content, chat history, and the web search results. Maintain continuity with your previous responses."}

Critically important:
- Refer to earlier parts of the conversation when relevant
- Acknowledge information already provided in the conversation
- Don't repeat explanations already given in prior messages
- ALL citations in the text must be hyperlinks to the corresponding reference
- In the References section, format each reference as follows:
<p id="ref1">[1] , "<a href="https://www.example.com/article-url" target="_blank" rel="noopener noreferrer">Title of the Article</a>," Journal Name, vol. X, no. Y, pp. ZZ-ZZ, Year.</p>
Use the web search results to provide relevant and up-to-date information
- Each reference should start on a new line and be numbered sequentially
- Ensure all citations in the text have corresponding entries in the References section
- Make sure each reference has a clickable hyperlink (in blue color) to the source
- Use numbered citations in square brackets (e.g., [1], [2], etc.) within the text to refer to sources
- Always use real references and links which link to real sources
- Create valuable and detailed information
- If the query requires any references and links, always add real hyperlinks which are sources to actual content related to the content
-if asked a simple question, just answer it from web or the ref content
- Never use a website link that is hypothetical. Each link should be real and source to a website. also no data in ref should be hypothetical
- Maintain consistent formatting throughout the entire response`

    console.log("Generating chat response using Gemini Pro...")
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: isSimple ? 1024 : 4096,
        temperature: isSimple ? 0.3 : 0.7,
        topP: 1,
        topK: 40,
      },
    })
    const response = await result.response
    const text = response.text()

    if (!text) {
      throw new Error("Empty response from Gemini Pro")
    }

    console.log("Chat response generated successfully")

    return NextResponse.json({
      success: true,
      content: text,
    })
  } catch (error) {
    console.error("API route error:", error)
    let errorMessage = "An unexpected error occurred"
    let errorDetails = "No additional details available"
    let statusCode = 500

    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || "No stack trace available"
    }

    if (error && typeof error === "object" && "status" in error) {
      statusCode = (error as any).status || 500
    }

    // Handle 503 Service Unavailable error specifically
    if (statusCode === 503) {
      errorMessage = "Service temporarily unavailable. Please try again later."
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
      },
      { status: statusCode },
    )
  }
}

