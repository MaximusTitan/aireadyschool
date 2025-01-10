"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Square, Play, Loader2 } from "lucide-react";
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
        ...prev,
        { sender: "User", message: text },
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
    } catch (error) {
      console.error(
        "Error processing audio:",
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = async (): Promise<void> => {
    if (!textInput.trim()) return;
    setIsProcessing(true);
    try {
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

      setChatHistory((prev) => [
        ...prev,
        { sender: "User", message: textInput },
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
      setTextInput("");
    } catch (error) {
      console.error(
        "Error processing text input:",
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudioResponse = (): void => {
    if (audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
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
    <Card className="w-full max-w-4xl mx-auto mt-8 flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        <div className="w-2/3 p-4 overflow-y-auto">
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
                    <Play className="mr-2" />
                    {hasPlayed ? "Replay" : "Play"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <div className="w-1/3 flex justify-center items-center p-4">
          {/* Positioned GIF */}
          {isAudioPlaying ? (
            <img
              src="https://wdfrtqeljulkoqnllxad.supabase.co/storage/v1/object/public/generated-videos/o-talking-small.gif"
              alt="Audio Playing"
              className="w-48 h-48"
            />
          ) : (
            <img
              src="https://wdfrtqeljulkoqnllxad.supabase.co/storage/v1/object/public/generated-images/o-constant.gif"
              alt="Idle"
              className="w-48 h-48"
            />
          )}
        </div>
      </div>
      <div className="p-4 flex justify-center items-center space-x-4">
        {/* Voice Input and Play Buttons */}
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          variant={isRecording ? "destructive" : "default"}
          type="button"
        >
          {isRecording ? <Square className="mr-2" /> : <Mic className="mr-2" />}
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button>
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Type your message"
          className="border p-2 rounded"
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
