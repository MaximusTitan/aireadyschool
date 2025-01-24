"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, Loader2, Youtube } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

interface VideoData {
  summary: string;
  transcript: string;
}

interface VideoMetadata {
  title: string;
  description: string;
  channelTitle: string;
}

const getYouTubeEmbedUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    let videoId = "";
    if (parsedUrl.hostname === "youtu.be") {
      videoId = parsedUrl.pathname.slice(1);
    } else {
      videoId = parsedUrl.searchParams.get("v") || "";
    }
    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return "";
  }
};

const YoutubeAssistantPage = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(
    null
  );

  const fetchVideoMetadata = async (videoId: string) => {
    try {
      const response = await fetch(`/api/youtube-metadata?videoId=${videoId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setVideoMetadata({
        title: data.title,
        description: data.description,
        channelTitle: data.channelTitle,
      });
    } catch (error) {
      console.error("Failed to fetch video metadata:", error);
    }
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    const scrollArea = document.querySelector(".scroll-area-content");
    if (scrollArea) {
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages]);

  // URL validation
  const isValidYoutubeUrl = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      return (
        parsedUrl.hostname === "youtube.com" ||
        parsedUrl.hostname === "www.youtube.com" ||
        parsedUrl.hostname === "youtu.be"
      );
    } catch {
      return false;
    }
  };

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error("Please enter a YouTube URL");
      return;
    }

    if (!isValidYoutubeUrl(url)) {
      toast.error("Please enter a valid YouTube URL");
      return;
    }

    setLoading(true);
    setVideoData(null);
    setMessages([]);
    setVideoMetadata(null);

    try {
      // Extract video ID and fetch metadata
      const videoId =
        new URL(url).searchParams.get("v") ||
        url.split("youtu.be/")[1]?.split("?")[0];
      if (videoId) {
        await fetchVideoMetadata(videoId);
      }

      const response = await fetch("/api/process-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process video");
      }

      setVideoData(data);
      toast.success("Video processed successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to process video"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !videoData) return;

    const newMessage: Message = {
      role: "user",
      content: input,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/process-video", {
        // Updated endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatMessage: input, // Updated payload
          url: url, // Include URL if necessary
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply, // Updated response field
          timestamp: Date.now(),
        },
      ]);
    } catch (error) {
      toast.error("Failed to send message");
      setMessages((prev) =>
        prev.filter((msg) => msg.timestamp !== newMessage.timestamp)
      );
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-50 w-full dark:bg-neutral-800 dark:border-neutral-700">
        <div className="ml-4 flex h-16 items-center space-x-2">
          <Link
            href="/tools"
            className="text-neutral-500 hover:text-neutral-700"
          >
            <ChevronLeft className="h-6 w-6 text-neutral-800" />
          </Link>
          <h1 className="text-3xl font-bold text-neutral-800">
            YouTube Assistant
          </h1>
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleVideoSubmit} className="flex gap-4 mb-6">
            <Input
              type="url"
              placeholder="Enter YouTube URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 dark:bg-neutral-950 dark:border-neutral-700"
              disabled={loading}
              aria-label="YouTube URL input"
            />
            <Button
              type="submit"
              className="bg-neutral-800 hover:bg-neutral-600 text-white"
              disabled={loading}
              aria-label={loading ? "Processing video" : "Analyze video"}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                "Analyze"
              )}
            </Button>
          </form>

          {videoData && (
            <div className="flex flex-col gap-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="dark:bg-neutral-800">
                  <CardHeader>
                    <CardTitle className="text-neutral-700">
                      Video Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="pneutral dark:pneutral-invert max-w-none">
                      <p className="whitespace-pre-wrap">{videoData.summary}</p>
                    </div>
                  </CardContent>
                </Card>
                <div className="md:col-span-1">
                  <div
                    className="relative w-full"
                    style={{ paddingBottom: "56.25%" }}
                  >
                    <iframe
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                      width="100%"
                      height="575"
                      src={getYouTubeEmbedUrl(url)}
                      title="YouTube Video Player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                  {videoMetadata && (
                    <div className="mt-4 space-y-2">
                      <h3 className="text-xl font-semibold">
                        {videoMetadata.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        By {videoMetadata.channelTitle}
                      </p>
                      {videoMetadata.description && (
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {videoMetadata.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Card className="dark:bg-neutral-800">
                <CardHeader>
                  <CardTitle className="text-neutral-700">
                    Chat with Video
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] mb-4 p-4 border rounded-lg dark:border-neutral-700">
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <div
                          key={`${message.timestamp}-${index}`}
                          className={`flex ${
                            message.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] px-4 py-2 rounded-lg ${
                              message.role === "user"
                                ? "bg-neutral-500 text-white"
                                : "bg-gray-100 dark:bg-neutral-950"
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 dark:bg-neutral-950 rounded-lg p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <form onSubmit={handleChatSubmit} className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about the video..."
                      className="flex-1 dark:bg-neutral-950 dark:border-neutral-700"
                      disabled={chatLoading || !videoData}
                      aria-label="Chat input"
                    />
                    <Button
                      type="submit"
                      disabled={chatLoading || !input.trim() || !videoData}
                      className="bg-neutral-800 hover:bg-neutral-600 text-white"
                      aria-label="Send message"
                    >
                      Send
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default YoutubeAssistantPage;
