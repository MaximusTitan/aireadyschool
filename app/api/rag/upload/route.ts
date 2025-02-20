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
    const files = formData.getAll('files') as File[];

    for (const file of files) {
      const filePath = `resources/${user.email}/${Date.now()}_${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage.from('resources').getPublicUrl(filePath);
      
      await supabase.from('resources').insert({
        file_name: file.name,
        user_email: user.email,
        url: publicUrl // Store file URL in the table
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
