import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

// Make createServiceClient a local function (do not export it)
const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
};

export async function POST(request: Request) {
  try {
    // Parse the incoming form data
    const formData = await request.formData();

    // Extract fields from form data
    const title = formData.get('title')?.toString();
    const description = formData.get('description')?.toString() || null;
    const board = formData.get('board')?.toString();
    const grade = formData.get('grade')?.toString();
    const section = formData.get('section')?.toString();
    const subject = formData.get('subject')?.toString();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Generate a unique filename using uuid and the original file extension
    const originalName = file.name;
    const fileExt = originalName.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExt}`;

    // Read the file as an ArrayBuffer then create a Buffer from it
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file to the "knowledge_base" bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('knowledge_base')
      .upload(uniqueFileName, buffer, {
        contentType: file.type || 'application/octet-stream',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
    }

    // Retrieve the public URL of the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('knowledge_base')
      .getPublicUrl(uniqueFileName);
    const publicURL = publicUrlData.publicUrl;

    // Prepare the record to be inserted (mapping "board" to "education_board")
    const record = {
      title,
      description,
      education_board: board,
      grade,
      section,
      subject,
      file_url: publicURL,
    };

    // Insert the record into the "knowledge_base" table
    const { data: dbData, error: dbError } = await supabase
      .from('knowledge_base')
      .insert(record);

    if (dbError) {
      console.error('Database insert error:', dbError);
      return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Upload successful', data: dbData }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Unexpected error occurred' }, { status: 500 });
  }
}
