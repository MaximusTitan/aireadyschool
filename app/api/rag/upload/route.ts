import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { Document } from "@langchain/core/documents";
import { TextLoader } from "langchain/document_loaders/fs/text"; 
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small"
});

const vectorStore = new MemoryVectorStore(embeddings);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    let docChunks: { resource_id: number; chunk_text: string }[] = [];

    for (const file of files) {
      // Upload file to Supabase Storage
      const filePath = `resources/${user.email}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        continue;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resources')
        .getPublicUrl(filePath);

      // Insert file record into "resources" table and retrieve resource_id
      const { data: resourceData, error: resourceInsertError } = await supabase
        .from('resources')
        .insert({
          file_name: file.name,
          user_email: user.email,
          url: publicUrl,
        })
        .select('id')
        .single();

      if (resourceInsertError || !resourceData?.id) {
        console.error('Failed to insert file into resources table:', resourceInsertError);
        continue;
      }

      const resource_id = resourceData.id; // Store the resource_id

      // Fetch file from URL
      const response = await fetch(publicUrl);
      if (!response.ok) {
        console.error(`Failed to fetch file from ${publicUrl}`);
        continue;
      }

      let fileDocs: Document[] = [];

      if (publicUrl.endsWith('.pdf')) {
        const buffer = await response.arrayBuffer();
        const topicBlob = new Blob([buffer], { type: 'application/pdf' });
        const loader = new WebPDFLoader(topicBlob);
        fileDocs = await loader.load();
      } 
      else if (publicUrl.endsWith('.csv')) {
        const csvText = await response.text();
        const csvBlob = new Blob([csvText], { type: 'text/csv' });
        const csvLoader = new TextLoader(csvBlob);
        fileDocs = await csvLoader.load();
      }

      // Split documents into chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000, chunkOverlap: 200
      });

      const chunks = await splitter.splitDocuments(fileDocs);

      // Store chunks along with resource_id
      for (const chunk of chunks) {
        docChunks.push({
          resource_id,
          chunk_text: chunk.pageContent,
        });
      }
    }

    // Generate embeddings for each chunk
    const embeddedVectors = await embeddings.embedDocuments(
      docChunks.map(doc => doc.chunk_text)
    );
    
    // Ensure each embedding is a single array (1536 dimensions)
    const records = docChunks.map((doc, index) => ({
      user_email: user.email,
      resource_id: doc.resource_id, 
      chunk_text: doc.chunk_text,
      embedding: embeddedVectors[index], // Ensure this is 1536 dimensions
    }));
    
    // Insert chunk_text & embeddings into Supabase
    const { error: insertError } = await supabase
      .from('embeddings')
      .insert(records);
    
    if (insertError) {
      console.error('Failed to insert embeddings:', insertError);
      return NextResponse.json(
        { error: 'Failed to store embeddings', details: insertError.message },
        { status: 500 }
      );
    }    

    // Add this line to return the embeddings along with resource_ids
    const responseRecords = records.map((record, index) => ({
      resource_id: record.resource_id,
      chunk_text: record.chunk_text,
      embedding: embeddedVectors[index],
    }));

    return NextResponse.json({ success: true, message: 'Embeddings stored successfully', data: responseRecords });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

