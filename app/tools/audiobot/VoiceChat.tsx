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

export default function VoiceChat(): JSX.Element {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [hasPlayed, setHasPlayed] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<
    { sender: string; message: string }[]
  >([]);
  const [textInput, setTextInput] = useState<string>("");
  const [generatedImage, setGeneratedImage] = useState<string>("");
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
      setChatHistory((prev) => [...prev, { sender: "User", message: text }]);

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

      setChatHistory((prev) => [
        // Remove the redundant user message addition
        ...prev,
        { sender: "AI", message: aiText },
      ]);

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

      // Set isProcessing to false before playing audio
      setIsProcessing(false);

      // Generate image based on AI response
      await generateImage(aiText);
    } catch (error) {
      console.error(
        "Error processing audio:",
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      // Remove or retain setIsProcessing(false) based on new placement
    }
  };

  const generateImage = async (prompt: string): Promise<void> => {
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

  const handleTextSubmit = async (): Promise<void> => {
    if (!textInput.trim()) return;
    setIsProcessing(true);
    setAudioUrl("");

    setGeneratedImage("");
    setIsImageLoading(true);

    try {
      // Add user message immediately
      setChatHistory((prev) => [
        ...prev,
        { sender: "User", message: textInput },
      ]);

      // Get ChatGPT response
      const aiResponse = await fetch("/api/chat-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textInput }),
      });

      const { response: aiText, error: chatError }: ChatResponse =
        await aiResponse.json();
      if (chatError) throw new Error(chatError);
      setResponse(aiText);

      // Add AI response to chat history
      setChatHistory((prev) => [...prev, { sender: "AI", message: aiText }]);

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
      setTextInput("");

      // Set isProcessing to false before generating image
      setIsProcessing(false);

      // Generate image based on AI response
      await generateImage(aiText);
    } catch (error) {
      console.error(
        "Error processing text input:",
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      // Remove or retain setIsProcessing(false) based on new placement
    }
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
    if (audioUrl && !textInput) {
      playAudioResponse();
    }
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8 flex flex-col min-h-[38rem] h-auto">
      <div className="flex flex-1 overflow-hidden">
        <div className="w-3/5 p-4 overflow-y-auto border-r">
          {/* Scrollable Chat History */}
          {chatHistory.map((chat, index) => {
            const isLastAIMessage =
              chat.sender === "AI" &&
              index === chatHistory.map((c) => c.sender).lastIndexOf("AI");
            return (
              <div
                key={index}
                className={`mb-2 ${
                  chat.sender === "User" ? "text-right" : "text-left"
                }`}
              >
                <span
                  className={`inline-block px-3 py-2 rounded ${
                    chat.sender === "User"
                      ? "bg-rose-500 text-white"
                      : "bg-gray-300 text-gray-800"
                  }`}
                >
                  {chat.message}
                </span>
                {isLastAIMessage && audioUrl && (
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
            );
          })}
        </div>
        <div className="w-2/5 p-4">
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
              {isProcessing ? (
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
      <div className="p-4 border-t flex justify-center items-center space-x-4">
        {/* Voice Input and Play Buttons */}
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          variant={isRecording ? "destructive" : "default"}
          type="button"
        >
          {isRecording ? <Square className="mr-2" /> : <Mic className="mr-2" />}
          {isRecording ? "Stop Talking" : "Talk to Buddy"}
        </Button>
        {/* Add loading indicator */}
        {isProcessing && <Loader2 className="animate-spin" />}
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Type your message"
          className="flex-1 border p-2 rounded max-w-md"
        />
        <Button
          onClick={handleTextSubmit}
          disabled={isProcessing}
          variant="default"
          type="button"
        >
          Send
        </Button>
      </div>
    </Card>
  );
}
