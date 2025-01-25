import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server"; // Ensure this import exists

// Interfaces
interface StoryRequest {
    story: string;
    prompts: string[];
}

interface OpenAIResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

interface SettingsData {
    value: string;
}

// Route handler with types
export async function POST(request: Request): Promise<NextResponse> {
    const { story, prompts }: StoryRequest = await request.json();

    if (!story || !prompts || !Array.isArray(prompts)) {
        return NextResponse.json(
            { error: "Story and prompts are required" },
            { status: 400 }
        );
    }

    const supabase = await createClient();

    const { data: settingsData, error: settingsError } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "story_length")
        .single<SettingsData>();

    let storyLength: number = 3;
    if (!settingsError && settingsData) {
        const length = parseInt(settingsData.value, 10);
        if ([3, 6, 12].includes(length)) {
            storyLength = length;
        } else if (length > 0) {
            storyLength = length;
        }
    }

    try {
        const apiKey = process.env.OPENAI_API_KEY;
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `This is a request to create a simple, clear narration script that tells a story while matching the scenes shown in each image. The narration should focus on moving the story forward rather than describing what we can already see in the visuals. Think of the narration and visuals as partners - while the images show the scene, the narration shares the story's heart, the characters' feelings, or sets the mood. Generate exactly ${storyLength} narration lines and each one should not exceed 100-120 characters (approximately 5 seconds of speaking time at natural pace). Give just the narration lines without any titles or extra text. The entire script must be exactly 1100 characters long to keep the story tight and focused. Use everyday language that's easy to understand and speak naturally, as if telling a story to a friend. The narration should feel smooth and engaging, working together with the high-quality visuals to create a complete storytelling experience. Choose words that carry meaning and emotion while keeping the language simple and clear. The story should flow easily from one line to the next, making both good sense and staying within the required length.`,
                    },
                    {
                        role: "user",
                        content: `Story: ${story}\nPrompts:\n${prompts.join("\n")}`,
                    },
                ],
                max_tokens: 1000 * storyLength,
            }),
        });

        if (!response.ok) {
            const errorData: { error: { message: string } } = await response.json();
            throw new Error(errorData.error.message || "OpenAI API Error");
        }

        const data: OpenAIResponse = await response.json();
        const scripts: string[] = data.choices[0].message.content
            .trim()
            .split("\n")
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
            .slice(0, storyLength);

        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
            throw new Error("User not authenticated.");
        }

        if (!userData.user.email) {
            throw new Error("User email is required.");
        }
        const userEmail: string = userData.user.email;

        const { error: updateError } = await supabase
            .from("story_generations")
            .update({
                narration_lines: scripts,
            })
            .eq("user_email", userEmail)
            .eq("story", story);

        if (updateError) {
            console.error("Error saving narration lines:", updateError.message);
            throw new Error("Failed to save narration lines.");
        }

        return NextResponse.json({ scripts }, { status: 200 });
    } catch (error) {
        console.error("Error generating narration scripts:", error);
        return NextResponse.json(
            { error: "Failed to generate narration scripts: " + (error as Error).message },
            { status: 500 }
        );
    }
}
