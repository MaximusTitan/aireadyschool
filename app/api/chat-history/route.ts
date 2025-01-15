import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

function formatResponseAsMarkdown(response: string): string {
  // Split the response into sections
  const sections = response.split('\n\n');
  
  // Format each section
  const formattedSections = sections.map(section => {
    if (section.startsWith('1. ') || section.startsWith('- ')) {
      // It's already a list, return as is
      return section;
    } else if (section.match(/^[A-Z][\w\s]+:/)) {
      // It's a heading, format as h3
      return '### ' + section;
    } else {
      // It's a paragraph, return as is
      return section;
    }
  });

  // Join the formatted sections
  return formattedSections.join('\n\n');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('chat_history')
      .select(`
        id,
        email,
        prompt,
        response,
        timestamp
      `)
      .eq('email', email)
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Error fetching chat history:', error)
      return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 })
    }

    const formattedData = data.map(item => ({
      ...item,
      response: formatResponseAsMarkdown(item.response)
    }));

    return NextResponse.json({ chatHistory: formattedData })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

