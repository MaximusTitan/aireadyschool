"use client";
import { useState } from "react";
import { ImageUpload } from "./components/ImageUpload";
import { ImagePromptInput } from "./components/ImagePromptInput";
import { ImageResultDisplay } from "./components/ImageResultDisplay";
import { ImageIcon, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HistoryItem } from "./lib/type";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const handleImageSelect = (imageData: string) => {
    setImage(imageData || null);
  };

  const handlePromptSubmit = async (prompt: string) => {
    try {
      setLoading(true);
      setError(null);

      // If we have a generated image, use that for editing, otherwise use the uploaded image
      const imageToEdit = generatedImage || image;

      // Prepare the request data as JSON
      const requestData = {
        prompt,
        image: imageToEdit,
        history: history.length > 0 ? history : undefined,
      };

      const response = await fetch("/api/gemini-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to generate image, Try another prompt"
        );
      }

      const data = await response.json();

      if (data.image) {
        // Update the generated image and description
        setGeneratedImage(data.image);
        setDescription(data.description || null);

        // Update history locally - add user message
        const userMessage: HistoryItem = {
          role: "user",
          parts: [
            { text: prompt },
            ...(imageToEdit ? [{ image: imageToEdit }] : []),
          ],
        };

        // Add AI response
        const aiResponse: HistoryItem = {
          role: "model",
          parts: [
            ...(data.description ? [{ text: data.description }] : []),
            ...(data.image ? [{ image: data.image }] : []),
          ],
        };

        // Update history with both messages
        setHistory((prevHistory) => [...prevHistory, userMessage, aiResponse]);
      } else {
        setError("No image returned from API");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
      console.error("Error processing request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setGeneratedImage(null);
    setDescription(null);
    setLoading(false);
    setError(null);
    setHistory([]);
  };

  // If we have a generated image, we want to edit it next time
  const currentImage = generatedImage || image;
  const isEditing = !!currentImage;

  // Get the latest image to display (always the generated image)
  const displayImage = generatedImage;

  return (
    <div className="bg-backgroundApp min-h-screen">
      <div className="container py-16 space-y-8 max-w-6xl">
        <Link href="/tools">
          <Button variant="outline" className="mb-2 border-neutral-500">
            ← Back
          </Button>
        </Link>
        <Card className="w-full max-w-6xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
          <CardHeader className="flex flex-col justify-center space-y-2">
            <CardTitle className="flex gap-2 text-foreground">
              Image Creation & Editing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 w-full">
            {error && (
              <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                {error}
              </div>
            )}

            {!displayImage && !loading ? (
              <>
                <ImageUpload
                  onImageSelect={handleImageSelect}
                  currentImage={currentImage}
                />
                {!currentImage && (
                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-muted-foreground/20"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-background px-4 text-sm text-muted-foreground">
                        OR
                      </span>
                    </div>
                  </div>
                )}
                <ImagePromptInput
                  onSubmit={handlePromptSubmit}
                  isEditing={isEditing}
                  isLoading={loading}
                />
              </>
            ) : loading ? (
              <div
                role="status"
                className="flex items-center mx-auto justify-center h-56 max-w-sm bg-gray-300 rounded-lg animate-pulse dark:bg-secondary"
              >
                <ImageIcon className="w-10 h-10 text-gray-200 dark:text-muted-foreground" />
                <span className="pl-4 font-mono font-xs text-muted-foreground">
                  Processing...
                </span>
              </div>
            ) : (
              <>
                <ImageResultDisplay
                  imageUrl={displayImage || ""}
                  description={description}
                  onReset={handleReset}
                  conversationHistory={history}
                />
                <ImagePromptInput
                  onSubmit={handlePromptSubmit}
                  isEditing={true}
                  isLoading={loading}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
