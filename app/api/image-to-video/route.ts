import { NextResponse } from "next/server";
import RunwayML from "@runwayml/sdk";

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
    if (!process.env.RUNWAYML_API_SECRET) {
        console.error("RUNWAYML_API_SECRET is not configured");
        return NextResponse.json(
            { message: "Server configuration error" },
            { status: 500 }
        );
    }

    try {
        const { prompt, imageUrl }: ImageToVideoRequest = await request.json();

        if (!prompt || !imageUrl) {
            return NextResponse.json(
                { message: "Prompt and image URL are required" },
                { status: 400 }
            );
        }

        // Validate base64 image
        if (!imageUrl.startsWith('data:image/')) {
            return NextResponse.json(
                { message: "Invalid image format. Please provide a valid image." },
                { status: 400 }
            );
        }

        const client = new RunwayML({ apiKey: process.env.RUNWAYML_API_SECRET });

        const imageToVideo = await client.imageToVideo.create({
            model: "gen3a_turbo",
            promptImage: imageUrl,
            promptText: prompt,
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
            console.log(`Task status: ${taskResponse.status}, Progress: ${taskResponse.progress}`);

            switch (taskResponse.status) {
                case "SUCCEEDED":
                    if (!taskResponse.output?.[0]) {
                        throw new Error("No output URL in successful response");
                    }
                    return NextResponse.json({ videoUrl: taskResponse.output[0] });

                case "FAILED":
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
                    console.log("Task throttled, waiting...");
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                    break;

                case "RUNNING":
                    console.log(`Progress: ${(taskResponse.progress ?? 0) * 100}%`);
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                    break;

                default:
                    console.warn(`Unexpected status: ${taskResponse.status}`);
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
            }

            attempts++;
        }

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