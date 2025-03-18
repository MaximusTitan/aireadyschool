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

export default function VideoGenerator() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<"image" | "text">("image");

  useEffect(() => {
    if (videoUrl) {
      const videoElement = document.getElementById("generated-video");
      videoElement?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [videoUrl]);

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
        <Link href="/tools">
          <Button variant="outline" className="mb-2 border-neutral-500">
            ← Back
          </Button>
        </Link>

        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-rose-500">Video Generator</h1>
          <p className="text-muted-foreground text-lg">
            Generate videos from images or text using AI
          </p>
        </div>

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
                    Generating Video...
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
      </div>
    </div>
  );
}
