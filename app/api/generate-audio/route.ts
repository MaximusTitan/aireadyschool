import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface RequestBody {
    script: string;  // Changed from text to script
    sceneId: string; // Added sceneId
}

interface ElevenLabsError {
    error: string;
}

interface StorageResponse {
    publicUrl: string;
}

interface StoryGenerationRecord {
    generated_audio: string[];
    user_email: string;
    story: string;
}

export async function POST(request: Request): Promise<NextResponse> {
    const { script, sceneId }: RequestBody = await request.json();

    if (!script || !sceneId) {
        return NextResponse.json(
            { error: "Script and sceneId are required" },
            { status: 400 }
        );
    }

    const supabase = await createClient();

    try {
        const apiKey: string = process.env.ELEVENLABS_API_KEY!;
        const voiceId: string = "9BWtsMINqrJLrRacOk9x";

        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": apiKey,
                },
                body: JSON.stringify({
                    text: script,
                }),
            }
        );

        if (!response.ok) {
            const errorData: ElevenLabsError = await response.json();
            throw new Error(errorData.error || "ElevenLabs API Error");
        }

        const audioBlob: Blob = await response.blob();
        const timestamp: number = Date.now();
        const filename: string = `scene_${sceneId}_${timestamp}.mp3`;

        console.log('Attempting to upload audio file:', filename);
        
        // Upload to storage with more detailed error handling
        const { data: uploadData, error: uploadError } = await (await supabase).storage
            .from('audio')
            .upload(filename, audioBlob, {
                contentType: 'audio/mpeg',
                upsert: true,
                cacheControl: '3600'
            });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            throw new Error(`Failed to upload audio: ${uploadError.message}`);
        }

        console.log('Audio upload successful, getting public URL');

        // Get public URL with proper error handling
        const { data: urlData } = await (await supabase).storage
            .from('audio')
            .getPublicUrl(filename);

        if (!urlData?.publicUrl) {
            throw new Error('Failed to get public URL for uploaded audio');
        }

        const publicURL = urlData.publicUrl;
        console.log('Generated public URL:', publicURL);

        // Database operation with proper error handling
        const { error: dbError } = await (await supabase)
            .from('scene_audio')
            .upsert({
                scene_id: sceneId,
                audio_url: publicURL,
                script: script,
                updated_at: new Date().toISOString()
            });

        if (dbError) {
            // Cleanup on db error
            await supabase.storage.from("audio").remove([filename]);
            throw new Error("Failed to save audio to database");
        }

        return NextResponse.json({ audioUrl: publicURL }, { status: 200 });
    } catch (error) {
        console.error("Error generating audio:", error);
        return NextResponse.json(
            {
                error: "Failed to generate audio: " +
                    (error instanceof Error ? error.message : error),
            },
            { status: 500 }
        );
    }
}