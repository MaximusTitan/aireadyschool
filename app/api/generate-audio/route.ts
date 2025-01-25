import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server"; // Ensure this import exists

// Define interfaces
interface RequestBody {
    text: string;
    story: string;
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
    const { text, story }: RequestBody = await request.json();

    if (!text || !story) {
        return NextResponse.json(
            { error: "Text and story are required" },
            { status: 400 }
        );
    }

    const supabase = await createClient();

    try {
        const apiKey: string = process.env.ELEVEN_LABS_API_KEY!;
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
                    text: text,
                }),
            }
        );

        if (!response.ok) {
            const errorData: ElevenLabsError = await response.json();
            throw new Error(errorData.error || "ElevenLabs API Error");
        }

        const audioBlob: Blob = await response.blob();

        const timestamp: number = Date.now();
        const filename: string = `audio_${timestamp}.mp3`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("generated-audio")
            .upload(filename, audioBlob, {
                cacheControl: "3600",
                upsert: false,
                contentType: "audio/mpeg",
            });

        if (uploadError) {
            console.error("Error uploading audio to storage:", uploadError.message);
            throw new Error("Failed to upload audio to storage.");
        }

        const { data } = supabase.storage
            .from("generated-audio")
            .getPublicUrl(filename);

        if (!data.publicUrl) {
            console.error(
                "Error getting public URL:",
                "publicUrl is undefined"
            );
            throw new Error("Failed to retrieve public URL for audio.");
        }

        const publicURL: string = data.publicUrl;

        console.log("Public URL obtained:", publicURL);

        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
            throw new Error("User not authenticated.");
        }

        const userEmail: string = userData.user.email!;

        const { data: currentData, error: fetchError } = await supabase
            .from("story_generations")
            .select("generated_audio")
            .eq("user_email", userEmail)
            .eq("story", story)
            .single();

        if (fetchError) {
            console.error(
                "Error fetching current generated_audio:",
                fetchError.message
            );
            throw new Error("Failed to fetch current generated_audio.");
        }

        const existingAudio: string[] = currentData.generated_audio
            ? currentData.generated_audio.filter((url: string | null) => url !== null)
            : [];

        const updatedAudio: string[] = [...existingAudio, publicURL];

        console.log("Updated generated_audio:", updatedAudio);

        if (story) {
            const { data: currentData, error: fetchError } = await supabase
                .from("story_generations")
                .select("generated_audio")
                .eq("user_email", userEmail)
                .eq("story", story)
                .single();

            if (fetchError) {
                console.error(
                    "Error fetching current generated_audio:",
                    fetchError.message
                );
                throw new Error("Failed to fetch current generated_audio.");
            }

            const existingAudio: string[] = currentData.generated_audio || [];
            const updatedAudio: string[] = [...existingAudio, publicURL];

            const { error: updateError } = await supabase
                .from("story_generations")
                .update({
                    generated_audio: updatedAudio,
                })
                .eq("user_email", userEmail)
                .eq("story", story);

            if (updateError) {
                console.error("Error updating generated audio:", updateError.message);
            }
        }

        return NextResponse.json({ audioUrl: publicURL }, { status: 200 });
    } catch (error) {
        console.error("Error generating audio:", error);
        return NextResponse.json(
            {
                error:
                    "Failed to generate audio: " +
                    (error instanceof Error ? error.message : error),
            },
            { status: 500 }
        );
    }
}
