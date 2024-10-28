"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { Loader2 } from "lucide-react";

const ImageGeneratorPage = () => {
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState("");
  const [prompt, setPrompt] = useState("");
  const [settings, setSettings] = useState({
    image_size: "landscape_4_3",
    num_inference_steps: 4,
    num_images: 1,
    enable_safety_checker: true,
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          ...settings,
        }),
      });

      const data = await response.json();
      if (data.images?.[0]?.url) {
        setGeneratedImage(data.images[0].url);
      }
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-b from-rose-50 to-white dark:from-neutral-900 dark:to-neutral-800">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="border-rose-500/20">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-rose-500">
              AI Image Generator
            </CardTitle>
            <CardDescription>
              Create stunning images using artificial intelligence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="Describe the image you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="h-32"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <SelectItem value="portrait_4_3">Portrait 4:3</SelectItem>
                    <SelectItem value="portrait_16_9">Portrait 16:9</SelectItem>
                    <SelectItem value="landscape_4_3">Landscape 4:3</SelectItem>
                    <SelectItem value="landscape_16_9">
                      Landscape 16:9
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
                    setSettings({ ...settings, enable_safety_checker: checked })
                  }
                />
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Image"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Image Display */}
        {generatedImage && (
          <Card className="border-rose-500/20">
            <CardHeader>
              <CardTitle className="text-rose-500">Generated Image</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={generatedImage}
                alt="Generated"
                className="w-full rounded-lg shadow-lg"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ImageGeneratorPage;
