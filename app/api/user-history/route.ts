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

    // Query the joined data from user_chat_history and video_analyses
    const { data, error } = await supabase
      .from('user_chat_history')
      .select('message, role, timestamp, video_analysis_id, video_analyses:user_analysis(email)')
      .eq('video_analyses.user_email', email)
      .order('timestamp', { ascending: false })

    if (error) throw error

    return NextResponse.json({ history: data })
  } catch (err) {
    console.error('User History Error:', err)
    return NextResponse.json({ error: 'Failed to fetch user history' }, { status: 500 })
  }
}
