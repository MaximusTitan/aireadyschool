import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase/client';

export async function POST(req: Request) {
  try {
    const { user_id, input_text, processed_text } = await req.json();

    const { data, error } = await supabase
      .from('text_tools')
      .insert([{ user_id, input_text, processed_text }]);

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { data, error } = await supabase.from('text_tools').select('*');

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
