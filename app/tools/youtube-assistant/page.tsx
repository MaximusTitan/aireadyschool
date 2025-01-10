"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Youtube } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

interface VideoData {
  summary: string;
  transcript: string;
}

const YoutubeAssistantPage = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

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

    try {
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
      const response = await fetch("/api/yt-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, newMessage],
          videoContext: videoData.transcript,
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
          content: data.response,
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
      <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-neutral-800 dark:border-neutral-700">
        <div className="container flex h-16 items-center space-x-4">
          <Youtube className="h-6 w-6 text-rose-500" />
          <h1 className="text-2xl font-bold text-rose-500">
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
              className="bg-rose-500 hover:bg-rose-600 text-white"
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
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="dark:bg-neutral-800">
                <CardHeader>
                  <CardTitle className="text-rose-500">Video Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap">{videoData.summary}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-neutral-800">
                <CardHeader>
                  <CardTitle className="text-rose-500">
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
                                ? "bg-rose-500 text-white"
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
                            <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
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
                      className="bg-rose-500 hover:bg-rose-600 text-white"
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
