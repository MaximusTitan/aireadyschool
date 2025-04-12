import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sceneId = searchParams.get('sceneId');
  const supabase = createClient();

  if (!sceneId) {
    return NextResponse.json(
      { error: 'Scene ID is required' },
      { status: 400 }
    );
  }

  try {
    const { data: audioRecord, error } = await (await supabase)
      .from('scene_audio')
      .select('*')
      .eq('scene_id', sceneId)
      .single();

    if (error) throw error;

    if (!audioRecord) {
      return NextResponse.json(
        { error: 'Audio not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      audio: audioRecord
    });

  } catch (error) {
    console.error('Error fetching audio:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audio' },
      { status: 500 }
    );
  }
}
