"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import axios, { AxiosError } from "axios";
import Link from "next/link";
import { ImageUploader } from "./components/ImageUploader";
import { VideoPreview } from "./components/VideoPreview";
import { PromptInput } from "./components/PromptInput";
import { createClient } from "@/utils/supabase/client";
import { History } from "lucide-react";

export default function VideoGenerator() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<"image" | "text">("image");
  const [savedVideos, setSavedVideos] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (videoUrl) {
      const videoElement = document.getElementById("generated-video");
      videoElement?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [videoUrl]);

  const fetchSavedVideos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('generated_videos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching videos:", error);
      return;
    }

    setSavedVideos(data || []);
  };

  useEffect(() => {
    fetchSavedVideos();
  }, []);

  const handleVideoGeneration = async () => {
    if (mode === "image") {
      if (!selectedImage || !prompt) {
        setError("Both image and prompt are required");
        return;
      }
    } else if (!prompt) {
      setError("Prompt is required");
      return;
    }

    setLoading(true);
    setError("");
    setVideoUrl(null);

    try {
      const endpoint =
        mode === "image" ? "/api/image-to-video" : "/api/text-to-video";
      const payload =
        mode === "image" ? { prompt, imageUrl: selectedImage } : { prompt };

      const response = await axios.post(endpoint, payload);

      if (response.data.videoUrl) {
        setVideoUrl(response.data.videoUrl);
        await fetchSavedVideos(); // Refresh the list
      } else {
        throw new Error("No video URL received");
      }
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      console.error("Video generation error:", error);
      setError(
        "Something went wrong while generating your video. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setSelectedImage(null);
    setPrompt("");
    setVideoUrl(null);
    setError("");
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const renderSavedVideos = () => {
    if (savedVideos.length === 0) return null;

    return (
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Your Generated Videos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedVideos.map((video) => (
            <div key={video.id} className="bg-white rounded-lg shadow p-4">
              <video
                controls
                className="w-full h-48 object-cover rounded-lg mb-2"
                src={video.video_url}
              />
              <p className="text-sm text-gray-600 truncate">{video.input_text}</p>
              <p className="text-xs text-gray-500">
                {new Date(video.created_at).toLocaleDateString()}
              </p>
              <div className="flex justify-between items-center mt-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  video.status === 'completed' ? 'bg-green-100 text-green-800' :
                  video.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {video.status}
                </span>
                <a
                  href={video.video_url}
                  download
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-backgroundApp dark:bg-neutral-950">
      {loading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <div className="bg-white p-4 rounded-lg flex items-center gap-2">
            <Loader2 className="animate-spin h-4 w-4" />
            <span>Generating your video...</span>
          </div>
        </div>
      )}

      <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
        <div className="flex justify-between items-center">
          <Link href="/tools">
            <Button variant="outline" className="border-neutral-500">
              ← Back
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={toggleHistory}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            {showHistory ? "Hide History" : "Show History"}
          </Button>
        </div>

        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-rose-500">Video Generator</h1>
          <p className="text-muted-foreground text-lg">
            Generate videos from images or text using AI
          </p>
        </div>

        {showHistory ? (
          <div className="grid gap-6">
            <Button
              variant="outline"
              onClick={toggleHistory}
              className="w-fit"
            >
              ← Back to Generator
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden"
                >
                  <div className="aspect-video relative">
                    <video
                      controls
                      className="w-full h-full object-cover"
                      src={video.video_url}
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                     
                       
                      <span className="text-xs text-gray-500">
                        {new Date(video.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {video.input_text}
                    </p>
                    {video.image_url && (
                      <div className="text-xs text-gray-500 mb-2">
                        Type: Image to Video
                      </div>
                    )}
                    <div className="flex justify-end">
                      <a
                        href={video.video_url}
                        download
                        className="text-rose-600 hover:text-rose-700 text-sm font-medium"
                      >
                        
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Card className="border-neutral-200 dark:border-neutral-800">
            <CardContent className="pt-6 space-y-4">
              {videoUrl && <VideoPreview videoUrl={videoUrl} />}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={mode === "image" ? "default" : "outline"}
                  onClick={() => setMode("image")}
                  className="w-full"
                >
                  Image to Video
                </Button>
                <Button
                  variant={mode === "text" ? "default" : "outline"}
                  onClick={() => setMode("text")}
                  className="w-full"
                >
                  Text to Video
                </Button>
              </div>
              {mode === "image" && (
                <ImageUploader
                  selectedImage={selectedImage}
                  onImageSelect={setSelectedImage}
                />
              )}
              <PromptInput prompt={prompt} onPromptChange={setPrompt} />
              <div className="flex gap-2">
                <Button
                  className="w-full bg-rose-500 hover:bg-rose-600 transition-colors"
                  onClick={handleVideoGeneration}
                  disabled={
                    loading || (mode === "image" && !selectedImage) || !prompt
                  }
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      <span>Generating Video...</span>
                    </>
                  ) : (
                    "Generate Video"
                  )}
                </Button>
                {(selectedImage || videoUrl) && (
                  <Button
                    variant="outline"
                    className="w-32"
                    onClick={handleStartOver}
                    disabled={loading}
                  >
                    Start Over
                  </Button>
                )}
              </div>
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
