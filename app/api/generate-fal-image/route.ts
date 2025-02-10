import { fal } from "@fal-ai/client";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

fal.config({
  credentials: process.env.FAL_KEY!,
});
/*
async function storeImageInSupabase(
  imageUrl: string,
  userEmail: string,
): Promise<string> {
  const supabase = createClient();
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error("Failed to fetch the image from the generated URL")
  }
  const imageBlob: Blob = await res.blob()
  const fileName: string = `generated-${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage
      .from("lesson-content-images")
      .upload(fileName, imageBlob, {
          contentType: "image/jpeg",
      });
  if (uploadError) {
    console.error("Error uploading image: ", uploadError);
    throw new Error("Failed to upload image into supabase");
  }
  const {
    data: { publicUrl },
  } = supabase.storage.from("lesson-content-images").getPublicUrl(fileName);
  return publicUrl;
}
*/

export async function POST(req: Request) {
  if (!process.env.FAL_KEY) {
    return NextResponse.json(
      { error: "FAL API key is missing" },
      { status: 500 },
    );
  }
  const supabase = await createClient();
  try {
    const { prompt } = await req.json();

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is missing or empty" },
        { status: 400 },
      );
    }
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: `Create a detailed, high-quality image based on the following
        description: ${prompt}.The image should be vivid, realistic, and visually striking.`,
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

    const falImageUrl = result.data.images[0].url;
    const imageResponse = await fetch(falImageUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to fetch image from url");
    }
    const imageBlob = await imageResponse.blob();
    // store in supabase bucket
    const fileName = `generated-${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("generated-images")
      .upload(fileName, imageBlob, {
        contentType: "image/jpeg",
      });
    if (uploadError) {
      throw new Error("Failed to upload image to Supabase storage");
    }
    // Get the public url of the uploaded image
    const { data: publicUrlData } = supabase.storage
      .from("generated-images")
      .getPublicUrl(fileName);

    const supabaseImageUrl = publicUrlData.publicUrl;

    //const supabaseImageUrl = await storeImageInSupabase(
    //  falImageUrl,
    //  user.email,
    //);

    return NextResponse.json({
      falImageUrl: falImageUrl,
      supabaseImageUrl: supabaseImageUrl,
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json(
        {
          error: "An unexpected error occurred",
          details: error instanceof Error ? error.stack : undefined,
        },
        { status: 500 },
      );
    }
  }
}
