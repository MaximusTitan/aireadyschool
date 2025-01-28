import { fal } from "@fal-ai/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt, audioUrl } = await request.json();

    if (!prompt || !audioUrl) {
      return NextResponse.json(
        { error: "Prompt and audio URL are required" },
        { status: 400 }
      );
    }

    const result = await fal.subscribe("fal-ai/minimax-music", {
      input: {
        prompt,
        reference_audio_url: audioUrl,
      },
    });

    return NextResponse.json({ audioUrl: result.data.audio.url });
  } catch (error) {
    console.error("Error generating song:", error);
    return NextResponse.json(
      { error: "Failed to generate song" },
      { status: 500 }
    );
  }
}
