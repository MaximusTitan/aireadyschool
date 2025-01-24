"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { generatePresentation } from "../actions/generatePresentation";
import { Presentation } from "../types/presentation";
import { toast } from "@/hooks/use-toast";

interface PresentationFormProps {
  onGenerated: (presentation: Presentation) => void;
}

export default function PresentationForm({
  onGenerated,
}: PresentationFormProps) {
  const [prompt, setPrompt] = useState("");
  const [theme, setTheme] = useState("modern");
  const [slideCount, setSlideCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      console.log(
        "Submitting form with prompt:",
        prompt,
        "theme:",
        theme,
        "and slide count:",
        slideCount
      );
      const presentation = await generatePresentation(
        prompt,
        theme,
        slideCount
      );
      if (
        presentation &&
        presentation.slides &&
        presentation.slides.length > 0
      ) {
        console.log("Presentation generated successfully:", presentation);
        onGenerated(presentation);
        toast({
          title: "Presentation generated",
          description: `Your ${slideCount}-slide presentation has been successfully created.`,
        });
      } else {
        throw new Error(
          "Failed to generate presentation: Invalid or empty response"
        );
      }
    } catch (error) {
      console.error("Error generating presentation:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while generating the presentation",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mb-8">
      <div>
        <Label htmlFor="prompt">Presentation Topic</Label>
        <Input
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., The Solar System for 5th Graders"
          required
        />
      </div>
      <div>
        <Label htmlFor="theme">Theme</Label>
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger id="theme">
            <SelectValue placeholder="Select a theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="modern">Modern</SelectItem>
            <SelectItem value="playful">Playful</SelectItem>
            <SelectItem value="nature">Nature</SelectItem>
            <SelectItem value="tech">Tech</SelectItem>
            <SelectItem value="vintage">Vintage</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="slideCount">Number of Slides: {slideCount}</Label>
        <Slider
          id="slideCount"
          min={3}
          max={15}
          step={1}
          value={[slideCount]}
          onValueChange={(value) => setSlideCount(value[0])}
          className="mt-2"
        />
      </div>
      <Button type="submit" disabled={isGenerating}>
        {isGenerating ? "Generating..." : "Generate Presentation"}
      </Button>
    </form>
  );
}
