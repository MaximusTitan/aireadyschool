"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Square, Play, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  AudioRecorderRef,
  AudioChunksRef,
  TranscriptionResponse,
  ChatResponse,
} from "./types/index";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { useChat } from "ai/react";

const TOOL_ROUTES = {
  presentation: "/tools/presentation",
  "lesson-planner": "/tools/lesson-planner",
  "comic-generator": "/tools/comic-generator",
  "chat-with-docs": "/tools/chat-with-docs",
  "image-generator": "/tools/image-generator",
  "video-generator": "/tools/video-generator",
  "text-tools": "/tools/text-tools",
  "mcq-generator": "/tools/mcq-generator",
  "youtube-assistant": "/tools/youtube-assistant",
  audiobot: "/tools/audiobot",
  "personalized-lessons": "/tools/personalized-lessons",
  "research-assistant": "/tools/research-assistant",
  "study-planner": "/tools/study-planner",
  evaluator: "/tools/evaluator",
  "project-helper": "/tools/project-helper",
  "individualized-education-planner": "/tools/individualized-education-planner",
  "marketing-content-generator": "/tools/marketing-content-generator",
  "report-generator": "/tools/report-generator",
  "school-intelligence": "/tools/school-intelligence",
};

export default function VoiceChat(): JSX.Element {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [hasPlayed, setHasPlayed] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string>("");
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { messages, append, isLoading, error } = useChat({
    api: "/api/chat-voice",
    onResponse: (response) => {},
    onFinish: (message) => {
      if (message.toolInvocations && message.toolInvocations.length > 0) {
        const toolInvocation = message.toolInvocations[0];

        if (toolInvocation.state === "call" && toolInvocation.toolName) {
          const redirectUrl =
            TOOL_ROUTES[toolInvocation.toolName as keyof typeof TOOL_ROUTES];
          if (redirectUrl) {
            router.push(redirectUrl);
          }
        }
      }

      // Process the response for text-to-speech and image generation
      processAIResponse(message.content);
    },
    onError: (error) => {
      console.error("Chat error:", {
        message: error.message,
        cause: error.cause,
        stack: error.stack,
      });
    },
  });

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

      // Send transcribed text to chat
      await append({
        role: "user",
        content: text,
      });
    } catch (error) {
      console.error(
        "Error processing audio:",
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const processAIResponse = async (aiText: string): Promise<void> => {
    try {
      const sanitizedText = aiText.replace(/\*/g, ""); // Remove asterisks

      // Convert response to speech
      const audioResponse = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sanitizedText }),
      });

      if (!audioResponse.ok) {
        throw new Error("Failed to generate speech");
      }

      const responseAudioBlob = await audioResponse.blob();
      const url = URL.createObjectURL(responseAudioBlob);
      setAudioUrl(url);

      // Generate image based on AI response
      await generateImage(aiText);
    } catch (error) {
      console.error("Error processing AI response:", error);
    }
  };

  const generateImage = async (prompt: string): Promise<void> => {
    setIsImageLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          image_size: "square",
          num_inference_steps: 4,
          num_images: 1,
          enable_safety_checker: true,
        }),
      });

      const data = await response.json();
      if (data.images?.[0]?.url) {
        setGeneratedImage(data.images[0].url);
      }
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setIsImageLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem("message") as HTMLInputElement;
    const message = input.value.trim();

    if (!message) return;

    input.value = "";

    await append({
      role: "user",
      content: message,
    });
  };

  const playAudioResponse = (): void => {
    if (!audioRef.current) return;
    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsAudioPlaying(true);
          setHasPlayed(true);
        })
        .catch((error) => console.error("Error playing audio:", error));
      audioRef.current.onended = () => setIsAudioPlaying(false);
    }
  };

  useEffect(() => {
    if (audioUrl) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsAudioPlaying(false);
    }
  }, [audioUrl]);

  useEffect(() => {
    if (
      audioUrl &&
      messages.length > 0 &&
      messages[messages.length - 1].role === "assistant"
    ) {
      playAudioResponse();
    }
  }, [audioUrl, messages]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto flex flex-col min-h-[30rem] h-auto">
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <div className="w-full md:w-3/5 p-4 overflow-y-auto border-r md:border-r-2">
          {/* Scrollable Chat History */}
          {messages.map((m, index) => (
            <div
              key={index}
              className={`mb-2 ${
                m.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <span
                className={`inline-block px-3 py-2 rounded ${
                  m.role === "user"
                    ? "bg-rose-500 text-white"
                    : "bg-gray-300 text-gray-800"
                }`}
              >
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </span>
              {m.role === "assistant" &&
                index === messages.length - 1 &&
                audioUrl && (
                  <Button
                    onClick={playAudioResponse}
                    className="ml-2"
                    variant="outline"
                    type="button"
                  >
                    {isAudioPlaying ? (
                      <>
                        <Square className="mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-2" />
                        {hasPlayed ? "Replay" : "Play"}
                      </>
                    )}
                  </Button>
                )}
            </div>
          ))}
        </div>
        <div className="w-full md:w-2/5 p-4">
          <div className="flex flex-col items-center space-y-4">
            {/* Generated Image Container */}
            {isImageLoading ? (
              <Skeleton className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100" />
            ) : generatedImage ? (
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                {/* Placeholder to prevent layout change */}
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span></span>
                </div>
              </div>
            )}

            {/* Avatar Container */}
            <div className="w-full aspect-square flex items-center justify-center rounded-lg">
              {isProcessing || isLoading ? (
                <img
                  src="https://wdfrtqeljulkoqnllxad.supabase.co/storage/v1/object/public/generated-images/images/O-Thinking.gif"
                  alt="Loading"
                  className="w-full h-full object-cover"
                />
              ) : isAudioPlaying ? (
                <img
                  src="https://wdfrtqeljulkoqnllxad.supabase.co/storage/v1/object/public/generated-videos/o-talking-small.gif"
                  alt="Audio Playing"
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src="https://wdfrtqeljulkoqnllxad.supabase.co/storage/v1/object/public/generated-images/o-constant.gif"
                  alt="Idle"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 border-t flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-4">
        {/* Voice Input and Play Buttons */}
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing || isLoading}
          variant={isRecording ? "destructive" : "default"}
          type="button"
          className="w-full md:w-auto"
        >
          {isRecording ? <Square className="mr-2" /> : <Mic className="mr-2" />}
          {isRecording ? "Stop Talking" : "Talk to Buddy"}
        </Button>
        {/* Add loading indicator */}
        {(isProcessing || isLoading) && <Loader2 className="animate-spin" />}
        <form onSubmit={handleSubmit} className="flex w-full md:w-auto gap-2">
          <input
            type="text"
            name="message"
            placeholder="Type your message"
            className="w-full max-w-md border p-2 rounded"
            disabled={isProcessing || isLoading}
          />
          <Button
            type="submit"
            disabled={isProcessing || isLoading}
            variant="default"
            className="w-full md:w-auto"
          >
            Send
          </Button>
        </form>
      </div>
    </Card>
  );
}
