import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

interface VideoGeneratorProps {
  toolCallId: string;
  onComplete: (toolCallId: string, videoUrl: string) => void;
  prompt: string;
  initialImage?: string | null;
}

export const VideoGenerator = ({
  toolCallId,
  onComplete,
  prompt,
  initialImage,
}: VideoGeneratorProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(
    initialImage || null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

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
      setError("");
      toast.success("Image uploaded successfully!");

      // Automatically start video generation after image upload
      handleImageToVideo(base64String);
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

  const convertUrlToBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error converting image URL to base64:", error);
      throw new Error("Failed to process image");
    }
  };

  const handleImageToVideo = async (imageUrl: string) => {
    if (!imageUrl || !prompt) {
      setError("Both image and prompt are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Convert URL to base64 if it's not already in base64 format
      const base64Image = imageUrl.startsWith("data:image/")
        ? imageUrl
        : await convertUrlToBase64(imageUrl);

      const response = await fetch("/api/image-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          imageUrl: base64Image,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate video");
      }

      if (data.videoUrl) {
        onComplete(toolCallId, data.videoUrl);
        toast.success("Video generated successfully!");
      } else {
        throw new Error("No video URL received");
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Automatically start video generation if initial image is provided
    if (initialImage) {
      handleImageToVideo(initialImage);
    }
  }, [initialImage]);

  return (
    <div className="space-y-4 p-4 border rounded-lg">
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
              id={`video-input-${toolCallId}`}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() =>
                document.getElementById(`video-input-${toolCallId}`)?.click()
              }
              disabled={loading}
            >
              Select Image
            </Button>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-neutral-600">
          <Loader2 className="animate-spin h-4 w-4" />
          <span>Generating video... This may take a few minutes.</span>
        </div>
      )}

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
    </div>
  );
};
