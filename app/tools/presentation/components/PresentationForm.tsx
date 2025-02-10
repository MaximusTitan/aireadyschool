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
import { X } from "lucide-react";

interface PresentationFormProps {
  onGenerated: (presentation: Presentation) => void;
}

export default function PresentationForm({
  onGenerated,
}: PresentationFormProps) {
  const [prompt, setPrompt] = useState("");
  const [theme, setTheme] = useState("modern");
  const [slideCount, setSlideCount] = useState(5);
  const [learningObjective, setLearningObjective] = useState("");
  const [gradeLevel, setGradeLevel] = useState("elementary");
  const [relevantTopic, setRelevantTopic] = useState("");
  const [relevantTopics, setRelevantTopics] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddTopic = () => {
    if (relevantTopic.trim() !== "") {
      setRelevantTopics([...relevantTopics, relevantTopic.trim()]);
      setRelevantTopic("");
    }
  };

  const handleRemoveTopic = (index: number) => {
    setRelevantTopics(relevantTopics.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      console.log(
        "Submitting form with prompt:",
        prompt,
        "theme:",
        theme,
        "slide count:",
        slideCount,
        "learning objective:",
        learningObjective,
        "grade level:",
        gradeLevel,
        "relevant topics:",
        relevantTopics
      );
      const presentation = await generatePresentation(
        prompt,
        theme,
        slideCount,
        learningObjective,
        gradeLevel,
        relevantTopics.join(", "),
        true, // includeQuiz
        true, // includeQuestions
        true  // includeFeedback
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
        <Label htmlFor="learningObjective">Learning Objective</Label>
        <Input
          id="learningObjective"
          value={learningObjective}
          onChange={(e) => setLearningObjective(e.target.value)}
          placeholder="e.g., Understand the structure of the solar system"
          required
        />
      </div>
      <div>
        <Label htmlFor="gradeLevel">Academic/Grade Level</Label>
        <Select value={gradeLevel} onValueChange={setGradeLevel}>
          <SelectTrigger id="gradeLevel">
            <SelectValue placeholder="Select a grade level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="elementary">Elementary School</SelectItem>
            <SelectItem value="high">High School</SelectItem>
            <SelectItem value="college">College</SelectItem>
          </SelectContent>
        </Select>
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
        <Label htmlFor="relevantTopic">Relevant Topic</Label>
        <div className="flex space-x-2">
          <Input
            id="relevantTopic"
            value={relevantTopic}
            onChange={(e) => setRelevantTopic(e.target.value)}
            placeholder="e.g., Planets, Stars, Galaxies"
          />
          <Button type="button" onClick={handleAddTopic}>
            Add
          </Button>
        </div>
        <div className="mt-2 space-y-2">
          {relevantTopics.map((topic, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span>{topic}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveTopic(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
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
