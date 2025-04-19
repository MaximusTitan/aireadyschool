import { NextResponse } from "next/server";
import RunwayML from "@runwayml/sdk";
import { createClient } from "@/utils/supabase/server";

interface VideoScene {
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

const createSafePrompt = (motion: string, camera: string) => {
    const cleanMotion = motion
        .toLowerCase()
        .replace(/\b(fight|battle|explosion|weapon|blood|violent|death|kill|attack)\b/g, 'move')
        .replace(/[^\w\s,.]/g, ' ')
        .trim();

    // Create a more natural, cinematic prompt
    return `Natural cinematic movement: ${cleanMotion}. Camera: ${camera}. 
    Style: Smooth professional cinematography with gentle motion and natural transitions.`
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 200);
};

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

        if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
            return NextResponse.json(
                { message: "Valid scenes array is required" },
                { status: 400 }
            );
        }

        const supabaseClient = await supabase;
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const scene = scenes[0];
        if (!scene.imageUrl) {
            return NextResponse.json(
                { message: "Scene image URL is required" },
                { status: 400 }
            );
        }

        const safePrompt = createSafePrompt(
            scene.videoMotion || '',
            scene.cameraMovement || 'steady'
        );

        console.log('Safe video prompt:', safePrompt);

        const client = new RunwayML({ apiKey: process.env.RUNWAYML_API_SECRET });

        const imageToVideo = await client.imageToVideo.create({
            model: "gen3a_turbo",
            promptImage: scene.imageUrl,
            promptText: safePrompt,
            duration: 5,
            watermark: false,
            ratio: "1280:768",
        });

        const taskId = imageToVideo.id;
        const pollInterval = 5000;
        const maxAttempts = 60;
        let attempts = 0;

        while (attempts < maxAttempts) {
            const taskResponse: TaskResponse = await client.tasks.retrieve(taskId);

            switch (taskResponse.status) {
                case "SUCCEEDED":
                    if (!taskResponse.output?.[0]) {
                        throw new Error("No output URL in successful response");
                    }

                    const videoUrl = taskResponse.output[0];
                    const response = await fetch(videoUrl);
                    const videoBlob = await response.blob();

                    const timestamp = Date.now();
                    const filename = `story_${story?.id || 'temp'}_scene_${scene.id}_${timestamp}.mp4`;

                    const { error: uploadError } = await supabaseClient
                        .storage
                        .from('story-videos')
                        .upload(filename, videoBlob, {
                            contentType: 'video/mp4',
                            cacheControl: '3600',
                            upsert: true
                        });

                    if (uploadError) throw new Error('Failed to upload video');

                    const { data: { publicUrl } } = supabaseClient
                        .storage
                        .from('story-videos')
                        .getPublicUrl(filename);

                    return NextResponse.json({
                        success: true,
                        videoUrl: publicUrl,
                        sceneId: scene.id
                    });

                case "FAILED":
                    return NextResponse.json(
                        {
                            success: false,
                            message: "Video generation failed",
                            error: taskResponse.failure
                        },
                        { status: 500 }
                    );

                case "RUNNING":
                case "THROTTLED":
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                    break;

                default:
                    console.warn(`Unexpected status: ${taskResponse.status}`);
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
            }

            attempts++;
        }

        throw new Error("Processing timeout");

    } catch (error: any) {
        console.error("Error in video processing:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Video processing failed",
                error: error.message
            },
            { status: 500 }
        );
    }
}
