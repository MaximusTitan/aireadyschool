"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { generatePresentation } from "../actions/generatePresentation"
import { extractFromText, generateUsingAI } from "../actions/aiActions"
import { savePresentation } from "../actions/savePresentations"
import type { Presentation, SlideLayout, Slide } from "../types/presentation"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Edit, Play, Wand2, Save } from "lucide-react"
import { RevealPresentation } from "./RevealPresentation"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { Spinner } from "@/components/ui/spinner"
import { ShareButton } from "./ShareButton"
import { YouTubeVideoInput } from "./YouTubeVideoInput"
import { PresentationHistory } from "./PresentationHistory"
import { PlaceholderImage } from "@/app/components/ui/placeholder-image"
import { useAuth } from "@/hooks/use-auth" // Create this hook if you haven't already
import { createClient } from "@/utils/supabase/client"
import { updatePresentation } from "../actions/updatePresentation"; // Add this import

// Add this helper function after the imports
const extractVideoId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

// Add this helper function after your imports
const getYouTubeEmbedUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    let videoId = "";
    if (parsedUrl.hostname === "youtu.be") {
      videoId = parsedUrl.pathname.slice(1);
    } else {
      videoId = parsedUrl.searchParams.get("v") || "";
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  } catch {
    return "";
  }
};

// Add this helper function after your imports
const extractYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// Add this debug helper function
const debugVideoData = (videoId: string | null, embedUrl: string) => {
};

interface PresentationFormProps {
  onGenerated: (presentation: Presentation) => void
}

export default function PresentationForm({ onGenerated }: PresentationFormProps) {
  const { toast } = useToast()
  const [prompt, setPrompt] = useState("")
  const [detailedContent, setDetailedContent] = useState("")
  const [theme, setTheme] = useState("modern")
  const [slideCount, setSlideCount] = useState(5)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [generateImages, setGenerateImages] = useState(true)
  const [generatedPresentation, setGeneratedPresentation] = useState<Presentation | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [transition, setTransition] = useState<"none" | "fade" | "slide" | "convex" | "concave" | "zoom">("slide")
  const [learningObjective, setLearningObjective] = useState("")
  const [relevantTopic, setRelevantTopic] = useState("")
  const [relevantTopics, setRelevantTopics] = useState<string[]>([])
  const [formChanged, setFormChanged] = useState(false)
  const presentationRef = useRef<HTMLDivElement>(null)
  const [presentationId, setPresentationId] = useState<string>("")
  const [showAdditionalInputs, setShowAdditionalInputs] = useState(false)
  const [isSmartExtractDisabled, setIsSmartExtractDisabled] = useState(false)
  const [isGenerateUsingAIDisabled, setIsGenerateUsingAIDisabled] = useState(false)
  const [selectedModel, setSelectedModel] = useState<"gpt4o" | "groq">("gpt4o")
  const [videoUrls, setVideoUrls] = useState<string[]>([])
  const [videoInput, setVideoInput] = useState("")
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [presentations, setPresentations] = useState<Presentation[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewPresentation, setIsNewPresentation] = useState(true);

  const themes = [
    { value: "modern", label: "Modern" },
    { value: "corporate", label: "Corporate" },
    { value: "creative", label: "Creative" },
    { value: "minimal", label: "Minimal" },
    { value: "dark", label: "Dark" },
  ]

  const transitions = [
    { value: "none", label: "None" },
    { value: "fade", label: "Fade" },
    { value: "slide", label: "Slide" },
    { value: "convex", label: "Convex" },
    { value: "concave", label: "Concave" },
    { value: "zoom", label: "Zoom" },
  ]

  const models = [
    { value: "gpt4o", label: "GPT-4o" },
    { value: "groq", label: "Groq" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) {
      toast({
        title: "Error",
        description: "Please sign in to create presentations",
        variant: "destructive",
      })
      return
    }
    setIsGenerating(true);
    setFormChanged(false);
    try {
      // Generate the initial presentation
      const presentation = await generatePresentation(
        prompt,
        theme,
        slideCount,
        learningObjective,
        "general",
        detailedContent,
        false,
        false,
        true,
        generateImages,
        selectedModel
      );

      if (presentation && presentation.slides && presentation.slides.length > 0) {
        // Add video slides if there are any video URLs
        let updatedSlides = [...presentation.slides];
        
        // Add video slides after the first slide
        if (videoUrls.length > 0) {
          const videoSlides = videoUrls.map((url, index) => ({
            id: nanoid(),
            title: "Video Content",
            content: "",
            videoUrl: url,
            layout: "videoSlide" as SlideLayout,
            order: index + 1, // Start after the first slide
          }));

          // Insert video slides after the first slide
          updatedSlides.splice(1, 0, ...videoSlides);
        }

        const presentationToSave = {
          ...presentation,
          email: userEmail, // Add email to the presentation data
          slides: updatedSlides,
          theme: presentation.theme || theme,
          transition: presentation.transition || transition,
        };

        const { id, error } = await savePresentation(presentationToSave);
        if (error) throw new Error(error);

        setPresentationId(id);
        setGeneratedPresentation(presentationToSave);
        onGenerated(presentationToSave);

        toast({
          title: "Presentation generated",
          description: `Your presentation with ${updatedSlides.length} slides has been created and saved.`,
        });
      }
      // ... rest of the error handling
    } catch (error) {
      // ... existing error handling ...
    } finally {
      setIsGenerating(false);
      setIsNewPresentation(true); // Mark as new presentation when generating
    }
  };

  const handleGenerateUsingAI = async () => {
    setIsExtracting(true)
    setIsSmartExtractDisabled(true)
    try {
      const result = await generateUsingAI(prompt)
      if (result) {
        setPrompt(result.topic)
        setLearningObjective(result.learningObjective)
        setRelevantTopics(result.keyConceptsArray)
        setSlideCount(result.slideCount)
        setTheme(result.theme)
        setTransition(result.transition as "none" | "fade" | "slide" | "convex" | "concave" | "zoom")
        setFormChanged(true)
        setShowAdditionalInputs(true)
        toast({
          title: "AI Generation Complete",
          description:
            "Additional inputs are now visible. You can review and edit them before generating the presentation.",
        })
      }
    } catch (error) {
      console.error("Error generating using AI:", error)
      toast({
        title: "Error",
        description: "Failed to generate content using AI. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExtracting(false)
      setIsSmartExtractDisabled(false)
    }
  }

  const handleSmartExtract = async () => {
    if (!detailedContent) {
      toast({
        title: "Error",
        description: "Please provide detailed content for extraction.",
        variant: "destructive",
      })
      return
    }

    setIsExtracting(true)
    setIsGenerateUsingAIDisabled(true)
    try {
      const result = await extractFromText(detailedContent)
      if (result) {
        setPrompt(result.topic)
        setLearningObjective(result.learningObjective)
        setRelevantTopics(result.keyConceptsArray)
        setSlideCount(result.slideCount)
        setTheme(result.theme)
        setTransition(result.transition as "none" | "fade" | "slide" | "convex" | "concave" | "zoom")
        setFormChanged(true)
        setShowAdditionalInputs(true)
        toast({
          title: "Extraction Complete",
          description: "Additional inputs are now visible. You can review and edit the extracted information.",
        })
      }
    } catch (error) {
      console.error("Error extracting from text:", error)
      toast({
        title: "Error",
        description: "Failed to extract information from the text. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExtracting(false)
      setIsGenerateUsingAIDisabled(false)
    }
  }

  const handleSave = (updatedPresentation: Presentation) => {
    setGeneratedPresentation(updatedPresentation)
    onGenerated(updatedPresentation)
    setHasUnsavedChanges(true);
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsEditing(!isEditing)
    if (!isEditing) {
      setHasUnsavedChanges(false);
      toast({
        title: "Edit mode activated",
        description: "Click on any text in the presentation to edit. Click 'Exit Edit Mode' when finished.",
      })
    }
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    setFormChanged(true)
    if (generatedPresentation) {
      const updatedPresentation = { ...generatedPresentation, theme: newTheme }
      setGeneratedPresentation(updatedPresentation)
      onGenerated(updatedPresentation)
    }
  }

  const handleTransitionChange = (newTransition: string) => {
    setTransition(newTransition as "none" | "fade" | "slide" | "convex" | "concave" | "zoom")
    setFormChanged(true)
    if (generatedPresentation) {
      const updatedPresentation = { ...generatedPresentation, transition: newTransition }
      setGeneratedPresentation(updatedPresentation)
      onGenerated(updatedPresentation)
    }
  }

  const handlePresent = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      if (presentationRef.current) {
        // Check if fullscreen is supported and enter fullscreen
        if (document.fullscreenEnabled) {
          await presentationRef.current.requestFullscreen();
        } else if ((document as any).webkitRequestFullscreen) {
          await (presentationRef.current as any).webkitRequestFullscreen();
        } else if ((document as any).msRequestFullscreen) {
          await (presentationRef.current as any).msRequestFullscreen();
        } else {
          throw new Error('Fullscreen not supported');
        }
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
      toast({
        title: "Fullscreen Error",
        description: "Could not enter fullscreen mode. Please try using F11 instead.",
        variant: "destructive",
      });
    }
  };

  const addRelevantTopic = () => {
    if (relevantTopic.trim() !== "") {
      setRelevantTopics([...relevantTopics, relevantTopic.trim()])
      setRelevantTopic("")
      setFormChanged(true)
    }
  }

  const removeRelevantTopic = (topic: string) => {
    setRelevantTopics(relevantTopics.filter((t) => t !== topic))
    setFormChanged(true)
  }

  // Update the handleAddVideo function
  const handleAddVideo = async () => {
    if (!videoInput) return;
    
    const videoId = extractYoutubeId(videoInput);
    if (!videoId) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    setVideoUrls(prev => [...prev, embedUrl]);
    setVideoInput("");
    
    if (generatedPresentation) {
      const newSlide: Slide = {
        id: nanoid(),
        title: "Video Content",
        content: "",
        videoUrl: embedUrl,
        layout: "videoSlide",
        order: currentSlideIndex + 1,
      };

      const updatedSlides = [...generatedPresentation.slides];
      updatedSlides.splice(currentSlideIndex + 1, 0, newSlide);
      
      const updatedPresentation = {
        ...generatedPresentation,
        slides: updatedSlides,
      };

      setGeneratedPresentation(updatedPresentation);
      onGenerated(updatedPresentation);
      
      toast({
        title: "Video Added",
        description: "Video has been added as a new slide",
      });
    }
  };

  const removeVideo = (index: number) => {
    const videoUrl = videoUrls[index]
    const updatedUrls = videoUrls.filter((_, i) => i !== index)
    setVideoUrls(updatedUrls)
  
    if (generatedPresentation) {
      const updatedSlides = generatedPresentation.slides.filter(
        slide => slide.videoUrl !== videoUrl
      )
      const updatedPresentation = {
        ...generatedPresentation,
        slides: updatedSlides,
      }
      setGeneratedPresentation(updatedPresentation)
      onGenerated(updatedPresentation)
      setFormChanged(true)
    }
  }

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Update the addYoutubeSlide function
  const addYoutubeSlide = () => {
    if (youtubeUrl) {
      const videoId = extractYoutubeId(youtubeUrl);
      const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : "";
      
      // Debug logging
      debugVideoData(videoId, embedUrl);

      if (videoId && generatedPresentation) {
        const newSlide: Slide = {
          id: nanoid(),
          type: "youtube",
          title: "Video Content",
          content: "",
          videoUrl: embedUrl,
          layout: "videoSlide",
          order: currentSlideIndex + 1,
        };

        const updatedSlides = [...generatedPresentation.slides];
        // Insert after current slide
        updatedSlides.splice(currentSlideIndex + 1, 0, newSlide);
      

        const updatedPresentation = {
          ...generatedPresentation,
          slides: updatedSlides,
        };
        
        setGeneratedPresentation(updatedPresentation);
        onGenerated(updatedPresentation);
        setYoutubeUrl("");
        
        toast({
          title: "Success",
          description: "YouTube video slide added successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Invalid YouTube URL or no presentation",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    if (generatedPresentation && presentationRef.current) {
      const revealElement = presentationRef.current.querySelector(".reveal") as HTMLElement
      if (revealElement && typeof window !== "undefined" && (window as any).Reveal) {
        ;(window as any).Reveal.initialize({
          width: 1280,
          height: 720,
          margin: 0.04,
          minScale: 0.2,
          maxScale: 2.0,
          transition: transition,
        })
      }
    }
  }, [generatedPresentation, transition])

  useEffect(() => {
    const fetchPresentations = async () => {
      setIsLoadingHistory(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user?.email) {
          throw new Error("User not authenticated")
        }
  
        const { data: presentations, error } = await supabase
          .from("shared_presentations")
          .select("*")
          .eq("email", user.email)
          .order("created_at", { ascending: false })
  
        if (error) throw error
  
        setPresentations(presentations || [])
      } catch (error) {
        console.error("Error fetching presentations:", error)
        toast({
          title: "Error",
          description: "Failed to load presentation history",
          variant: "destructive",
        })
      } finally {
        setIsLoadingHistory(false)
      }
    }
  
    fetchPresentations()
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      }
    }
    fetchUser()
  }, [])

  const handleSelectPresentation = (presentation: Presentation) => {
    setGeneratedPresentation(presentation)
    setTheme(presentation.theme)
    setTransition(presentation.transition as typeof transition)
    onGenerated(presentation)
    setIsNewPresentation(false); // Set this to false for historical presentations
    setHasUnsavedChanges(false); // Reset unsaved changes
    setIsEditing(false); // Disable edit mode
    toast({
      title: "Presentation loaded",
      description: "This is a historical presentation. Generate a new one to edit.",
    });
  }

  function nanoid(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Add this function to handle saving changes
  const handleSaveChanges = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    if (!generatedPresentation || !presentationId) return;

    try {
      setIsLoading(true);
      const updatedPresentation = await updatePresentation({
        id: presentationId,
        presentation: {
          ...generatedPresentation,
          theme,
          transition,
          lastEdited: new Date().toISOString(),
        },
      });

      setGeneratedPresentation(updatedPresentation);
      setHasUnsavedChanges(false);
      toast({
        title: "Changes saved",
        description: "Your presentation has been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to check if form has changes
  const hasFormChanges = () => {
    return formChanged || detailedContent.length > 0 || prompt.length > 0;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <PresentationHistory
          presentations={presentations}
          onSelect={handleSelectPresentation}
          isLoading={isLoadingHistory}
        />
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="detailedContent">Detailed Content (Optional)</Label>
          <Textarea
            id="detailedContent"
            value={detailedContent}
            onChange={(e) => {
              setDetailedContent(e.target.value)
              setFormChanged(true)
            }}
            placeholder="Enter detailed content for your presentation..."
            className="h-40"
          />
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSmartExtract}
              disabled={isExtracting || !detailedContent || isSmartExtractDisabled}
              className="mt-2"
            >
              {isExtracting ? <Spinner className="mr-2 h-4 w-4" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Smart Extract
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex-grow">
            <Label htmlFor="prompt">Presentation Topic</Label>
            <Input
              id="prompt"
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value)
                setFormChanged(true)
              }}
              placeholder="e.g., The Solar System for 5th Graders"
              required
            />
          </div>
          <Button
            type="button"
            onClick={handleGenerateUsingAI}
            disabled={isExtracting || !prompt || isGenerateUsingAIDisabled}
            className="mt-6"
          >
            {isExtracting ? <Spinner className="mr-2 h-4 w-4" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Generate Using AI
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="model">AI Model</Label>
            <Select value={selectedModel} onValueChange={(value) => setSelectedModel(value as "gpt4o" | "groq")}>
              <SelectTrigger id="model">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="theme">Theme</Label>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger id="theme">
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                {themes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="transition">Transition</Label>
            <Select value={transition} onValueChange={handleTransitionChange}>
              <SelectTrigger id="transition">
                <SelectValue placeholder="Select a transition" />
              </SelectTrigger>
              <SelectContent>
                {transitions.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {showAdditionalInputs && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="slideCount">Number of Slides: {slideCount}</Label>
                <Slider
                  id="slideCount"
                  min={2}
                  max={8}
                  step={1}
                  value={[slideCount]}
                  onValueChange={(value) => {
                    setSlideCount(value[0])
                    setFormChanged(true)
                  }}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="imageGeneration">Image Generation</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {generateImages ? "On" : "Off"}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    <DropdownMenuItem
                      onClick={() => {
                        setGenerateImages(true)
                        setFormChanged(true)
                      }}
                    >
                      On
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setGenerateImages(false)
                        setFormChanged(true)
                      }}
                    >
                      Off
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="learningObjective">Learning Objective</Label>
                <Input
                  id="learningObjective"
                  value={learningObjective}
                  onChange={(e) => {
                    setLearningObjective(e.target.value)
                    setFormChanged(true)
                  }}
                  placeholder="Enter the main learning objective"
                />
              </div>
              <div>
                <Label htmlFor="relevantTopics">Key Concepts</Label>
                <div className="flex space-x-2">
                  <Input
                    id="relevantTopics"
                    value={relevantTopic}
                    onChange={(e) => {
                      setRelevantTopic(e.target.value)
                      setFormChanged(true)
                    }}
                    placeholder="Add key concepts to cover"
                  />
                  <Button onClick={addRelevantTopic} type="button">
                    Add
                  </Button>
                </div>
                {relevantTopics.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {relevantTopics.map((topic) => (
                      <span
                        key={topic}
                        className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center"
                      >
                        {topic}
                        <button
                          onClick={() => {
                            removeRelevantTopic(topic)
                          }}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="videoUrl">YouTube Videos (Max 5)</Label>
                <div className="flex space-x-2">
                  <Input
                    id="videoUrl"
                    value={videoInput}
                    onChange={(e) => setVideoInput(e.target.value)}
                    placeholder="Paste YouTube video URL here"
                    disabled={videoUrls.length >= 5}
                  />
                  <Button
                    type="button"
                    onClick={handleAddVideo}
                    disabled={!videoInput || videoUrls.length >= 5}
                  >
                    Add Video
                  </Button>
                </div>
                {videoUrls.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {videoUrls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                        <span className="truncate max-w-[80%]">{url}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVideo(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex space-x-2">
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex items-center gap-4 mt-4">
          <Button 
            type="submit" 
            disabled={isGenerating || !prompt}
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
          >
            {isGenerating ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Generating...
              </>
            ) : (
              "Generate Presentation"
            )}
          </Button>

          {generatedPresentation && (
            <>
              {isNewPresentation && ( // Only show edit and save buttons for new presentations
                <>
                  <Button 
                    onClick={handleEdit} 
                    type="button"
                    variant={isEditing ? "secondary" : "outline"}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {isEditing ? "Exit Edit Mode" : "Edit Presentation"}
                  </Button>
                  
                  {hasUnsavedChanges && (
                    <Button 
                      onClick={handleSaveChanges}
                      type="button"
                      variant="secondary"
                      className="bg-green-100 hover:bg-green-200"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}

              {isNewPresentation && !hasUnsavedChanges && (
                <ShareButton presentationId={presentationId} />
              )}
              
              {isNewPresentation && hasUnsavedChanges && (
                <div className="text-yellow-600 text-sm">
                  ⚠️ Save changes before sharing
                </div>
              )}
            </>
          )}
        </div>
      </form>
      {generatedPresentation && (
        <div>

          <div className="mt-4"></div>
            <h2 className="text-2xl font-bold mb-4">Generated Presentation</h2>
            <div ref={presentationRef} className="w-full mt-8">
              <div className="w-full overflow-hidden">
                <RevealPresentation
                  key={`${generatedPresentation.id}-${theme}-${transition}`}
                  presentation={generatedPresentation}
                  onSave={handleSave}
                  isEditing={isEditing}
                  theme={theme}
                  transition={transition}
                />
              </div>
            </div>
          </div>
      )}
      <div className="mt-4 p-4 bg-blue-100 border border-blue-300 rounded-md text-blue-800">
        <p className="text-sm font-medium">
          Click the Present button to enter fullscreen mode and 'Esc' to exit.
        </p>
      </div>
    </div>
  )
}

