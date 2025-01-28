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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ChevronLeft, Download, Trash2 } from "lucide-react";
import Link from "next/link";

const ImageGeneratorPage = () => {
  const [activeTab, setActiveTab] = useState("generate");
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [settings, setSettings] = useState({
    image_size: "landscape_4_3",
    num_inference_steps: 4,
    num_images: 1,
    enable_safety_checker: true,
    brightness: 100,
    contrast: 100,
    saturation: 100,
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
        setGeneratedImages((prevImages) => [...prevImages, data.images[0].url]);
      }
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageAdjustment = (type: string, value: number) => {
    setSettings({ ...settings, [type]: value });
  };

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "generated-image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearGallery = () => {
    setGeneratedImages([]);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:from-neutral-900 dark:to-neutral-800">
      <div className="ml-4 flex h-16 items-center space-x-2">
        <Link href="/tools" className="text-neutral-500 hover:text-neutral-700">
          <ChevronLeft className="h-6 w-6 text-neutral-800" />
        </Link>
        <h1 className="text-3xl font-bold text-neutral-800">
          Image Playground
        </h1>
      </div>

      <div className="max-w-8xl mx-auto space-y-8 m-8">
        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="adjust">Adjust</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <Card className="border-neutral-500/20">
              <CardHeader>
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
                        <SelectItem value="portrait_4_3">
                          Portrait 4:3
                        </SelectItem>
                        <SelectItem value="portrait_16_9">
                          Portrait 16:9
                        </SelectItem>
                        <SelectItem value="landscape_4_3">
                          Landscape 4:3
                        </SelectItem>
                        <SelectItem value="landscape_16_9">
                          Landscape 16:9
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Inference Steps */}
                  <div className="space-y-2">
                    <Label>
                      Inference Steps: {settings.num_inference_steps}
                    </Label>
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
                    className="bg-neutral-800 hover:bg-neutral-600 text-white min-w-52"
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="adjust">
            <Card className="border-neutral-500/20">
              <CardHeader>
                <CardTitle>Image Adjustments</CardTitle>
                <CardDescription>
                  Fine-tune your generated images
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Brightness: {settings.brightness}%</Label>
                    <Slider
                      value={[settings.brightness]}
                      onValueChange={([value]) =>
                        handleImageAdjustment("brightness", value)
                      }
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contrast: {settings.contrast}%</Label>
                    <Slider
                      value={[settings.contrast]}
                      onValueChange={([value]) =>
                        handleImageAdjustment("contrast", value)
                      }
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Saturation: {settings.saturation}%</Label>
                    <Slider
                      value={[settings.saturation]}
                      onValueChange={([value]) =>
                        handleImageAdjustment("saturation", value)
                      }
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gallery">
            <Card className="border-neutral-500/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Generated Images</CardTitle>
                <Button variant="destructive" onClick={handleClearGallery}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Generated ${index + 1}`}
                        className="rounded-lg shadow-lg w-full"
                        style={{
                          filter: `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%)`,
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={() => handleDownload(image)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ImageGeneratorPage;
