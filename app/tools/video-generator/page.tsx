"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, ChevronLeft } from "lucide-react";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import Link from "next/link";

export default function VideoGenerator() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (videoUrl) {
      const videoElement = document.getElementById("generated-video");
      videoElement?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [videoUrl]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer?.files?.[0];
    if (file) await processFile(file);
  };

  const processFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    try {
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setSelectedImage(base64String);
      setUploadSuccess(true);
      setError("");
      toast.success("Image uploaded successfully!");
    } catch (err) {
      toast.error("Failed to process image. Please try again.");
      console.error("File processing error:", err);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) await processFile(file);
  };

  const handleImageToVideo = async () => {
    if (!selectedImage || !prompt) {
      setError("Both image and prompt are required");
      return;
    }

    setLoading(true);
    setError("");
    setVideoUrl(null);

    try {
      const response = await axios.post("/api/image-to-video", {
        prompt,
        imageUrl: selectedImage,
      });

      if (response.data.videoUrl) {
        setVideoUrl(response.data.videoUrl);
      } else {
        throw new Error("No video URL received");
      }
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      const errorMessage =
        error.response?.data?.message ||
        "Failed to generate video. Please try again.";
      setError(errorMessage);
      console.error("Video generation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setSelectedImage(null);
    setPrompt("");
    setVideoUrl(null);
    setUploadSuccess(false);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
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
          <h1 className="text-3xl font-bold text-rose-500">
            Image to Video Generator
          </h1>
          <p className="text-muted-foreground text-lg">
            Transform your static images into dynamic videos with AI-powered motion and animations.
          </p>
        </div>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="pt-6 space-y-4">
            {videoUrl && (
              <div id="generated-video" className="mb-6">
                <h2 className="text-lg font-bold text-neutral-500 mb-2">
                  Your Generated Video
                </h2>
                <video
                  src={videoUrl}
                  controls
                  className="w-full rounded-lg shadow-lg"
                  autoPlay
                  loop
                />
                <p className="text-sm text-gray-500 mt-2">
                  Tip: Download the video by clicking the three dots on the video
                  player.
                </p>
              </div>
            )}

            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${selectedImage ? "border-neutral-500" : "border-gray-300 hover:border-neutral-500"}`}
            >
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    Drag and drop your image here, or click to select
                  </p>
                  <Input
                    id="picture"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("picture")?.click()}
                  >
                    Select Image
                  </Button>
                </div>
              )}
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="prompt">Describe Your Animation</Label>
              <Textarea
                id="prompt"
                placeholder="Be specific about the movement you want to see. For example: 'Make the flower slowly bloom and sway in the wind' or 'Zoom into the center of the image while adding a subtle rotation'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="border-neutral-500 focus:ring-neutral-500 min-h-[120px]"
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="w-full bg-neutral-500 hover:bg-neutral-600 transition-colors"
                onClick={handleImageToVideo}
                disabled={loading || !selectedImage || !prompt}
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

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
