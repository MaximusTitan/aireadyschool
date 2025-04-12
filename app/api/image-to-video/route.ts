import { NextResponse } from "next/server";
import RunwayML from "@runwayml/sdk";
import { createClient } from "@/utils/supabase/server";

interface ImageToVideoRequest {
    prompt: string;
    imageUrl: string;
}

interface TaskResponse {
    status: string;
    progress?: number;
    failure?: string;
    failureCode?: string;
    output?: string[];
}

export async function POST(request: Request): Promise<NextResponse> {
    const supabase = createClient();

    if (!process.env.RUNWAYML_API_SECRET) {
        console.error("RUNWAYML_API_SECRET is not configured");
        return NextResponse.json(
            { message: "Server configuration error" },
            { status: 500 }
        );
    }

    try {
        const { scenes, story } = await request.json();
  
        if (!scenes || scenes.length === 0 || !scenes[0].prompt) {
            return NextResponse.json(
                { message: "Scene description and prompt are required" },
                { status: 400 }
            );
        }

        const scene = scenes[0]; // We're processing one scene at a time

        const supabaseClient = await supabase;
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const client = new RunwayML({ apiKey: process.env.RUNWAYML_API_SECRET });

        // Store initial record with temporary URL
        const { data: videoRecord, error: insertError } = await (await supabase)
            .from('generated_videos')
            .insert({
                user_id: user.id,
                input_text: scene.prompt,
                image_url: scene.imageUrl,
                video_url: `pending_${Date.now()}`,
                status: 'processing',
                duration: 5
            })
            .select()
            .single();

        if (insertError) throw insertError;

        const imageToVideo = await client.imageToVideo.create({
            model: "gen3a_turbo",
            promptImage: scene.imageUrl,
            promptText: scene.prompt,
            duration: 5,
            watermark: false,
            ratio: "1280:768",
        });

        const taskId = imageToVideo.id;
        const pollInterval = 5000;
        const maxAttempts = 60; // 5 minutes maximum
        let attempts = 0;

        while (attempts < maxAttempts) {
            const taskResponse: TaskResponse = await client.tasks.retrieve(taskId);

            switch (taskResponse.status) {
                case "SUCCEEDED":
                    if (!taskResponse.output?.[0]) {
                        // Update record with failed status if no output
                        await (await supabase)
                            .from('generated_videos')
                            .update({
                                status: 'failed',
                                video_url: 'failed_generation' // Update with failed status URL
                            })
                            .eq('id', videoRecord.id);
                            
                        throw new Error("No output URL in successful response");
                    }
                    const videoUrl = taskResponse.output[0];
                    
                    // Upload to Supabase Storage
                    const response = await fetch(videoUrl);
                    const videoBlob = await response.blob();
                    const filename = `${videoRecord.id}.mp4`;

                    const { data: uploadData, error: uploadError } = await (await supabase)
                        .storage
                        .from('videos')
                        .upload(filename, videoBlob);

                    if (uploadError) throw uploadError;

                    // Get public URL
                    const { data: { publicUrl } } = (await supabase)
                        .storage
                        .from('videos')
                        .getPublicUrl(filename);

                    // Update record with completed status and video URL
                    const { error: updateError } = await (await supabase)
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

                case "FAILED":
                    // Update record with failed status
                    await (await supabase)
                        .from('generated_videos')
                        .update({
                            status: 'failed',
                            video_url: 'failed_generation' // Update with failed status URL
                        })
                        .eq('id', videoRecord.id);

                    console.error("Task failed:", {
                        failure: taskResponse.failure,
                        code: taskResponse.failureCode
                    });

                    return NextResponse.json(
                        {
                            message: "Video generation failed",
                            error: taskResponse.failure,
                            code: taskResponse.failureCode,
                        },
                        { status: 500 }
                    );

                case "THROTTLED":
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                    break;

                case "RUNNING":
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                    break;

                default:
                    console.warn(`Unexpected status: ${taskResponse.status}`);
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
            }

            attempts++;
        }

        // If we timeout, update the record
        await (await supabase)
            .from('generated_videos')
            .update({
                status: 'failed',
                video_url: 'timeout_failure' // Update with timeout status URL
            })
            .eq('id', videoRecord.id);

        throw new Error("Task timed out");

    } catch (error: any) {
        console.error("Error in video generation:", error);
        
        // More specific error handling
        if (error.response?.status === 413) {
            return NextResponse.json(
                { message: "Image file size too large" },
                { status: 413 }
            );
        }

        if (error.code === "ECONNREFUSED") {
            return NextResponse.json(
                { message: "Failed to connect to Runway API" },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { 
                message: "Video generation failed",
                error: error.message
            },
            { status: 500 }
        );
    }
}