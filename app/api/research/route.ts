import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Anthropic } from "@anthropic-ai/sdk";
import { Message } from "../../tools/research/types";

const LANGSEARCH_API_KEY = process.env.LANGSEARCH_API_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

if (!LANGSEARCH_API_KEY) {
  throw new Error('Missing LangSearch API Key')
}

if (!ANTHROPIC_API_KEY) {
  throw new Error('Missing Anthropic API Key')
}

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY
});

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
  console.log("Research API route called");
  try {
    const { messages, email, wordLimit, thread_id } = await req.json();

    if (!messages?.length) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const currentMessage = messages[messages.length - 1].content;
    if (!currentMessage?.trim()) {
      return NextResponse.json({ error: "Empty message content" }, { status: 400 });
    }

    // Add this check to handle missing email
    const userEmail = email || 'anonymous@user.com';
    console.log("Processing research request for user:", userEmail);

    console.log("Processing research request:", currentMessage);

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

    const systemPrompt = `You are Claude, an AI assistant specialized in research. 
You are an extremely advanced AI research assistant capable of generating comprehensive and detailed academic reports. You excel at synthesizing information from various sources and producing well-structured research with proper citations.

REFERENCES FORMAT:
At the end of your response, always include a "References" section with numbered items.
Format each reference as an HTML tag like this:
<p id="ref1">[1] "<a href="URL">TITLE</a>," DESCRIPTION</p>

For example:
<p id="ref1">[1] "<a href="https://example.com/paper">The Study of Examples</a>," Journal of Examples, 2023.</p>

Make sure each reference has:
1. A unique ID (ref1, ref2, etc.)
2. A number in square brackets [1]
3. A title in quotes inside an anchor tag
4. A valid URL in the href attribute
5. A brief description after the link

This format ensures proper display in the references panel.`;

    const userPrompt = `Create a comprehensive and detailed research report on:

"${currentMessage}" ${currentMessage.endsWith('?') ? '(This is a question, so answer it thoroughly rather than creating a formal research report)' : ''}

${
  !noSearchResults
    ? `Using these web sources:

${searchContext}`
    : "Using your general knowledge and understanding of the topic:"
}

Create an extensive and thorough academic report following this structure:
Title of the research (this section should contain just a one liner title without any index)

1. Executive Summary
2. Main Research Findings (provide in-depth analysis and multiple perspectives)
3. Technical Details & Implementation (be as detailed as possible)
4. Future Implications & Recommendations (explore various scenarios)
5. References (should be from reputable and trusted sources only from top tech companies or famous blog sources and research papers)

${currentMessage.endsWith('?') ? 'Since this is a question, answer it directly and comprehensively rather than following the research structure above.' : ''}
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
- In the References section, format each reference as follows:
<p id="ref1">[1] "<a href="https://www.example.com/article-url" target="_blank" rel="noopener noreferrer">Title of the Article</a>," Journal Name, vol. X, no. Y, pp. ZZ-ZZ, Year.</p>
- Each reference should start on a new line and be numbered sequentially
- Ensure all citations in the text have corresponding entries in the References section
- Make sure each reference has a clickable hyperlink (in blue color) to the source and should be in markdown format

- Maintain consistent formatting throughout the entire report
Never write any extra message due to limited word count or limited in web search results`;

    console.log("Generating research report with Claude 3.5...")
    
    // Using Anthropic Claude 3.5 instead of Gemini
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt
        }
      ]
    });

    if (!message || !message.content || message.content.length === 0) {
      throw new Error("Empty or invalid response from Claude")
    }

    // Extract text from the message content
    const text = message.content
  .filter(item => item.type === 'text')
  .map(item => (item as { text: string }).text)
  .join('\n\n');
      
    if (!text) {
      throw new Error("Empty text in Claude response")
    }

    console.log("Research report generated successfully with Claude 3.5")

    // Extract references section from the content
    const extractReferencesAndContent = (text: string) => {
      // First look for a References section with a heading
      const referencesSectionRegex = /\n\s*References:?\s*\n/i;
      const referencesMatch = text.match(referencesSectionRegex);
      
      if (referencesMatch && referencesMatch.index !== undefined) {
        const referencesStartIndex = referencesMatch.index;
        const mainContent = text.substring(0, referencesStartIndex).trim();
        const referencesSection = text.substring(referencesStartIndex);
        
        // Extract individual reference paragraphs with HTML tags
        const referenceRegex = /<p id="ref\d+">.*?<\/p>/gs;
        const referenceEntries = referencesSection.match(referenceRegex) || [];
        
        console.log(`Found ${referenceEntries.length} HTML-formatted references`);
        
        if (referenceEntries.length > 0) {
          return {
            content: mainContent,
            references: referenceEntries
          };
        }
        
        // If no HTML references found, try simpler format
        const altRefRegex = /\[\d+\]:.+(?:\n(?!\[\d+\]).+)*/g;
        const altRefMatches = referencesSection.match(altRefRegex);
        
        if (altRefMatches && altRefMatches.length > 0) {
          console.log(`Found ${altRefMatches.length} markdown-formatted references`);
          return {
            content: mainContent,
            references: altRefMatches
          };
        }
      }
      
      // If no references section with heading, look for references directly
      const htmlRefRegex = /<p id="ref\d+">.*?<\/p>/gs;
      const htmlRefs = text.match(htmlRefRegex);
      
      if (htmlRefs && htmlRefs.length > 0) {
        console.log(`Found ${htmlRefs.length} standalone HTML references`);
        // Find the first reference and split content there
        const firstRefIndex = text.indexOf(htmlRefs[0]);
        return {
          content: text.substring(0, firstRefIndex).trim(),
          references: htmlRefs
        };
      }
      
      // Last attempt - look for markdown references
      const markdownRefRegex = /\[\d+\]:.+(?:\n(?!\[\d+\]).+)*/g;
      const markdownRefs = text.match(markdownRefRegex);
      
      if (markdownRefs && markdownRefs.length > 0) {
        console.log(`Found ${markdownRefs.length} standalone markdown references`);
        // Find the first reference and split content there
        const firstRefIndex = text.indexOf(markdownRefs[0]);
        return {
          content: text.substring(0, firstRefIndex).trim(),
          references: markdownRefs
        };
      }
      
      // No references found or couldn't parse them
      console.log("No references found or couldn't parse them");
      return { content: text, references: [] };
    };

    // Process the text to extract references
    const { content: processedContent, references } = extractReferencesAndContent(text);
    console.log(`Extracted ${references.length} references from response`);

    // Get the proper Supabase client here
    const supabase = await createClient();

    // Check if this is an existing thread
    if (thread_id) {
      // First try to find existing thread in the database
      const { data: existingThread } = await supabase
        .from("chat_history_new")
        .select("*")
        .eq("thread_id", thread_id)
        .maybeSingle();
      
      if (existingThread) {
        // This is an existing thread, update it instead of creating a new one
        const { data: updatedData, error: updateError } = await supabase
          .from("chat_history_new")
          .update({
            response: processedContent,
            references_json: references,
            timestamp: new Date().toISOString(),
            conversation: [
              ...existingThread.conversation, // Keep existing conversation
              { role: "user", content: currentMessage },
              { role: "assistant", content: processedContent }
            ],
          })
          .eq("thread_id", thread_id)
          .select();
        
        if (updateError) {
          console.error("Error updating existing thread:", updateError);
          throw updateError;
        }
        
        return NextResponse.json({
          success: true,
          role: "assistant",
          content: processedContent,
          references: references,
          thread_id: thread_id,
          id: updatedData[0].id,
        });
      }
    }

    // If not an existing thread or thread not found, insert new record
    // Save to Supabase
    const { data: savedData, error: supabaseError } = await supabase
      .from("chat_history_new")
      .insert({
        email: userEmail, // Use the validated email value
        prompt: currentMessage,
        response: processedContent,
        references_json: references, // Use references_json instead of references
        timestamp: new Date().toISOString(),
        thread_id: thread_id, // Store the thread ID
        conversation: [
          { role: "user", content: currentMessage },
          { role: "assistant", content: processedContent }
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
      content: processedContent,
      references: references, // Include the extracted references
      noSearchResults,
      thread_id: thread_id,
      id: savedData[0].id,
    })
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        details: error instanceof Error ? error.stack : JSON.stringify(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { id, conversation } = await req.json()

    // Get the proper Supabase client
    const supabase = await createClient();
    
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
      { status: 500 }
    );
  }
}

// In your research submission function
const handleResearchSubmission = async (prompt: string) => {
  // Get the current user's email
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email || 'anonymous@user.com';

  // Make the API request
  const response = await fetch('/api/research', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      email, // Include the email here
      wordLimit: undefined // Replace with actual word limit if needed
    })
  });
  
  // Handle the response...
}