"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Wand2, Loader2 } from "lucide-react";
import { generateWithAI, generateThumbnail } from "./actions";
import Image from "next/image";
import { toast } from "sonner";
import Link from "next/link";
import { thumbnailStyles } from './styles';

const thumbnailElements = [
  { id: "face", label: "Face Close-Up" },
  { id: "text", label: "Big Bold Text" },
  { id: "play", label: "Play Button Overlay" },
  { id: "blur", label: "Background Blur" },
  { id: "arrows", label: "Arrows & Emojis" },
  { id: "lightning", label: "Lightning Effects" },
];

const stylePreferences = [
  { value: "ai", label: "Best Performing Style (AI Decides)" },
  { value: "bright", label: "Bright & Colorful" },
  { value: "dark", label: "Dark & Edgy" },
  { value: "professional", label: "Professional & Clean" },
  { value: "fun", label: "Fun & Playful" },
];

const characterTypes = [
  { value: "teacher", label: "Professional Teacher" },
  { value: "student", label: "Student" },
  { value: "scientist", label: "Scientist/Expert" },
  { value: "mentor", label: "Friendly Mentor" },
  { value: "coach", label: "Educational Coach" },
  { value: "custom", label: "Custom Character" },
];

const ratioOptions = [
  { value: "16:9", label: "Classic (16:9)" },
  { value: "9:16", label: "Shorts (9:16)" },
  { value: "5:2", label: "Banner (5:2)" },
];

export default function YoutubeThumbnailGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    main_title: "",
    main_image: "",
    background_elements: "",
    color_scheme: "",
    sub_title: "",
    visual_focus: "",
    ratio_size: "16:9" as "16:9" | "9:16" | "5:2",
    style: "ultra_realistic", // Default style
    elements: [] as string[],
    stylePreference: "ai",
    character: {
      type: "",
      description: "",
      expression: "friendly", // default expression
    },
  });
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(
    null
  );
  const [logo, setLogo] = useState<File | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setLogo(e.target.files[0]);
    }
  };

  const handleFillWithAI = async () => {
    if (!formData.main_title) {
      toast.error("Please enter a main title first");
      return;
    }

    setIsLoading(true);
    try {
      const aiSuggestions = await generateWithAI(formData.main_title);
      setFormData((prev) => ({
        ...prev,
        ...aiSuggestions,
      }));
      toast.success("AI suggestions applied successfully");
    } catch (error) {
      console.error("AI fill error:", error);
      toast.error("Failed to generate AI suggestions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.main_title) {
      toast.error("Please enter a main title");
      return;
    }

    setIsLoading(true);
    try {
      const thumbnail = await generateThumbnail({
        ...formData,
        logo: logo,
      });
      setGeneratedThumbnail(thumbnail.imageUrl);
      toast.success("Thumbnail generated successfully");
    } catch (error) {
      toast.error("Failed to generate thumbnail");
    } finally {
      setIsLoading(false);
    }
  };

  const handleElementToggle = (elementId: string) => {
    setFormData((prev) => ({
      ...prev,
      elements: prev.elements.includes(elementId)
        ? prev.elements.filter((id) => id !== elementId)
        : [...prev.elements, elementId],
    }));
  };

  const handleDownload = async () => {
    if (!generatedThumbnail) return;
    
    try {
      // Fetch the image and convert to blob
      const response = await fetch(generatedThumbnail);
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `thumbnail-${Date.now()}.png`; // Unique filename
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download thumbnail');
    }
  };

  const characterSection = (
    <div className="space-y-4 border-t pt-4">
      <h3 className="font-medium text-lg">AI Character</h3>
      
      <div>
        <Label>Character Type</Label>
        <Select
          value={formData.character.type}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              character: { ...prev.character, type: value },
            }))
          }
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select character type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {characterTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {formData.character.type === "custom" && (
        <div>
          <Label>Custom Character Description</Label>
          <Textarea
            value={formData.character.description}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                character: { ...prev.character, description: e.target.value },
              }))
            }
            placeholder="Describe your character (age, style, appearance, etc.)"
            className="mt-1"
          />
        </div>
      )}

      <div>
        <Label>Expression</Label>
        <Select
          value={formData.character.expression}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              character: { ...prev.character, expression: value },
            }))
          }
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select expression" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="friendly">Friendly & Welcoming</SelectItem>
              <SelectItem value="excited">Excited & Energetic</SelectItem>
              <SelectItem value="thoughtful">Thoughtful & Serious</SelectItem>
              <SelectItem value="surprised">Surprised & Amazed</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Add this helper function to get aspect ratio styles
  const getAspectRatioStyle = () => {
    switch (formData.ratio_size) {
      case "9:16":
        return "aspect-[9/16]";
      case "5:2":
        return "aspect-[5/2]";
      case "16:9":
      default:
        return "aspect-video"; // aspect-video is 16:9
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="container mx-auto py-8 px-4 max-w-5xl space-y-8">
        <Link href="/tools">
          <Button variant="outline" className="mb-2 border-neutral-500">
            ← Back
          </Button>
        </Link>

        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-rose-500">
            YouTube Thumbnail Generator
          </h1>
          <p className="text-muted-foreground text-lg">
            Create eye-catching, professional YouTube thumbnails with AI-powered image generation optimized for maximum CTR.
          </p>
        </div>

        <div className="space-y-8">
          <Card className="p-6">
            <div className="space-y-6">
              {/* Input Fields */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Thumbnail Details</h2>
                <div>
                  <Label>Main Title</Label>
                  <Textarea
                    value={formData.main_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, main_title: e.target.value }))}
                    placeholder="Example: JOIN OUR SCHOOL’S OPEN HOUSE EVENT Large, bold sans-serif font, white with OPEN HOUSE in gold, positioned at the top center."
                    className="mt-1 h-24"
                  />
                </div>
                <div>
                  <Label>Main Image</Label>
                  <Textarea
                    value={formData.main_image}
                    onChange={(e) => setFormData(prev => ({ ...prev, main_image: e.target.value }))}
                    placeholder="Example: A friendly principal in their 40s, wearing formal attire, smiling and standing in front of a well-lit, modern school entrance with welcoming banners."
                  />
                </div>

                <div>
                  <Label>Background Elements</Label>
                  <Textarea
                    value={formData.background_elements}
                    onChange={(e) => setFormData(prev => ({ ...prev, background_elements: e.target.value }))}
                    placeholder="Example: A group of diverse students walking happily into the school, Balloons and banners with WELCOME printed on them, School building with glass windows reflecting natural daylight."
                    className="mt-1 h-24"
                  />
                </div>

                <div>
                  <Label>Color Scheme</Label>
                  <Textarea
                    value={formData.color_scheme}
                    onChange={(e) => setFormData(prev => ({ ...prev, color_scheme: e.target.value }))}
                    placeholder="Example: Bright and inviting – shades of blue and gold, symbolizing excellence and trust."
                    className="mt-1 h-24"
                  />
                </div>

                <div>
                  <Label>Sub Title</Label>
                  <Textarea
                    value={formData.sub_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, sub_title: e.target.value }))}
                    placeholder="Example: Visit, Explore & Enroll Today! – Smaller font, placed at the bottom center in white with a soft drop shadow."
                    className="mt-1 h-24"
                  />
                </div>

                <div>
                  <Label>Visual Focus</Label>
                  <Textarea
                    value={formData.visual_focus}
                    onChange={(e) => setFormData(prev => ({ ...prev, visual_focus: e.target.value }))}
                    placeholder="Example: The principal and students are highlighted with a soft glow effect to make them the central focus. The school entrance is slightly blurred in the background to add depth."
                    className="mt-1 h-24"
                  />
                </div>

                <div>
                  <Label>Thumbnail Style</Label>
                  <Select
                    value={formData.style}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, style: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select thumbnail style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {thumbnailStyles.map((style) => (
                          <SelectItem key={style.value} value={style.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{style.label}</span>
                              <span className="text-xs text-muted-foreground">{style.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Thumbnail Ratio</Label>
                  <Select
                    value={formData.ratio_size}
                    onValueChange={(value: "16:9" | "9:16" | "5:2") => setFormData(prev => ({ ...prev, ratio_size: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ratio" />
                    </SelectTrigger>
                    <SelectContent>
                      {ratioOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* AI Generate Button */}
              <div className="flex gap-4 pt-4 border-t">
                <Button
                  onClick={handleFillWithAI}
                  disabled={isLoading || !formData.main_title}
                  variant="secondary"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Filling...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Fill Inputs with AI
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading || !formData.main_title}
                  className="flex-1"
                >
                  {isLoading ? "Generating..." : "Generate Thumbnail"}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${getAspectRatioStyle()}`}>
              {generatedThumbnail ? (
                <Image
                  src={generatedThumbnail}
                  alt="Generated thumbnail"
                  fill
                  className="object-contain"
                  sizes="(min-width: 1280px) 832px, (min-width: 768px) 80vw, 100vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <p>Thumbnail preview will appear here</p>
                    <p className="text-sm mt-2">Selected ratio: {formData.ratio_size}</p>
                  </div>
                </div>
              )}
            </div>
            {generatedThumbnail && (
              <div className="mt-4 flex gap-4">
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1"
                >
                  Regenerate
                </Button>
                <Button
                  onClick={handleDownload}
                  className="flex-1"
                >
                  Download Thumbnail
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
