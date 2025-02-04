import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from "next/server"


const genAI = new GoogleGenerativeAI(process.env.G_API_KEY || '')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const LANGSEARCH_API_KEY = process.env.LANGSEARCH_API_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

if (!LANGSEARCH_API_KEY) {
  throw new Error('Missing LangSearch API Key')
}

const supabase = createClient(supabaseUrl, supabaseKey)

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

export const maxDuration = 300 // Set max duration to 5 minutes (300 seconds)

export async function GET() {
  return NextResponse.json({ message: "Research API is working" })
}

export async function POST(req: Request) {
  console.log("Research API route called")
  try {
    const { messages, email, wordLimit } = await req.json()

    if (!messages?.length) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 })
    }

    const currentMessage = messages[messages.length - 1].content
    if (!currentMessage?.trim()) {
      return NextResponse.json({ error: "Empty message content" }, { status: 400 })
    }

    console.log("Processing research request:", currentMessage)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 270000) // 4.5 minutes timeout

    let searchResults: SearchResult[] = []
    let searchError: string | null = null

    try {
      const searchResponse = await performWebSearch(currentMessage, controller.signal)
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

    const prompt = `As an extremely advanced AI research assistant/Question Answer, create a comprehensive and detailed research report/Answer on:

"${currentMessage}" or if "${currentMessage}" is a question, answer the question in the most wel detailed manner possible with citation and ref of the answers but dont create research on that 

${
  !noSearchResults
    ? `Using these web sources:

${searchContext}`
    : "Using your general knowledge and understanding of the topic:"
}

Create an extensive and thorough academic report following this structure:
Title of the research((this section should contain just a one liner title without any index)

1. Executive Summary
2. Main Research Findings (provide in-depth analysis and multiple perspectives)
3. Technical Details & Implementation (be as detailed as possible)
4. Future Implications & Recommendations (explore various scenarios)
5. References (should be from reputable and trusted sources only from top tech companies or famous blog sources and research papers)
If if "${currentMessage}" is a question, answer the question in the most wel detailed manner possible with citation and ref of the answers but dont create research on that 
${wordLimit ? `Please limit your response to approximately ${wordLimit} words.` : ""}

Important Guidelines:
- ${!noSearchResults ? "Prioritize findings from the provided sources, but expand on them with additional research and analysis" : "Provide the most up-to-date and comprehensive information you have"}
- Include numerous specific data points, statistics, and evidence
- Maintain rigorous academic standards and provide a balanced view of the topic
- Highlight key discoveries, breakthroughs, and ongoing debates in the field
- ${!noSearchResults ? "Use citations for the provided sources and supplement with additional reputable sources" : "Find and cite real and trusted sources to support your analysis."}
- Use numbered citations in square brackets (e.g., [1], [2], etc.) within the text to refer to sources

Critically Important:
- ALL citations in the text must be hyperlinks to the corresponding reference
-if "${currentMessage}" is a question, answer the question in the most wel detailed manner possible with citation and ref of the answers but dont create research on that 
- In the References section, format each reference as follows:
<p id="ref1">[1] "<a href="https://www.example.com/article-url" target="_blank" rel="noopener noreferrer">Title of the Article</a>," Journal Name, vol. X, no. Y, pp. ZZ-ZZ, Year.</p>
- Each reference should start on a new line and be numbered sequentially
- Ensure all citations in the text have corresponding entries in the References section
- Make sure each reference has a clickable hyperlink (in blue color) to the source and should be in markdown format

- Maintain consistent formatting throughout the entire report
Never write any extra message due to limited word count or limited in web search results
`

    console.log("Generating research report...")
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.7,
        topP: 1,
        topK: 40,
      },
    })

    if (!result?.response) {
      throw new Error("Empty response from Gemini")
    }

    const text = result.response.text()
    if (!text) {
      throw new Error("Empty text in Gemini response")
    }

    console.log("Research report generated successfully")

    // Save to Supabase
    const { data: savedData, error: supabaseError } = await supabase
      .from("chat_history_new")
      .insert({
        email,
        prompt: currentMessage,
        response: text,
        timestamp: new Date().toISOString(),
        conversation: [
          { role: "user", content: currentMessage },
          { role: "assistant", content: text },
        ],
      })
      .select()

    if (supabaseError) {
      console.error("Supabase save error:", supabaseError)
      throw supabaseError
    }

    return NextResponse.json({
      success: true,
      role: "assistant",
      content: text,
      noSearchResults,
      id: savedData[0].id,
    })
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        details: error instanceof Error ? error.stack : JSON.stringify(error),
      },
      { status: 500 },
    )
  }
}

export async function PUT(req: Request) {
  try {
    const { id, conversation } = await req.json()

    const updateData: { conversation?: any } = {}
    if (conversation) updateData.conversation = conversation

    const { error } = await supabase.from("chat_history_new").update(updateData).eq("id", id)

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        details: error instanceof Error ? error.stack : JSON.stringify(error),
      },
      { status: 500 },
    )
  }
}