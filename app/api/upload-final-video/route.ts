import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Add type definition for story generation
interface StoryGeneration {
  user_email: string;
  story: string;
  prompt: string;
  final_video_url?: string[];
  generated_videos?: string[];
  generated_images?: string[];
  generated_audio?: string[];
  narration_lines?: string[];
  image_prompts?: string[];
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const videoFile = formData.get("video") as File;
  const story = formData.get("story") as string;
  const prompt = formData.get("prompt") as string;

  if (!videoFile || !story || !prompt) {
    return NextResponse.json(
      { error: "Video file, story, and prompt are required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  let filename: string = '';
  try {
    // Generate a unique filename
    const timestamp = Date.now();
    filename = `final_video_${timestamp}.mp4`;

    // Upload the video file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("generated-videos")
      .upload(filename, videoFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: "video/mp4",
      });

    if (uploadError) {
      console.error("Error uploading video to storage:", uploadError.message);
      throw new Error("Failed to upload video to storage.");
    }

    // Get the public URL of the uploaded video
    const { data } = supabase.storage
      .from("generated-videos")
      .getPublicUrl(filename);

    if (!data.publicUrl) {
      console.error("Error retrieving public URL: publicUrl is undefined");
      throw new Error("Failed to retrieve public URL for video.");
    }

    const publicURL = data.publicUrl;

    // Fetch user to get email
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new Error("User not authenticated.");
    }

    const userEmail = userData.user.email;

    // Check if a record already exists
    const { data: existingRecord, error: checkError } = await supabase
      .from("story_generations")
      .select("*")
      .eq("user_email", userEmail)
      .eq("story", story)
      .single();

    if (checkError && checkError.code !== "PGRST116") { // PGRST116 is "not found" error
      console.error("Error checking existing record:", checkError);
      throw new Error("Failed to check existing record");
    }

    // Prepare the final video URL array
    let finalVideoUrls: string[] = [];
    if (existingRecord?.final_video_url) {
      // If there are existing URLs, add them to the array
      finalVideoUrls = [...existingRecord.final_video_url];
    }
    // Add the new URL if it's not already in the array
    if (!finalVideoUrls.includes(publicURL)) {
      finalVideoUrls.push(publicURL);
    }

    // Prepare the data with proper array handling
    const storyGenerationData: Partial<StoryGeneration> = {
      user_email: userEmail,
      story: story,
      prompt: prompt || "",
      final_video_url: finalVideoUrls,
      // Preserve other array fields from existing record
      generated_videos: existingRecord?.generated_videos || [],
      generated_images: existingRecord?.generated_images || [],
      generated_audio: existingRecord?.generated_audio || [],
      narration_lines: existingRecord?.narration_lines || [],
      image_prompts: existingRecord?.image_prompts || [],
    };

    // Perform the upsert operation
    const { data: insertData, error: insertError } = await supabase
      .from("story_generations")
      .upsert(storyGenerationData)
      .select()
      .single();

    if (insertError) {
      console.error("Error upserting story generation:", insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }

    if (!insertData) {
      throw new Error("No data returned from upsert operation");
    }

    console.log("Updated story generation:", insertData);

    // Return success response
    return NextResponse.json({ 
      videoUrl: publicURL,
      storyGeneration: insertData 
    }, { status: 200 });

  } catch (error) {
    console.error("Error uploading final video:", error);
    
    // Delete uploaded file if database operation failed
    if (filename) {
      try {
        await supabase.storage
          .from("generated-videos")
          .remove([filename]);
      } catch (removeError) {
        console.error("Error removing failed upload:", removeError);
      }
    }

    return NextResponse.json(
      {
        error: "Failed to upload final video: " +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  }
}