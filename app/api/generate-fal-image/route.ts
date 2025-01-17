import { fal } from "@fal-ai/client";
import { NextResponse } from "next/server";

fal.config({
  credentials: process.env.FAL_KEY!,
});

export async function POST(req: Request) {
  if (!process.env.FAL_KEY) {
    return NextResponse.json(
      { error: "FAL API key is missing" },
      { status: 500 }
    );
  }

  try {
    const { prompt } = await req.json();

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is missing or empty" },
        { status: 400 }
      );
    }

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: `Create a detailed, high-quality image based on the following description: ${prompt}.The image should be vivid, realistic, and visually striking.`,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(update.logs.map((log) => log.message));
        }
      },
    });

    if (!result.data?.images?.[0]?.url) {
      throw new Error("No image generated");
    }

    return NextResponse.json({ result: result.data.images[0].url });
  } catch (error: unknown) {
    console.error("Error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        details: error instanceof Error ? error.stack : undefined,
      });
    }
  }
}