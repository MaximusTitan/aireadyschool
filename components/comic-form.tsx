"use client";

import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { COMIC_FORMATS } from '@/types/comic';

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
  numPanels: "8", // Changed default to 8 panels
  comicStyle: "Cartoon",
  dialogueTone: "Funny",
  endingStyle: "Happy Ending",
  additionalDetails: "",
};

export function ComicForm({ onSubmit, isLoading = false, initialPrompt = "" }: ComicFormProps) {
  const [formData, setFormData] = useState<ComicFormData>(DEFAULT_FORM_DATA);
  const [originalTitle, setOriginalTitle] = useState(""); // Store original title
  const [aiLoading, setAiLoading] = useState(false);
  const [useOpenAI, setUseOpenAI] = useState(false);
  const aiProvider = useOpenAI ? 'openai' : 'groq';
  const { toast } = useToast();

  useEffect(() => {
    if (initialPrompt) {
      setFormData(prev => ({
        ...prev,
        title: initialPrompt
      }));
    }
  }, [initialPrompt]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'title') {
      setOriginalTitle(value); // Store original title
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Use original title in final submission
    const finalFormData = {
      ...formData,
      title: originalTitle || formData.title
    };
    onSubmit(finalFormData, aiProvider);
  };

  const generateWithAI = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a comic title first",
        variant: "destructive"
      });
      return;
    }

    setAiLoading(true);

    try {
      const response = await fetch("/api/comic-form-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: formData.title,
          provider: aiProvider
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate suggestions");
      }
      
      // Check if we have an error from our fallback response
      if (data.error) {
        toast({
          title: "Warning",
          description: "We had some issues processing your request, but we've provided some suggestions anyway.",
          variant: "default"
        });
      }
      
      // Extract clean title from original form title
      const cleanTitle = formData.title.replace(/^Create a.*titled\s*"([^"]+)".*$/i, '$1').trim();
      
      setFormData({
        ...formData,
        // Set clean title if it's a verbose generated title
        title: formData.title.includes('panel') ? cleanTitle : formData.title,
        mainCharacters: data.mainCharacters || "",
        setting: data.setting || "",
        numPanels: typeof data.numPanels === 'number' ? String(data.numPanels) : 
                  typeof data.numPanels === 'string' ? data.numPanels : "8", // Default to 8
        comicStyle: data.comicStyle || "Cartoon",
        dialogueTone: data.dialogueTone || "Funny",
        endingStyle: data.endingStyle || "Happy Ending",
        additionalDetails: data.additionalDetails || "",
      });
      
      toast({
        title: "Form Generated",
        description: "We've filled in the form with suggested details for your comic.",
      });
    } catch (error) {
      console.error("Error generating AI suggestions:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate suggestions",
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

  const handlePanelCountChange = async (value: string) => {
    const panelCount = Number(value);
    const format = getFormatForPanelCount(panelCount);
    const structure = COMIC_FORMATS[format];

    // Regenerate form data based on new panel count
    if (formData.title) {
      setAiLoading(true);
      try {
        const response = await fetch("/api/comic-form-generator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            title: formData.title,
            provider: aiProvider,
            panelCount,
            format
          }),
        });

        const data = await response.json();
        
        setFormData(prev => ({
          ...prev,
          numPanels: value,
          // Update other fields with new AI suggestions
          mainCharacters: data.mainCharacters || prev.mainCharacters,
          setting: data.setting || prev.setting,
          dialogueTone: data.dialogueTone || prev.dialogueTone,
          additionalDetails: [
            prev.additionalDetails,
            `Format: ${format} (${panelCount} panels)`,
            `Structure: ${structure.structure.slice(0, panelCount).join(' → ')}`
          ].filter(Boolean).join('\n')
        }));

      } catch (error) {
        console.error("Error updating form:", error);
      } finally {
        setAiLoading(false);
      }
    } else {
      // Just update panel count if no title yet
      setFormData(prev => ({
        ...prev,
        numPanels: value
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-end space-x-2 mb-4">
        <Label htmlFor="ai-model" className="text-sm">
          {useOpenAI ? "Using: OpenAI" : "Using: Groq"}
        </Label>
        <Switch
          id="ai-model"
          checked={useOpenAI}
          onCheckedChange={setUseOpenAI}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Comic Title</Label>
            <div className="flex gap-2">
              <Input
                id="title"
                name="title"
                placeholder="Battle of Titans: Batman vs Superman"
                value={formData.title}
                onChange={handleInputChange}
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={generateWithAI}
                disabled={aiLoading || !formData.title.trim()}
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating
                  </>
                ) : (
                  "Generate with AI"
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mainCharacters">Main Characters</Label>
            <Input
              id="mainCharacters"
              name="mainCharacters"
              placeholder="Batman, Superman, Joker"
              value={formData.mainCharacters}
              onChange={handleInputChange}
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numPanels">Number of Panels</Label>
            <Select
              value={formData.numPanels}
              onValueChange={handlePanelCountChange}
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

        {/* Right column */}
        <div className="space-y-4">

          <div className="space-y-2">
            <Label htmlFor="dialogueTone">Dialogue Tone</Label>
            <Select
              value={formData.dialogueTone}
              onValueChange={(value) => handleSelectChange("dialogueTone", value)}
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
            <Label htmlFor="additionalDetails">Additional Details</Label>
            <Textarea
              id="additionalDetails"
              name="additionalDetails"
              placeholder="Add any other details about your comic..."
              value={formData.additionalDetails}
              onChange={handleInputChange}
              className="min-h-[80px]"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || !formData.title.trim()}>
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
