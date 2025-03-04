import { textToSpeech } from "../../../tools/tts/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  return textToSpeech(request);
}
