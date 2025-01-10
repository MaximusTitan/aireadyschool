"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Square, Play } from "lucide-react";
import type {
  AudioRecorderRef,
  AudioChunksRef,
  TranscriptionResponse,
  ChatResponse,
} from "./types/index";

export default function VoiceChat(): JSX.Element {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startRecording = async (): Promise<void> => {
    try {
      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event: BlobEvent): void => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async (): Promise<void> => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
        await processAudio(audioBlob);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = (): void => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob): Promise<void> => {
    setIsProcessing(true);
    try {
      // Convert audio to text
      const formData = new FormData();
      formData.append("audio", audioBlob);

      const transcriptResponse = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const { text, error: transcriptError }: TranscriptionResponse =
        await transcriptResponse.json();
      if (transcriptError) throw new Error(transcriptError);
      setTranscript(text);

      // Get ChatGPT response
      const aiResponse = await fetch("/api/chat-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const { response: aiText, error: chatError }: ChatResponse =
        await aiResponse.json();
      if (chatError) throw new Error(chatError);
      setResponse(aiText);

      // Convert response to speech
      const audioResponse = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      });

      if (!audioResponse.ok) {
        throw new Error("Failed to generate speech");
      }

      const responseAudioBlob = await audioResponse.blob();
      const url = URL.createObjectURL(responseAudioBlob);
      setAudioUrl(url);
    } catch (error) {
      console.error(
        "Error processing audio:",
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudioResponse = (): void => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio
        .play()
        .catch((error) => console.error("Error playing audio:", error));
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-center gap-4">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              variant={isRecording ? "destructive" : "default"}
              type="button"
            >
              {isRecording ? (
                <Square className="mr-2" />
              ) : (
                <Mic className="mr-2" />
              )}
              {isRecording ? "Stop Recording" : "Start Recording"}
            </Button>

            <Button
              onClick={playAudioResponse}
              disabled={!audioUrl}
              variant="outline"
              type="button"
            >
              <Play className="mr-2" />
              Play Response
            </Button>
          </div>

          {transcript && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Your Message:</h3>
              <p className="text-gray-700">{transcript}</p>
            </div>
          )}

          {response && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">AI Response:</h3>
              <p className="text-gray-700">{response}</p>
            </div>
          )}

          {isProcessing && (
            <div className="text-center text-gray-500">
              Processing your message...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
