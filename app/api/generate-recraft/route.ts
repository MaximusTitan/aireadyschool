// app/api/generate/route.ts
import { NextResponse } from 'next/server'
import { fal } from "@fal-ai/client"
import { createClient } from '@/utils/supabase/server'
import fetch from 'node-fetch'

async function uploadImageToSupabase(imageUrl: string, supabase: any, userEmail: string, fileName: string) {
  try {
    const response = await fetch(imageUrl);
    const imageBuffer = await response.arrayBuffer();

    const bucketPath = `${userEmail}/${fileName}`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('image-generator')
      .upload(bucketPath, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase
      .storage
      .from('image-generator')
      .getPublicUrl(bucketPath);

    return {
      publicUrl,
      bucketPath
    };
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { prompt, imageSize } = await request.json()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = user.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
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

    // Generate images using Flux Schnells
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt,
        image_size: imageSize || "square_hd",
      },
      logs: true
    });

    // Store images in Supabase
    const storedImages = await Promise.all(
      result.data.images.map(async (image: any, index: number) => {
        const fileName = `${Date.now()}_${index}.png`;
        const { publicUrl, bucketPath } = await uploadImageToSupabase(image.url, supabase, userEmail, fileName);

        // Store image metadata in database with Supabase URL
        const { data: imageData, error: insertError } = await supabase
          .from('generated_images')
          .insert({
            user_email: userEmail,
            prompt: prompt,
            image_url: publicUrl, // Store the Supabase public URL instead of FAL URL
            aspect_ratio: imageSize,
            bucket_path: bucketPath,
            metadata: {
              original_url: image.url // Store original FAL URL in metadata
            }
          })
          .select()
          .single();

        if (insertError) throw insertError;

        return {
          ...image,
          url: publicUrl, // Return Supabase URL to frontend
          originalUrl: image.url,
          id: imageData.id
        };
      })
    );

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
      images: storedImages,
      remainingCredits: userData.image_credits - requiredCredits
    });

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}