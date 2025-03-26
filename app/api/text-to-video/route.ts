import { NextResponse } from "next/server";
import { LumaAI } from "lumaai";
import { createClient } from "@/utils/supabase/server";

if (!process.env.LUMAAI_API_KEY) {
  throw new Error("Missing LUMAAI_API_KEY environment variable");
}

const client = new LumaAI({
  authToken: process.env.LUMAAI_API_KEY
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { message: "Prompt is required" },
        { status: 400 }
      );
    }

    const generation = await client.generations.create({
      prompt: prompt,
      model: "ray-2",
      resolution: "720p",
      duration: "5s"
    });

    if (!generation.id) {
      throw new Error("Failed to create generation");
    }

    // Store initial record
    const { data: videoRecord, error: insertError } = await supabase
      .from('generated_videos')
      .insert({
        user_id: user.id,
        input_text: prompt,
        status: 'processing',
        duration: 5 // 5 seconds default
      })
      .select()
      .single();

    if (insertError) throw insertError;

    let completed = false;
    let result;

    while (!completed) {
      result = await client.generations.get(generation.id);

      if (result.state === "completed") {
        completed = true;
      } else if (result.state === "failed") {
        // Update record with failed status
        await supabase
          .from('generated_videos')
          .update({
            status: 'failed'
          })
          .eq('id', videoRecord.id);

        throw new Error(result.failure_reason || "Generation failed");
      } else {
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    if (!result?.assets?.video) {
      throw new Error("No video URL in response");
    }

    // Upload to Supabase Storage
    const videoUrl = result.assets.video;
    const response = await fetch(videoUrl);
    const videoBlob = await response.blob();
    const filename = `${videoRecord.id}.mp4`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('videos')
      .upload(filename, videoBlob);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('videos')
      .getPublicUrl(filename);

    // Update record with completed status and video URL
    const { error: updateError } = await supabase
      .from('generated_videos')
      .update({
        video_url: publicUrl,
        status: 'completed'
      })
      .eq('id', videoRecord.id);

    if (updateError) throw updateError;

    return NextResponse.json({ 
      videoUrl: publicUrl,
      recordId: videoRecord.id 
    });
  } catch (error) {
    console.error("Text-to-video generation error:", error);
    return NextResponse.json(
      { message: "Failed to generate video" },
      { status: 500 }
    );
  }
}
