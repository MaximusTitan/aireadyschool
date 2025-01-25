import { NextResponse } from "next/server";
import * as fal from "@fal-ai/serverless-client";
import { createClient } from "@/utils/supabase/server";

fal.config({
  credentials: process.env.FAL_KEY,
});

// Interfaces
interface FalImage {
    url: string;
}

interface FalResult {
    images: FalImage[];
}

interface FalInput {
    prompt: string;
    image_size: string;
    num_inference_steps: number;
    num_images: number;
    enable_safety_checker: boolean;
}

interface RequestBody {
    prompt: string;
    image_size?: string;
    num_inference_steps?: number;
    num_images?: number;
    story?: string;
}

interface UserData {
    image_credits: number;
}

interface GenerationRecord {
    user_id: string;
    user_email: string;
    type: string;
    parameters: {
        prompt: string;
        image_size?: string;
        num_inference_steps?: number;
        num_images?: number;
    };
    result_path: string;
    credits_used: number;
}

interface StoryGenerationData {
    generated_images: string[];
}

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const body: RequestBody = await request.json();
        const { prompt, image_size, num_inference_steps, num_images, story } = body;

        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                {
                    message: "User not authenticated",
                    error: userError ? userError.message : "No user found",
                },
                { status: 403 }
            );
        }

        const userId: string = user.id;
        const userEmail: string = user.email ?? (() => { throw new Error('User email is required') })();

        if (!prompt) {
            return NextResponse.json(
                { message: "Prompt is required" },
                { status: 400 }
            );
        }

        const creditsUsed: number = 1;
        const { data: userData, error: userCreditsError } = await supabase
            .from("users")
            .select("image_credits")
            .eq("id", userId)
            .limit(1)
            .returns<UserData[]>();

        if (userCreditsError || !userData || userData.length === 0) {
            return NextResponse.json(
                {
                    message: "Error fetching user data",
                    error: userCreditsError
                        ? userCreditsError.message
                        : "No user data found",
                },
                { status: 500 }
            );
        }

        const userImageCredits: number = userData[0].image_credits;
        if (userImageCredits < creditsUsed) {
            return NextResponse.json(
                { message: "Not enough image credits" },
                { status: 403 }
            );
        }

        const result = await fal.subscribe<FalInput, FalResult>("fal-ai/flux/schnell", {
            input: {
                prompt,
                image_size: image_size || "landscape_16_9",
                num_inference_steps: num_inference_steps || 4,
                num_images: num_images || 1,
                enable_safety_checker: true,
            },
            logs: true,
            onQueueUpdate: (status) => {
                if (status.status === "IN_PROGRESS" && 'logs' in status) {
                    const queueStatus = status as { logs: { message: string }[] };
                    queueStatus.logs.map((log) => log.message).forEach(console.log);
                }
            },
        });

        if (!result || !result.images || result.images.length === 0) {
            return NextResponse.json(
                { message: "Image URL not found" },
                { status: 404 }
            );
        }

        const imageUrl: string = result.images[0].url;

        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error("Failed to fetch the image from the generated URL");
        }

        const imageBlob: Blob = await imageResponse.blob();

        const fileName: string = `generated-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
            .from("generated-images")
            .upload(fileName, imageBlob, {
                contentType: "image/jpeg",
            });

        if (uploadError) {
            console.error("Upload error:", uploadError.message);
            return NextResponse.json(
                { message: "Error uploading image", error: uploadError.message },
                { status: 500 }
            );
        }

        const { data: publicUrlData } = supabase.storage
            .from("generated-images")
            .getPublicUrl(fileName);

        const publicURL: string = publicUrlData.publicUrl;

        if (!publicURL) {
            return NextResponse.json(
                { message: "Error getting public URL", error: "Public URL is null" },
                { status: 500 }
            );
        }

        const { error: deductError } = await supabase
            .from("users")
            .update({ image_credits: userImageCredits - creditsUsed })
            .eq("id", userId);

        if (deductError) {
            return NextResponse.json(
                { message: "Error updating image credits", error: deductError.message },
                { status: 500 }
            );
        }

        const generationRecord: GenerationRecord = {
            user_id: userId,
            user_email: userEmail,
            type: "image",
            parameters: { prompt, image_size, num_inference_steps, num_images },
            result_path: publicURL,
            credits_used: creditsUsed,
        };

        const { error: insertError } = await supabase
            .from("generations")
            .insert([generationRecord]);

        if (insertError) {
            return NextResponse.json(
                {
                    message: "Error saving generation record",
                    error: insertError.message,
                },
                { status: 500 }
            );
        }

        if (story) {
            const { data: currentData, error: fetchError } = await supabase
                .from("story_generations")
                .select<string, StoryGenerationData>("generated_images")
                .eq("user_email", userEmail)
                .eq("story", story)
                .single();

            if (fetchError) {
                console.error(
                    "Error fetching current generated_images:",
                    fetchError.message
                );
                throw new Error("Failed to fetch current generated_images.");
            }

            const existingImages: string[] = currentData.generated_images || [];
            const updatedImages: string[] = [...existingImages, publicURL];

            const { error: updateError } = await supabase
                .from("story_generations")
                .update({
                    generated_images: updatedImages,
                })
                .eq("user_email", userEmail)
                .eq("story", story);

            if (updateError) {
                console.error("Error updating generated images:", updateError.message);
            }
        }

        return NextResponse.json({ imageUrl: publicURL });
    } catch (error) {
        console.error("Internal Server Error:", error);
        return NextResponse.json(
            {
                message: "Internal Server Error",
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
