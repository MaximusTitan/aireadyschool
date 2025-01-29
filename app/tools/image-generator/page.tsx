"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  ChevronLeft,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useEffect } from "react";

// Add this after imports
const aspectRatioMap = {
  square_hd: "aspect-square",
  square: "aspect-square",
  portrait_4_3: "aspect-[3/4]",
  portrait_16_9: "aspect-[9/16]",
  landscape_4_3: "aspect-[4/3]",
  landscape_16_9: "aspect-[16/9]",
};

const ImageGeneratorPage = () => {
  const [userEmail, setUserEmail] = useState("guest@example.com");
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserEmail(user.email ?? "guest@example.com");

        // Fetch user credits
        const { data: userData } = await supabase
          .from("users")
          .select("image_credits")
          .eq("user_id", user.id)
          .single();

        if (userData) {
          setCredits(userData.image_credits);
        }
      }
    };

    fetchUserData();
  }, []);

  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [settings, setSettings] = useState({
    image_size: "landscape_4_3",
    num_inference_steps: 4,
    num_images: 1,
    enable_safety_checker: true,
  });

  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty Prompt",
        description:
          "Please enter a description for the image you want to generate.",
        variant: "destructive",
      });
      return;
    }

    // Add credit check before API call
    if (credits !== null && credits < settings.num_images) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${settings.num_images} credits to generate ${settings.num_images} image${settings.num_images > 1 ? "s" : ""}. You have ${credits} credits remaining.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, ...settings }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate image");
      }

      const data = await response.json();
      if (data.images?.length > 0) {
        setGeneratedImages(data.images.map((img: any) => img.url));
        setCredits(data.remainingCredits);
        toast({
          title: "Success!",
          description: `Generated ${data.images.length} images successfully. ${data.remainingCredits} credits remaining.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (imageUrl: string) => {
    if (!imageUrl) return;

    try {
      setLoading(true);
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "generated-image.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getGridLayout = (numImages: number) => {
    if (numImages === 1) return "grid-cols-1";
    if (numImages === 2) return "grid-cols-1 max-w-md mx-auto"; // Changed from max-w-xl to max-w-md
    return "grid-cols-2"; // 3-4 images stay in 2-column grid
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <Link
            href="/tools"
            className="transition-colors hover:text-neutral-600"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-800 to-neutral-600 dark:from-neutral-200 dark:to-neutral-400">
            Image Playground
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-neutral-500/20 shadow-lg transition-shadow hover:shadow-xl">
            <CardHeader>
              {credits !== null && (
                <div className="text-sm text-neutral-500">
                  Available Credits: {credits}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Prompt Input with character count */}
              <div className="space-y-2">
                <Label htmlFor="prompt" className="flex justify-between">
                  <span>Prompt</span>
                  <span className="text-sm text-neutral-500">
                    {prompt.length}/1000
                  </span>
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="A serene landscape with mountains..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, 1000))}
                  className="h-32 transition-colors focus:border-neutral-500"
                />
              </div>

              {/* Settings Grid */}
              <div className="grid grid-cols-1 gap-6">
                {/* Image Size */}
                <div className="space-y-2">
                  <Label>Image Size</Label>
                  <Select
                    value={settings.image_size}
                    onValueChange={(value) =>
                      setSettings({ ...settings, image_size: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square_hd">Square HD</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="portrait_4_3">3:4 Portrait</SelectItem>
                      <SelectItem value="portrait_16_9">
                        9:16 Portrait
                      </SelectItem>
                      <SelectItem value="landscape_4_3">
                        4:3 Landscape
                      </SelectItem>
                      <SelectItem value="landscape_16_9">
                        16:9 Landscape
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Inference Steps */}
                <div className="space-y-2">
                  <Label>Inference Steps: {settings.num_inference_steps}</Label>
                  <Slider
                    value={[settings.num_inference_steps]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, num_inference_steps: value })
                    }
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Number of Images */}
                <div className="space-y-2">
                  <Label>Number of Images: {settings.num_images}</Label>
                  <Slider
                    value={[settings.num_images]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, num_images: value })
                    }
                    min={1}
                    max={4}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Safety Checker */}
                <div className="flex items-center justify-between">
                  <Label>Enable Safety Checker</Label>
                  <Switch
                    checked={settings.enable_safety_checker}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        enable_safety_checker: checked,
                      })
                    }
                  />
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white min-w-52 transition-all duration-200 ease-in-out transform hover:scale-105"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Generate Image
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Result Card */}
          <Card className="border-neutral-500/20 shadow-lg">
            <CardHeader>
              <CardDescription className="text-lg">
                Generated Results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div
                  className={`grid ${getGridLayout(settings.num_images)} gap-4`}
                >
                  {Array(settings.num_images)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className={`animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-lg ${
                          aspectRatioMap[
                            settings.image_size as keyof typeof aspectRatioMap
                          ]
                        }`}
                      />
                    ))}
                </div>
              ) : generatedImages.length > 0 ? (
                <div
                  className={`grid ${getGridLayout(generatedImages.length)} gap-4`}
                >
                  {generatedImages.map((image, index) => (
                    <div
                      key={index}
                      className={`relative group rounded-lg overflow-hidden ${
                        generatedImages.length === 1
                          ? "max-w-2xl mx-auto"
                          : generatedImages.length === 2
                            ? "h-[300px]" // Add fixed height for 2 images
                            : ""
                      }`}
                    >
                      <div
                        className={`${aspectRatioMap[settings.image_size as keyof typeof aspectRatioMap]}`}
                      >
                        <img
                          src={image}
                          alt={`Generated image ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="secondary"
                          onClick={() => handleDownload(image)}
                          className="transform translate-y-4 group-hover:translate-y-0 transition-transform"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-neutral-500">
                  <ImageIcon className="h-12 w-12 mb-4" />
                  <p>Your generated images will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ImageGeneratorPage;
