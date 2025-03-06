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

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { message, selectedDocs } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!selectedDocs || selectedDocs.length === 0) {
      return NextResponse.json({ error: 'No document selected' }, { status: 400 });
    }

    // Fetch all matching resource_ids for the provided file names
    const { data: docData, error: docError } = await supabase
      .from('resources')
      .select('id')
      .in('file_name', selectedDocs);

    if (docError || !docData || docData.length === 0) {
      return NextResponse.json({ error: 'Documents not found' }, { status: 404 });
    }

    const resourceIds = docData.map(doc => doc.id);
    console.log("Resource IDs: ", resourceIds);

    // Generate vector embedding for the message
    const messageEmbedding = await getEmbedding(message);

    // Query embeddings for the selected resource_ids
    const { data: matches, error } = await supabase
      .from('embeddings')
      .select('chunk_text, embedding')
      .in('resource_id', resourceIds);

    if (error) {
      console.error('Vector search error:', error);
      return NextResponse.json({ error: 'Error fetching document matches' }, { status: 500 });
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        response: "I'm sorry, but I couldn't find relevant context in the selected documents.",
        hasContext: false,
        matchCount: 0
      });
    }

    // Helper function to compute cosine similarity
    const cosineSimilarity = (a: number[], b: number[]) => {
      const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
      const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val ** 2, 0));
      const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val ** 2, 0));
      return dotProduct / (magnitudeA * magnitudeB);
    };

    // Compute similarity scores for all document chunks
    const scoredMatches = matches
      .map(match => {
        let parsedEmbedding: number[];
        try {
          parsedEmbedding = JSON.parse(match.embedding);
        } catch (err) {
          console.warn("Failed to parse embedding for chunk:", match.chunk_text);
          return null;
        }
        const cosineSim = cosineSimilarity(messageEmbedding, parsedEmbedding);
        const textBonus = match.chunk_text.toLowerCase().includes(message.toLowerCase()) ? 0.2 : 0;
        return { chunk_text: match.chunk_text, score: cosineSim + textBonus };
      })
      .filter(match => match !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const context = scoredMatches.map(match => match.chunk_text).join('\n\n');

    // Generate ChatGPT response using the context
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant analyzing documents. Base your answers only on the provided context.
                    If the context doesn't contain enough information, explain what specific details are missing.
                    If you're unsure, indicate that clearly.`
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
