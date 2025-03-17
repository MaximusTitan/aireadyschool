"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { COMIC_FORMATS } from '@/types/comic';
import { getComicStyleNames } from '@/types/comic-styles';

interface ComicFormProps {
  onSubmit: (formData: ComicFormData, provider: string) => void;
  isLoading?: boolean;
  initialPrompt?: string;
}

export interface ComicFormData {
  title: string;
  mainCharacters: string;
  setting: string;
  numPanels: string;
  comicStyle: string;
  dialogueTone: string;
  endingStyle: string;
  additionalDetails: string;
}

const DEFAULT_FORM_DATA: ComicFormData = {
  title: "",
  mainCharacters: "",
  setting: "",
  numPanels: "", // Empty default to force selection
  comicStyle: "", // Empty default to force selection
  dialogueTone: "",
  endingStyle: "",
  additionalDetails: "",
};

// Get available comic styles
const comicStyleOptions = getComicStyleNames();

export function ComicForm({ onSubmit, isLoading = false, initialPrompt = "" }: ComicFormProps) {
  const [formData, setFormData] = useState<ComicFormData>(DEFAULT_FORM_DATA);
  const [aiLoading, setAiLoading] = useState(false);
  const [useOpenAI, setUseOpenAI] = useState(false);
  const aiProvider = useOpenAI ? 'openai' : 'groq';
  const { toast } = useToast();
  
  // Add debug tracker for form changes
  const [formUpdated, setFormUpdated] = useState(false);

  // Set initial prompt if provided
  useEffect(() => {
    if (initialPrompt) {
      setFormData(prev => ({
        ...prev,
        title: initialPrompt
      }));
    }
  }, [initialPrompt]);

  // Generic handler for all input changes
  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    console.log(`Form input changed: ${name} = ${value}`);
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormUpdated(true);
  }, []);

  // Handler for select components
  const handleSelectChange = useCallback((name: string, value: string) => {
    console.log(`Select changed: ${name} = ${value}`);
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormUpdated(true);
  }, []);

  // Form submission handler
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    console.log("FORM SUBMISSION - Final form data:", formData);
    // Verify panel count and style are set
    if (!formData.numPanels) {
      toast({
        title: "Missing panel count",
        description: "Please select the number of panels for your comic",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.comicStyle) {
      toast({
        title: "Missing comic style",
        description: "Please select a style for your comic",
        variant: "destructive"
      });
      return;
    }
    
    onSubmit(formData, aiProvider);
  }, [formData, onSubmit, aiProvider, toast]);

  // Enhanced AI function - only for additional details field
  const enhanceAdditionalDetails = async () => {
    // Check that required fields are filled
    if (!formData.title.trim() || !formData.mainCharacters.trim() || !formData.setting.trim()) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in the title, characters, and setting before enhancing details.",
        variant: "destructive"
      });
      return;
    }

    setAiLoading(true);

    try {
      // Create a prompt that includes all the form fields to give AI context
      const contextPrompt = `
Title: ${formData.title}
Main Characters: ${formData.mainCharacters}
Setting: ${formData.setting}
Number of Panels: ${formData.numPanels}
Comic Style: ${formData.comicStyle}
Dialogue Tone: ${formData.dialogueTone}
Ending Style: ${formData.endingStyle}
`;

      const response = await fetch("/api/enhance-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          context: contextPrompt,
          provider: aiProvider,
          currentDetails: formData.additionalDetails
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate enhanced details");
      }
      
      // Only update the additionalDetails field
      setFormData(prev => ({
        ...prev,
        additionalDetails: data.enhancedDetails || prev.additionalDetails
      }));
      
      toast({
        title: "Details Enhanced",
        description: "We've added more context and details based on your comic settings.",
      });
    } catch (error) {
      console.error("Error enhancing details with AI:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to enhance details",
        variant: "destructive"
      });
    } finally {
      setAiLoading(false);
    }
  };

  const getFormatForPanelCount = (count: number) => {
    return count <= 4 ? 'short' 
         : count <= 8 ? 'standard'
         : 'detailed';
  };

  const handlePanelCountChange = useCallback(async (value: string) => {
    console.log(`Panel count changed to: ${value}`);
    const panelCount = Number(value);
    
    // Update panel count immediately in the form data
    setFormData(prev => ({
      ...prev,
      numPanels: value
    }));
    setFormUpdated(true);
    
    // No need to call AI to update other fields based on panel count
  }, []);

  // Log form data on changes for debugging
  useEffect(() => {
    if (formUpdated) {
      console.log("Form data updated:", formData);
    }
  }, [formData, formUpdated]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Comic Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Battle of Titans: Batman vs Superman"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mainCharacters">Main Characters</Label>
            <Input
              id="mainCharacters"
              name="mainCharacters"
              placeholder="Batman, Superman, Joker"
              value={formData.mainCharacters}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="setting">Setting/Background</Label>
            <Input
              id="setting"
              name="setting"
              placeholder="Gotham City, Space, Underwater"
              value={formData.setting}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comicStyle" className="flex items-center">
              Comic Style <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select
              value={formData.comicStyle}
              onValueChange={(value) => handleSelectChange("comicStyle", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select comic style" />
              </SelectTrigger>
              <SelectContent>
                {comicStyleOptions.map((style) => (
                  <SelectItem key={style} value={style}>
                    {style}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Style affects both artwork generation and panel appearance
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numPanels" className="flex items-center">
              Number of Panels <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select
              value={formData.numPanels}
              onValueChange={handlePanelCountChange}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select number of panels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 Panels (Short Format)</SelectItem>
                <SelectItem value="6">6 Panels (Standard Format)</SelectItem>
                <SelectItem value="8">8 Panels (Standard Format)</SelectItem>
                <SelectItem value="10">10 Panels (Detailed Format)</SelectItem>
                <SelectItem value="12">12 Panels (Detailed Format)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.numPanels && (
                <>Format: {getFormatForPanelCount(Number(formData.numPanels))}</>
              )}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dialogueTone">Dialogue Tone</Label>
            <Select
              value={formData.dialogueTone}
              onValueChange={(value) => handleSelectChange("dialogueTone", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select dialogue tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Funny">Funny</SelectItem>
                <SelectItem value="Action-Packed">Action-Packed</SelectItem>
                <SelectItem value="Dramatic">Dramatic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endingStyle">Ending Style</Label>
            <Select
              value={formData.endingStyle}
              onValueChange={(value) => handleSelectChange("endingStyle", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select ending style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Happy Ending">Happy Ending</SelectItem>
                <SelectItem value="Mystery">Mystery</SelectItem>
                <SelectItem value="To Be Continued...">To Be Continued...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="additionalDetails">Additional Details</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={enhanceAdditionalDetails}
                disabled={aiLoading || !formData.title.trim() || !formData.mainCharacters.trim() || !formData.setting.trim()}
                className="flex items-center gap-1"
              >
                {aiLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>Enhance with AI</span>
              </Button>
            </div>
            <Textarea
              id="additionalDetails"
              name="additionalDetails"
              placeholder="Add any other details about your comic..."
              value={formData.additionalDetails}
              onChange={handleInputChange}
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              Add story details, special effects, or character relationships
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          size="lg"
          disabled={isLoading || !formData.title.trim() || !formData.mainCharacters.trim() || !formData.setting.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Comic
            </>
          ) : (
            "Generate Comic"
          )}
        </Button>
      </div>
    </form>
  );
}
