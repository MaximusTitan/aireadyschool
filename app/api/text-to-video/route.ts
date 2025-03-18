import { NextResponse } from "next/server";
import { LumaAI } from "lumaai";

if (!process.env.LUMAAI_API_KEY) {
  throw new Error("Missing LUMAAI_API_KEY environment variable");
}

const client = new LumaAI({
  authToken: process.env.LUMAAI_API_KEY
});

export async function POST(req: Request) {
  try {
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

    let completed = false;
    let result;

    while (!completed) {
      result = await client.generations.get(generation.id);

      if (result.state === "completed") {
        completed = true;
      } else if (result.state === "failed") {
        throw new Error(result.failure_reason || "Generation failed");
      } else {
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    if (!result?.assets?.video) {
      throw new Error("No video URL in response");
    }

    return NextResponse.json({ videoUrl: result.assets.video });
  } catch (error) {
    console.error("Text-to-video generation error:", error);
    return NextResponse.json(
      { message: "Something went wrong while generating the video. Please try again later." },
      { status: 500 }
    );
  }
}
