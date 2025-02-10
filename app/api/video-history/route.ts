import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('video_analyses')
      .select('*')
      .eq('user_email', email)
      .order('id', { ascending: false })
    
    if (error) throw error

    return NextResponse.json({ videoHistory: data })
  } catch (err) {
    console.error('Video History Error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch video history' },
      { status: 500 }
    )
  }
}
