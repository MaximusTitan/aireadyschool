"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, Loader2, Youtube } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client"; // Import shared Supabase client

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

// New interface for video analysis history
interface VideoAnalysis {
  id: number;
  video_link: string;
  title: string;
  description: string;
  analysis_results: string;
  created_at?: string;
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
  const [userEmail, setUserEmail] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(
    null
  );
  // New state for video history
  const [videoHistory, setVideoHistory] = useState<VideoAnalysis[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Fetch logged-in user email automatically
  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.email) {
        setUserEmail(user.email);
      }
    }
    fetchUser();
  }, []);

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

  // New useEffect to fetch video analysis history
  useEffect(() => {
    async function fetchVideoHistory() {
      try {
        const res = await fetch(`/api/video-history?email=${userEmail}`);
        const data = await res.json();
        if (res.ok) {
          setVideoHistory(data.videoHistory || []);
        }
      } catch (error) {
        console.error("Fetching video history failed:", error);
      }
    }
    if (userEmail) {
      fetchVideoHistory();
    }
  }, [userEmail]);

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
    if (!userEmail) {
      toast.error("User not authenticated");
      return;
    }
    setLoading(true);
    setVideoData(null);
    setMessages([]);
    setVideoMetadata(null);

    try {
      // Extract video ID
      const videoId =
        new URL(url).searchParams.get("v") ||
        url.split("youtu.be/")[1]?.split("?")[0];

      // Fetch metadata locally and update state
      let fetchedMetadata = { title: "", description: "", channelTitle: "" };
      if (videoId) {
        const res = await fetch(`/api/youtube-metadata?videoId=${videoId}`);
        const metadata = await res.json();
        if (res.ok) {
          fetchedMetadata = {
            title: metadata.title || "",
            description: metadata.description || "",
            channelTitle: metadata.channelTitle || "",
          };
          setVideoMetadata(fetchedMetadata);
        }
      }

      const response = await fetch("/api/process-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          email: userEmail,
          title: fetchedMetadata.title,
          description: fetchedMetadata.description,
        }),
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
          email: userEmail,
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

  // New function to load history item details into the analysis UI
  const handleHistoryClick = async (item: VideoAnalysis) => {
    setUrl(item.video_link);
    setVideoData({ summary: item.analysis_results, transcript: "" });
    try {
      const videoId =
        new URL(item.video_link).searchParams.get("v") ||
        item.video_link.split("youtu.be/")[1]?.split("?")[0] ||
        "";
      if (videoId) {
        await fetchVideoMetadata(videoId);
      }
    } catch (error) {
      console.error("Failed to fetch video metadata from history item:", error);
    }
  };

  // Determine paginated history items
  const paginatedHistory = videoHistory.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-backgroundApp dark:bg-neutral-950">
      <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
        <Link href="/tools">
          <Button variant="outline" className="mb-2 border-neutral-500">
            ← Back
          </Button>
        </Link>

        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-rose-500">
            YouTube Assistant
          </h1>
          <p className="text-muted-foreground text-lg">
            Analyze YouTube videos, get summaries, and chat with AI about video
            content to enhance your learning experience.
          </p>
        </div>

        <div className="max-w-5xl">
          {/* Rest of the existing content */}
          <form
            onSubmit={handleVideoSubmit}
            className="flex flex-col gap-4 mb-6"
          >
            <div className="flex gap-4">
              <Input
                type="url"
                placeholder="Enter YouTube URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 dark:bg-neutral-950 dark:border-neutral-700"
                disabled={loading}
                aria-label="YouTube URL input"
              />
            </div>
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

          {/* Show history at top only when no video is loaded */}
          {!videoData && (
            <Card className="mb-8 dark:bg-neutral-800">
              <CardHeader>
                <CardTitle className="text-neutral-700">
                  Video Analysis History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {videoHistory.length > 0 ? (
                  <>
                    {/* Removed ScrollArea wrapper; using a simple div container */}
                    <div className="p-4 border rounded-lg dark:border-neutral-700">
                      <div className="space-y-2">
                        {paginatedHistory.map((item) => (
                          <div key={item.id} className="border-b pb-2">
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handleHistoryClick(item);
                              }}
                            >
                              <h4 className="text-lg font-semibold">
                                {item.title}
                              </h4>
                            </a>
                            {/* Increased characters from 100 to 200 */}
                            <p className="text-sm text-gray-600">
                              {item.analysis_results.length > 200
                                ? item.analysis_results.slice(0, 200) + "..."
                                : item.analysis_results}
                            </p>
                            <small className="text-xs text-gray-400">
                              {item.created_at
                                ? new Date(item.created_at).toLocaleString()
                                : ""}
                            </small>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Pagination Controls */}
                    <div className="mt-2 flex justify-end space-x-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 0))
                        }
                        disabled={currentPage === 0}
                      >
                        Prev
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            (prev + 1) * itemsPerPage >= videoHistory.length
                              ? prev
                              : prev + 1
                          )
                        }
                        disabled={
                          (currentPage + 1) * itemsPerPage >=
                          videoHistory.length
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">
                    No video history found.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Video analysis content */}
          {videoData && (
            <>
              <div className="flex flex-col gap-6 mb-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="dark:bg-neutral-800">
                    <CardHeader>
                      <CardTitle className="text-neutral-700">
                        Video Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="pneutral dark:pneutral-invert max-w-none">
                        <p className="whitespace-pre-wrap">
                          {videoData.summary}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <div className="md:col-span-1">
                    <div
                      className="relative w-full pt-[56.25%]" // 16:9 aspect ratio
                      style={{ height: "0" }}
                    >
                      <iframe
                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                        src={getYouTubeEmbedUrl(url)}
                        title="YouTube Video Player"
                        frameBorder="0"
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
                          <div className="relative">
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">
                              {isDescriptionExpanded
                                ? videoMetadata.description
                                : videoMetadata.description.slice(0, 200)}
                              {videoMetadata.description.length > 200 && (
                                <>
                                  {!isDescriptionExpanded && "..."}
                                  <button
                                    onClick={() =>
                                      setIsDescriptionExpanded(
                                        !isDescriptionExpanded
                                      )
                                    }
                                    className="ml-2 text-blue-600 hover:underline"
                                  >
                                    {isDescriptionExpanded
                                      ? "Show less"
                                      : "Show more"}
                                  </button>
                                </>
                              )}
                            </p>
                          </div>
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

              {/* Show history below main content when video is loaded */}
              <Card className="mt-8 dark:bg-neutral-800">
                <CardHeader>
                  <CardTitle className="text-neutral-700">
                    Video Analysis History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {videoHistory.length > 0 ? (
                    <>
                      {/* Removed ScrollArea wrapper; using a simple div container */}
                      <div className="p-4 border rounded-lg dark:border-neutral-700">
                        <div className="space-y-2">
                          {paginatedHistory.map((item) => (
                            <div key={item.id} className="border-b pb-2">
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleHistoryClick(item);
                                }}
                              >
                                <h4 className="text-lg font-semibold">
                                  {item.title}
                                </h4>
                              </a>
                              {/* Increased characters from 100 to 200 */}
                              <p className="text-sm text-gray-600">
                                {item.analysis_results.length > 200
                                  ? item.analysis_results.slice(0, 200) + "..."
                                  : item.analysis_results}
                              </p>
                              <small className="text-xs text-gray-400">
                                {item.created_at
                                  ? new Date(item.created_at).toLocaleString()
                                  : ""}
                              </small>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Pagination Controls */}
                      <div className="mt-2 flex justify-end space-x-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 0))
                          }
                          disabled={currentPage === 0}
                        >
                          Prev
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) =>
                              (prev + 1) * itemsPerPage >= videoHistory.length
                                ? prev
                                : prev + 1
                            )
                          }
                          disabled={
                            (currentPage + 1) * itemsPerPage >=
                            videoHistory.length
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No video history found.
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default YoutubeAssistantPage;
