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

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get embedding for the question
    const embedding = await openai.embeddings.create({
      input: message,
      model: "text-embedding-ada-002"
    });

    // Search for similar content with improved error handling
    const { data: documents, error: matchError } = await supabase.rpc('match_documents', {
      query_embedding: embedding.data[0].embedding,
      match_threshold: 0.7,
      match_count: 5
    });

    if (matchError) {
      console.error('Supabase match error:', matchError);
      return NextResponse.json(
        { error: 'Failed to search documents', details: matchError.message },
        { status: 500 }
      );
    }

    // Prepare context from matched documents with better formatting
    const context = documents && documents.length > 0
      ? documents
          .map((doc: any) => `Document ${doc.document_id}: ${doc.content.trim()}`)
          .join('\n\n')
      : '';

    // Generate response using ChatGPT with improved prompt
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant analyzing documents. Base your answers only on the provided context. 
                   If the context doesn't contain enough information to answer the question fully, explain what specific information is missing.
                   If you're unsure about any information, indicate that clearly.`
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
      hasContext: documents && documents.length > 0,
      matchCount: documents?.length || 0
    });
  } catch (error) {
    console.error('Chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Chat request failed', details: errorMessage },
      { status: 500 }
    );
  }
}