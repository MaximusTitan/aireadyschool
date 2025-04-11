import { NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { createClient } from '@/utils/supabase/server';

if (!process.env.FLUX_API_KEY) {
  console.error('FLUX_API_KEY is not set. Please set this environment variable.');
}

fal.config({
  credentials: process.env.FLUX_API_KEY,
});

export async function POST(req: Request) {
  const supabase = createClient();
  
  try {
    const { prompt, sceneId, storyId, sceneOrder, sceneDescription } = await req.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Image prompt is required' },
        { status: 400 }
      );
    }

    // Check if story exists in video_stories table
    const { data: storyExists, error: storyCheckError } = await (await supabase)
      .from('video_stories')
      .select('id')
      .eq('id', storyId)
      .single();

    if (storyCheckError || !storyExists) {
      console.error('Story not found:', { storyId, error: storyCheckError });
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Enhanced prompt specifically for manga-style images
    const enhancedPrompt = `${prompt}. Style:  Style: Black and white line art, Grayscale Image.'`;

    // First store the grayscale placeholder
    const { data: sceneRecord, error: insertError } = await (await supabase)
      .from('story_scenes')
      .insert({
        story_id: storyId,
        scene_order: sceneOrder,
        scene_description: sceneDescription,
        user_prompt: prompt,
        enhanced_prompt: enhancedPrompt,
        grayscale_image_url: '', // You'll need to pass the grayscale URL
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: enhancedPrompt,
        image_size: "landscape_16_9",
        num_images: 1
      }
    });

    if (!result.data?.images?.[0]?.url) {
      throw new Error('No image URL in response')
    }

    // Update the record with the final image URL
    const { error: updateError } = await (await supabase)
      .from('story_scenes')
      .update({
        grayscale_image_url: result.data.images[0].url
      })
      .eq('id', sceneRecord.id); 

    if (updateError) throw updateError;

    return NextResponse.json({ 
      imageUrl: result.data.images[0].url,
      sceneId: sceneRecord.id,
      success: true 
    });

  } catch (error) {
    console.error('Error generating storyboard image:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate storyboard image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
