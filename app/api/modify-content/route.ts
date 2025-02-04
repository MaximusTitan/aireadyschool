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

async function performWebSearch(query: string, signal: AbortSignal): Promise<SearchResponse> {
  console.log("Starting web search with query:", query)

  if (!query.trim()) {
    console.warn("Empty search query provided, using generic search")
    query = "latest research and developments"
  }

  const maxRetries = 3
  let retryCount = 0

  while (retryCount < maxRetries) {
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
          
        }),
        signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Web search failed: ${response.status} - ${response.statusText}. Error: ${errorText}`)

        if (response.status === 500) {
          retryCount++
          console.log(`Retrying search (attempt ${retryCount} of ${maxRetries})`)
          await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount)) // Exponential backoff
          continue
        }

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
      if (retryCount === maxRetries - 1) {
        return {
          error: error instanceof Error ? error.message : "Failed to perform web search after multiple attempts",
          results: [],
        }
      }
      retryCount++
      console.log(`Retrying search (attempt ${retryCount} of ${maxRetries})`)
      await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount)) // Exponential backoff
    }
  }

  return {
    error: "Failed to perform web search after maximum retries",
    results: [],
  }
}

export async function POST(req: Request) {
  console.log("Modify Content API route called")
  try {
    const { instruction, currentContent, chatHistory } = await req.json()

    if (!instruction?.trim() || !currentContent?.trim() || !Array.isArray(chatHistory)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    console.log("Processing modification request:", instruction)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 270000) // 4.5 minutes timeout

    let searchResults: SearchResult[] = []
    let searchError: string | null = null

    try {
      const searchResponse = await performWebSearch(instruction, controller.signal)
      if (searchResponse.error) {
        console.warn("Search warning:", searchResponse.error)
        searchError = searchResponse.error
      }
      searchResults = searchResponse.results || []
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json({ error: "Request timed out" }, { status: 504 })
      }
      console.error("Unexpected error during web search:", error)
      searchError = error instanceof Error ? error.message : "Unexpected error during web search"
    } finally {
      clearTimeout(timeoutId)
    }

    if (searchError) {
      console.warn(`Proceeding without search results due to error: ${searchError}`)
    }

    const noSearchResults = searchResults.length === 0
    console.log(`Search results found: ${!noSearchResults}. Error: ${searchError || "None"}`)

    let searchContext = ""
    if (!noSearchResults) {
      searchContext = searchResults
        .map(
          (result: SearchResult, index: number) =>
            `Source [${index + 1}]:
Title: ${result.title || "Untitled"}
URL: ${result.url || "No URL provided"}
Summary: ${result.summary || "No summary available"}
`,
        )
        .join("\n\n")
    }

    // Format chat history
    const formattedChatHistory = chatHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n\n")

    const prompt = `You are an AI assistant tasked with modifying research content based on user instructions and chat history. Here's the current content:

${currentContent}

Chat history:
${formattedChatHistory}

User's modification instruction: "${instruction}"

${
  !noSearchResults
    ? `Here are some relevant web search results to help with the modification:

${searchContext}`
    : "No relevant search results were found. Please use your general knowledge to assist with the modification."
}

Please provide the FULL modified content based on the user's instruction, the chat history, and the web search results. The response should include the entire content with the modifications incorporated, not just the modified part.

Critically important:
- ALL citations in the text must be hyperlinks to the corresponding reference
- In the References section, format each reference as follows:
<p id="ref1">[1] , "<a href="https://www.example.com/article-url" target="_blank" rel="noopener noreferrer">Title of the Article</a>," Journal Name</p>
- Use the web search results to provide relevant and up-to-date information
- Each reference should start on a new line and be numbered sequentially
- Ensure all citations in the text have corresponding entries in the References section
- Make sure each reference has a clickable hyperlink (in blue color) to the source
- Use numbered citations in square brackets (e.g., [1], [2], etc.) within the text to refer to sources
- Always use real references and links which link to real sources
- Create valuable and detailed information
- If the query requires any references and links, always add real hyperlinks which are sources to actual content related to the content
- Never use a website link that is hypothetical. Each link should be real and source to a website. also no data in ref should be hypothetical
- Maintain consistent formatting throughout the entire response.`

    console.log("Generating modified content using Gemini...")
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const result = await model.generateContent(prompt)
    const response = await result.response
    const modifiedContent = response.text()

    if (!modifiedContent) {
      throw new Error("Empty response from Gemini")
    }

    console.log("Content modification completed successfully")

    return NextResponse.json({
      success: true,
      modifiedContent: `

${modifiedContent}

[Content has been modified based on the user's instructions and web search results.]`,
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

