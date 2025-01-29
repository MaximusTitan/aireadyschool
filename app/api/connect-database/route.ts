import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { supabaseUrl, supabaseAnonKey, databaseName, email } = await request.json();

    // Check if the entry already exists
    const { data: existingData, error: fetchError } = await supabase
      .from('connected_db')
      .select('*')
      .eq('supabase_url', supabaseUrl)
      .eq('database_name', databaseName)
      .single();

    if (fetchError) {
      console.error('Error fetching existing data:', fetchError);
      return NextResponse.json({ error: 'Failed to check existing data' }, { status: 500 });
    }

    if (existingData) {
      return NextResponse.json({ message: 'This connection already exists.' }, { status: 409 }); // Conflict status
    }

    // Insert new data if it doesn't exist
    const { error } = await supabase
      .from('connected_db')
      .insert([{ supabase_url: supabaseUrl, anon_key: supabaseAnonKey, database_name: databaseName, email }]);

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Database already exists.' }, { status: 409 }); // Conflict status
      }
      console.error('Error inserting data:', error);
      return NextResponse.json({ error: 'Failed to store connection data' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Data stored successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

