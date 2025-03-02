import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import createParser from 'pdf2json';

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
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[]; // Changed from single file to multiple

    for (const file of files) { // Loop through each file
      // Read file content
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      let text = '';

      if (file.type === 'application/pdf') {
        const parser = new createParser();
        text = await new Promise((resolve, reject) => {
          parser.on('pdfParser_dataReady', (pdfData) => {
            resolve(pdfData.Pages.map(page => 
              page.Texts.map(text => text.R.map(r => r.T).join(' ')).join(' ')
            ).join('\n'));
          });
          parser.parseBuffer(fileBuffer);
        });
      } else {
        text = fileBuffer.toString('utf-8');
      }

      // Create embeddings
      const chunks = text.match(/[\s\S]{1,1000}/g) || [];
      
      for (const chunk of chunks) {
        const embedding = await openai.embeddings.create({
          input: chunk,
          model: "text-embedding-ada-002"
        });

        await supabase.from('documents').insert({
          content: chunk,
          embedding: embedding.data[0].embedding,
          file_name: file.name, // Add file_name
          user_email: user.email  // Use authenticated user email
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}