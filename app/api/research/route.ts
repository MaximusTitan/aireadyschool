import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

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
}

interface SearchResponse {
  results?: SearchResult[]
  error?: string
}

async function performWebSearch(query: string): Promise<SearchResponse> {
  try {
    console.log('Starting web search with query:', query)
    
    if (!query.trim()) {
      console.error('Empty search query provided')
      return { error: 'Empty search query', results: [] }
    }

    const response = await fetch('https://api.langsearch.com/v1/web-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LANGSEARCH_API_KEY}`
      },
      body: JSON.stringify({
        query: query,
        freshness: "onLimit",
        summary: true,
        count: 10
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Web search failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      throw new Error(`Web search failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    if (!data.results || !Array.isArray(data.results)) {
      console.error('Invalid response format:', data)
      throw new Error('Invalid response format from search API')
    }

    console.log(`Web search completed with ${data.results.length} results`)
    return {
      results: data.results
    }

  } catch (error) {
    console.error('Web search error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace available'
    })
    return {
      error: error instanceof Error ? error.message : 'Failed to perform web search',
      results: []
    }
  }
}

export async function POST(req: Request) {
  console.log('Research API route called')
  try {
    const { messages, email } = await req.json()
    
    if (!messages?.length) {
      throw new Error('Invalid messages format')
    }

    const currentMessage = messages[messages.length - 1].content
    if (!currentMessage?.trim()) {
      throw new Error('Empty message content')
    }

    console.log('Processing research request:', currentMessage)

    const { results: searchResults, error: searchError } = await performWebSearch(currentMessage)
    
    if (searchError) {
      console.warn('Search error:', searchError)
    }

    const noSearchResults = !searchResults?.length
    console.log(`Search results found: ${!noSearchResults}`)

    let searchContext = ''
    if (!noSearchResults) {
      searchContext = searchResults
        .map((result: SearchResult, index: number) => 
          `Source [${index + 1}]:
Title: ${result.title || 'Untitled'}
URL: ${result.url || 'No URL provided'}
Summary: ${result.snippet || 'No summary available'}
`
        )
        .join('\n\n')
    }

    const prompt = `As an advanced AI research assistant, create a comprehensive research report on:

"${currentMessage}"

${!noSearchResults ? `Using these web sources:

${searchContext}` : 'Using your general knowledge and understanding of the topic:'}

Create a detailed academic report following this structure:
1. Executive Summary
2. Main Research Findings
3. Technical Details & Implementation
4. Future Implications & Recommendations
5. Citations & References

Important Guidelines:
- ${!noSearchResults ? 'Prioritize findings from the provided sources' : 'Provide the most up-to-date information you have'}
- Include specific data points and evidence
- Maintain academic rigor
- Highlight key discoveries and breakthroughs
- ${!noSearchResults ? 'Use proper citations for the provided sources' : 'Indicate when information might need further verification'}`

    console.log('Generating research report...')
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    
    const result = await model.generateContent(prompt)
    if (!result?.response) {
      throw new Error('Empty response from Gemini')
    }

    const text = result.response.text()
    if (!text) {
      throw new Error('Empty text in Gemini response')
    }

    console.log('Research report generated successfully')

    // Save to Supabase
    const { error: supabaseError } = await supabase
      .from('chat_history')
      .insert({
        email,
        prompt: currentMessage,
        response: text,
        timestamp: new Date().toISOString()
      })

    if (supabaseError) {
      console.error('Supabase save error:', supabaseError)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        role: 'assistant', 
        content: text,
        noSearchResults
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('API route error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace available'
    })
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

