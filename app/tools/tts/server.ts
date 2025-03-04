import { NextRequest, NextResponse } from "next/server";

const ELEVENLABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

export interface Voice {
  voice_id: string;
  name: string;
  preview_url: string;
  category: string;
  labels: {
    accent?: string;
    description?: string;
    age?: string;
    gender?: string;
    use_case?: string;
  };
}

export interface TextToSpeechRequest {
  text: string;
  voiceId: string;
  model?: string;
  voice_settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
    speed?: number;
  };
  language_code?: string;
}

export async function getVoices() {
  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      method: "GET",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY || "",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching voices: ${response.statusText}`);
    }

    const data = await response.json();
    // We'll filter cloned voices on the client side for more flexibility
    return data.voices as Voice[];
  } catch (error) {
    console.error("Failed to fetch voices:", error);
    throw error;
  }
}

export async function textToSpeech(req: NextRequest) {
  try {
    const { 
      text, 
      voiceId, 
      model = "eleven_multilingual_v2",
      voice_settings,
      language_code 
    } = await req.json() as TextToSpeechRequest;

    if (!text || !voiceId) {
      return NextResponse.json({ error: "Text and voiceId are required" }, { status: 400 });
    }

    const requestData: any = {
      text,
      model_id: model,
      output_format: "mp3_44100_128",
    };

    // Add optional parameters if they exist
    if (voice_settings) {
      requestData.voice_settings = voice_settings;
    }

    if (language_code) {
      requestData.language_code = language_code;
    }

    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", errorText);
      return NextResponse.json(
        { error: `Error generating speech: ${errorText}` },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to generate speech:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}
