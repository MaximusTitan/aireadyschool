import { NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

if (!process.env.FLUX_API_KEY) {
  console.error('FLUX_API_KEY is not set.');
}

fal.config({
  credentials: process.env.FLUX_API_KEY,
});

const CINEMATIC_BASE_PROMPT = `Create a photorealistic, cinematic scene with professional photography qualities. 
Include dramatic lighting, rich colors, detailed textures, and atmospheric effects. 
Style: Hollywood movie still, 8K resolution, professional color grading, 
high dynamic range, volumetric lighting, depth of field effects, 
cinematic composition, professional photography, movie frame.`;

async function enhancePrompt(basePrompt: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ 
        role: "user", 
        content: `Enhance this image prompt for a cinematic, realistic image. Add specific details about lighting, atmosphere, and visual style while maintaining the original meaning: "${basePrompt}"` 
      }],
      temperature: 0.7,
      max_tokens: 200
    });

    return completion.choices[0].message.content || basePrompt;
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    return basePrompt;
  }
}

export async function POST(req: Request) {
  const supabase = createClient();
  
  try {
    const { 
      sceneDescription, 
      imageDescription, 
      shotType,
      sceneId,
      storyId,
      sceneOrder 
    } = await req.json();

    // Construct and enhance the prompt
    const basePrompt = `${sceneDescription || ''}${
      shotType ? `. Camera angle: ${shotType}` : ''
    }${imageDescription ? `. Scene details: ${imageDescription}` : ''}`;
    
    const enhancedPrompt = await enhancePrompt(basePrompt);
    const finalPrompt = `${CINEMATIC_BASE_PROMPT} Scene details: ${enhancedPrompt}`;

    console.log('Generated prompt:', finalPrompt);

    // Use flux schnell for high-quality image generation
    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt: finalPrompt,
        image_size: "landscape_16_9",
        num_images: 1,
      }
    });

    if (!result.data?.images?.[0]?.url) {
      throw new Error('No image URL in response');
    }

    // Update the database record
    const { error: updateError } = await (await supabase)
      .from('story_scenes')
      .update({
        user_prompt: basePrompt,
        enhanced_prompt: finalPrompt,
        final_image_url: result.data.images[0].url
      })
      .eq('story_id', storyId)
      .eq('scene_order', sceneOrder);

    if (updateError) throw updateError;

    return NextResponse.json({
      imageUrl: result.data.images[0].url,
      enhancedPrompt: finalPrompt,
      success: true
    });

  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
