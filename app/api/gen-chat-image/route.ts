// app/api/generate/route.ts
import { NextResponse } from 'next/server'
import { fal } from "@fal-ai/client"
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { prompt, imageSize, style, colors } = await request.json()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user credits
    const { data: userData, error: creditsError } = await supabase
      .from('users')
      .select('image_credits')
      .eq('user_id', user.id)
      .single()

    if (creditsError || !userData) {
      return NextResponse.json({ error: 'Failed to fetch user credits' }, { status: 400 })
    }

    // Check if user has enough credits
    const requiredCredits = 1
    if (userData.image_credits < requiredCredits) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
    }

    // Configure FAL client
    fal.config({
      credentials: process.env.FAL_KEY
    })

    // Generate images using Recraft V3
    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt,
        image_size: imageSize || "square_hd",
      },
      logs: true
    })

    // Deduct credits after successful generation
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        image_credits: userData.image_credits - requiredCredits 
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to update credits:', updateError)
      // Continue since image was generated successfully
    }

    return NextResponse.json({
      images: result.data.images,
      remainingCredits: userData.image_credits - requiredCredits
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}