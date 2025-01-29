import { NextResponse } from "next/server";
import RunwayML from "@runwayml/sdk";
import { createClient } from "@/utils/supabase/server";

// Define interfaces
interface RequestBody {
    prompt: string;
    imageUrl: string;
    story?: string;
}

interface UserData {
    video_credits: number;
}

interface RunwayParams {
    model: "gen3a_turbo";
    promptImage: string;
    promptText: string;
    duration: 5 | 10;
    watermark: boolean;
    ratio: "1280:768" | "768:1280";
}

interface TaskResponse {
    id: string;
    status: 'THROTTLED' | 'RUNNING' | 'FAILED' | 'SUCCEEDED' | 'PENDING' | 'CANCELLED';
    progress?: number;
    failure?: string;
    failureCode?: string;
    output?: string[];
}

interface GenerationRecord {
    user_id: string;
    type: string;
    user_email: string;
    parameters: {
        prompt: string;
        imageUrl: string;
    };
    result_path: string;
    credits_used: number;
}

interface StoryGenerationData {
    generated_videos: string[];
}

interface RunwayMLError {
    error: string;
    status?: number;
}

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const { prompt, imageUrl, story } = await request.json() as RequestBody;

        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            console.error(
                "User authentication failed:",
                userError?.message || "No user found"
            );
            return NextResponse.json(
                {
                    message: "User not authenticated",
                    error: userError?.message || "No user found",
                },
                { status: 403 }
            );
        }

        const userId: string = user.id;
        if (!user.email) throw new Error("User email is required");
        const userEmail: string = user.email;

        if (!prompt || !imageUrl) {
            console.error("Validation error: Prompt and image URL are required.");
            return NextResponse.json(
                { message: "Prompt and image URL are required" },
                { status: 400 }
            );
        }

        const { data: userData, error: userCreditsError } = await supabase
            .from("users")
            .select("video_credits")
            .eq("id", userId)
            .single<UserData>();

        if (userCreditsError || !userData) {
            console.error(
                "Error fetching user data:",
                userCreditsError?.message || "No user data found"
            );
            return NextResponse.json(
                {
                    message: "Error fetching user data",
                    error: userCreditsError?.message || "No user data found",
                },
                { status: 500 }
            );
        }

        const userVideoCredits: number = userData.video_credits;
        const creditsRequired: number = 5;

        if (userVideoCredits < creditsRequired) {
            console.warn("Not enough video credits.");
            return NextResponse.json(
                { message: "Not enough credits" },
                { status: 403 }
            );
        }

        const client = new RunwayML({ apiKey: process.env.RUNWAYML_API_SECRET });

        const params: RunwayParams = {
            model: "gen3a_turbo",
            promptImage: imageUrl,
            promptText: prompt,
            duration: 5,
            watermark: false,
            ratio: "1280:768",
        };

        const imageToVideo = await client.imageToVideo
            .create(params)
            .catch((err: Error) => {
                console.error("RunwayML API Error:", err);
                try {
                    // Parse the error message which is in JSON format
                    const errorBody = JSON.parse(err.message.split(' ')[1]) as RunwayMLError;
                    return NextResponse.json(
                        {
                            message: "RunwayML API Error",
                            error: errorBody.error,
                            details: "Please check your RunwayML credits"
                        },
                        { status: 400 }
                    );
                } catch {
                    // If we can't parse the error, return the original error
                    return NextResponse.json(
                        {
                            message: "RunwayML API Error",
                            error: err.message
                        },
                        { status: 500 }
                    );
                }
            });

        if (!imageToVideo || imageToVideo instanceof Response) {
            // If imageToVideo is a Response, it means we caught an error
            return imageToVideo || NextResponse.json(
                {
                    message: "Failed to generate video",
                    error: "Invalid response from RunwayML"
                },
                { status: 500 }
            );
        }

        const taskId: string = imageToVideo.id;

        const pollInterval: number = 5000;
        let taskStatus: string, taskResponse: TaskResponse;

        do {
            taskResponse = await client.tasks.retrieve(taskId);
            taskStatus = taskResponse.status;

            if (taskStatus === "THROTTLED") {
                console.log("Task is throttled. Retrying in 5 seconds...");
                await new Promise((resolve) => setTimeout(resolve, pollInterval));
            } else if (taskStatus === "RUNNING") {
                console.log(
                    `Task is running... Progress: ${taskResponse.progress! * 100}%`
                );
                await new Promise((resolve) => setTimeout(resolve, pollInterval));
            } else if (taskStatus === "FAILED") {
                console.error(
                    `Task failed: ${taskResponse.failure} (Code: ${taskResponse.failureCode})`
                );
                return NextResponse.json(
                    {
                        message: "Video generation failed",
                        error: taskResponse.failure,
                        code: taskResponse.failureCode,
                    },
                    { status: 500 }
                );
            }
        } while (taskStatus !== "SUCCEEDED");

        const videoUrl: string = taskResponse.output![0];

        const response = await fetch(videoUrl);
        const videoBlob: Blob = await response.blob();

        const videoFileName: string = `generated_video_${userId}_${Date.now()}.mp4`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("generated-videos")
            .upload(videoFileName, videoBlob, { cacheControl: "3600", upsert: true });

        if (uploadError) {
            console.error("Error uploading video to Supabase:", uploadError.message);
            return NextResponse.json(
                {
                    message: "Error uploading video to Supabase",
                    error: uploadError.message,
                },
                { status: 500 }
            );
        }

        const publicUrl: string = supabase.storage
            .from("generated-videos")
            .getPublicUrl(videoFileName).data.publicUrl;

        const { error: deductError } = await supabase
            .from("users")
            .update({ video_credits: userVideoCredits - creditsRequired })
            .eq("id", userId);

        if (deductError) {
            console.error("Error updating video credits:", deductError.message);
            return NextResponse.json(
                { message: "Error updating video credits", error: deductError.message },
                { status: 500 }
            );
        }

        const generationRecord: GenerationRecord = {
            user_id: userId,
            type: "video",
            user_email: userEmail,
            parameters: { prompt, imageUrl },
            result_path: publicUrl,
            credits_used: creditsRequired,
        };

        const { error: insertError } = await supabase
            .from("generations")
            .insert([generationRecord]);

        if (insertError) {
            console.error("Error saving generation record:", insertError.message);
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
                .select("generated_videos")
                .eq("user_email", userEmail)
                .eq("story", story)
                .single<StoryGenerationData>();

            if (fetchError) {
                console.error(
                    "Error fetching current generated_videos:",
                    fetchError.message
                );
                throw new Error("Failed to fetch current generated_videos.");
            }

            const existingVideos: string[] = currentData.generated_videos || [];
            const updatedVideos: string[] = [...existingVideos, publicUrl];

            const { error: updateError } = await supabase
                .from("story_generations")
                .update({
                    generated_videos: updatedVideos,
                })
                .eq("user_email", userEmail)
                .eq("story", story);

            if (updateError) {
                console.error("Error updating generated videos:", updateError.message);
            }
        }

        return NextResponse.json({ videoUrl: publicUrl });
    } catch (error) {
        console.error("Error generating or fetching video:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return NextResponse.json(
            { 
                message: "Error generating video", 
                error: errorMessage
            },
            { status: 500 }
        );
    }
}
