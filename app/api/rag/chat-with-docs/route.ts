import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

async function getEmbedding(text: string) {
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return embeddingResponse.data[0].embedding;
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Get user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { message, selectedDocs} = await request.json();

    console.log("Message: ", message);
    console.log("Resources: ", selectedDocs);

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!selectedDocs || selectedDocs.length === 0) {
      return NextResponse.json({ error: 'No document selected' }, { status: 400 });
    }

    // Fetch the resource_id from your documents table by matching file_name with the first selected document
    const fileName = selectedDocs[0]; // adjust if you need to support multiple docs
    const { data: docData, error: docError } = await supabase
      .from('resources') // ensure this is your correct table name
      .select('id')
      .eq('file_name', fileName)
      .single();

    if (docError || !docData) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    const resource_id = docData.id;
    console.log("Resource ID: ", resource_id);

    // Generate vector embedding for the message
    const messageEmbedding = await getEmbedding(message);

    // Query embeddings for the given resource_id
    const { data: matches, error } = await supabase
      .from('embeddings')
      .select('chunk_text, embedding')
      .eq('resource_id', resource_id);

    if (error) {
      console.error('Vector search error:', error);
      return NextResponse.json({ error: 'Error fetching document matches' }, { status: 500 });
    }

    if (!matches || matches.length === 0) {
      console.log("No matches found for resource_id:", resource_id);
      return NextResponse.json({
        response: "I'm sorry, but without context or access to the document, I can't provide information about the skills mentioned. Please upload a document or provide more details.",
        hasContext: false,
        matchCount: 0
      });
    }

    console.log("Raw matches from DB:", matches);

    // Helper: Compute cosine similarity between two vectors.
    const cosineSimilarity = (a: number[], b: number[]) => {
      const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
      const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val ** 2, 0));
      const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val ** 2, 0));
      return dotProduct / (magnitudeA * magnitudeB);
    };

    // Compute similarity scores and add a bonus if the text includes the query
    const scoredMatches = matches.map((match: any) => {
      let parsedEmbedding: number[];
      try {
        parsedEmbedding = JSON.parse(match.embedding);
      } catch (err) {
        console.warn("Failed to parse embedding for chunk:", match.chunk_text);
        return null;
      }
      const cosineSim = cosineSimilarity(messageEmbedding, parsedEmbedding);
      // Basic text-match bonus: add 0.2 if the chunk_text (case-insensitive) contains the query
      const textBonus = match.chunk_text.toLowerCase().includes(message.toLowerCase()) ? 0.2 : 0;
      const combinedScore = cosineSim + textBonus;
      console.log(`Score for chunk "${match.chunk_text.slice(0,30)}...": cosineSim=${cosineSim.toFixed(3)}, textBonus=${textBonus}, combinedScore=${combinedScore.toFixed(3)}`);
      return { chunk_text: match.chunk_text, score: combinedScore };
    })
    .filter((match) => match !== null) // Filter out low scores
    .sort((a, b) => {
      if (a === null) return 1; // Treat null as less than any valid match
      if (b === null) return -1; // Treat null as less than any valid match
      return b.score - a.score;
    })
    .slice(0, 5); 

    // Build context string from top-matching document chunks
    const context = scoredMatches.map((match: any) => match.chunk_text).join('\n\n');
    console.log("Context built:", context);

    // Generate ChatGPT response using the context
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant analyzing documents. Base your answers only on the provided context.
                    If the context doesn't contain enough information to answer the question fully, explain what specific information is missing.
                    If you're unsure about any information, indicate that clearly. Do not mention document numbers.`
        },
        {
          role: "user",
          content: context 
            ? `Context:\n${context}\n\nQuestion: ${message}`
            : `No context available. Question: ${message}`
        },
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return NextResponse.json({ 
      response: completion.choices[0]?.message?.content || 'No response generated',
      hasContext: context.length > 0,
      matchCount: scoredMatches.length
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Chat request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
