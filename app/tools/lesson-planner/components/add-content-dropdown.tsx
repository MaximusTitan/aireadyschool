"use client";

import * as React from "react";
import {
  Plus,
  Upload,
  CheckCircle,
  Loader2,
  Wand2,
  ChevronLeft,
  ChevronRight,
  Image,
  Download,
  Youtube,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

interface AddContentDropdownProps {
  onUpload: (file: File, type: string, url?: string) => Promise<void>;
}

// Enhanced presentation slide type
interface Slide {
  title: string;
  content: string;
  bulletPoints?: string[];
  image?: string; // URL for slide image
}

export function AddContentDropdown({ onUpload }: AddContentDropdownProps) {
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState<string>("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [presentationUrl, setPresentationUrl] = React.useState<string>("");
  const [videoUrl, setVideoUrl] = React.useState<string>("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // State for presentation creation
  const [presentationTopic, setPresentationTopic] = React.useState<string>("");
  const [presentationTheme, setPresentationTheme] =
    React.useState<string>("modern");
  const [presentationTransition, setPresentationTransition] =
    React.useState<string>("slide");
  const [isCreating, setIsCreating] = React.useState(false);
  const [currentTab, setCurrentTab] = React.useState<string>("upload");

  // State for generated presentation
  const [generatedSlides, setGeneratedSlides] = React.useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0);
  const [presentationGenerated, setPresentationGenerated] =
    React.useState(false);
  const [isDownloadingPPTX, setIsDownloadingPPTX] = React.useState(false);
  const [pptxBlob, setPptxBlob] = React.useState<Blob | null>(null);

  const themes = [
    { value: "modern", label: "Modern" },
    { value: "corporate", label: "Corporate" },
    { value: "creative", label: "Creative" },
    { value: "minimal", label: "Minimal" },
    { value: "dark", label: "Dark" },
  ];

  const transitions = [
    { value: "none", label: "None" },
    { value: "fade", label: "Fade" },
    { value: "slide", label: "Slide" },
    { value: "convex", label: "Convex" },
    { value: "concave", label: "Concave" },
    { value: "zoom", label: "Zoom" },
  ];

  const handleOptionClick = (type: string) => {
    setSelectedType(type);
    setIsUploadOpen(true);
    setSelectedFile(null);
    setPresentationUrl("");
    setVideoUrl("");
    setPresentationTopic("");
    setPresentationGenerated(false);
    setGeneratedSlides([]);
    setCurrentTab("upload");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPresentationUrl(e.target.value);
  };

  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoUrl(e.target.value);
  };

  // Generate AI presentation content
  const handleCreatePresentation = async () => {
    if (!presentationTopic.trim()) {
      return;
    }

    setIsCreating(true);
    setGeneratedSlides([]);
    setPresentationGenerated(false);

    try {
      // Call the presentation generator API with explicit image generation
      const response = await fetch("/api/generate-presentation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: presentationTopic,
          theme: presentationTheme,
          transition: presentationTransition,
          slideCount: 8,
          generateImages: true, // Explicitly request image generation
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to generate presentation: ${response.status}`
        );
      }

      const data = await response.json();

      // Only proceed if we have actual presentation data
      if (
        data.presentation &&
        data.presentation.slides &&
        data.presentation.slides.length > 0
      ) {
        console.log("Received real presentation data:", data.presentation);

        // Map the real slides to our Slide format
        const slides: Slide[] = data.presentation.slides.map((slide: any) => ({
          title: slide.title || "Untitled Slide",
          content: slide.content || "",
          bulletPoints: Array.isArray(slide.bulletPoints)
            ? slide.bulletPoints
            : [],
          image: slide.image || "", // Real image from the generator
        }));

        // Set the actual generated slides
        setGeneratedSlides(slides);
        setCurrentSlideIndex(0);
        setPresentationGenerated(true);

        // Store URL if available for linking to the saved presentation
        if (data.url) {
          setPresentationUrl(data.url);
        }
      } else {
        throw new Error("No valid presentation data received from the API");
      }
    } catch (error) {
      console.error("Error creating presentation:", error);
      // Instead of falling back to mock slides, show the error
      alert(
        "Failed to generate presentation: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
      setIsCreating(false);
    } finally {
      setIsCreating(false);
    }
  };

  // Replace your existing handleAddToLesson function with this:
  const handleAddToLesson = async () => {
    if (!presentationGenerated) return;

    try {
      // If we haven't converted to PPTX yet, do that first
      if (!pptxBlob) {
        await handleConvertToPPTX();
      }

      // Once we have the PPTX blob, create a file and upload it
      if (pptxBlob) {
        // Create a consistent name format with proper extension
        const presentationName = presentationTopic
          ? presentationTopic.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30)
          : `presentation_${Date.now()}`;

        // Create an actual PPTX file from the blob
        const pptxFile = new File([pptxBlob], `${presentationName}.pptx`, {
          type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        });

        // Upload the actual PPTX file
        await onUpload(pptxFile, "pptx");
        setIsUploadOpen(false);
      } else {
        // If conversion failed for some reason, use the old method as fallback
        alert(
          "PPTX conversion failed. Please try converting again or upload a different file."
        );
      }
    } catch (error) {
      console.error("Error adding presentation to lesson:", error);
      alert("Error adding presentation to lesson plan. Please try again.");
    }
  };

  const handleUpload = async () => {
    if (selectedType === "presentation") {
      if (selectedFile) {
        try {
          await onUpload(selectedFile, selectedType);
          setIsUploadOpen(false);
        } catch (error) {
          console.error("Error uploading file:", error);
        }
      } else if (presentationUrl) {
        try {
          await onUpload(
            new File([], presentationUrl),
            selectedType,
            presentationUrl
          );
          setIsUploadOpen(false);
        } catch (error) {
          console.error("Error uploading URL:", error);
        }
      }
    } else if (selectedType === "video" && currentTab === "url" && videoUrl) {
      try {
        await onUpload(new File([], videoUrl), selectedType, videoUrl);
        setIsUploadOpen(false);
      } catch (error) {
        console.error("Error uploading video URL:", error);
      }
    } else if (selectedFile) {
      try {
        await onUpload(selectedFile, selectedType);
        setIsUploadOpen(false);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  };

  const handleConvertToPPTX = async () => {
    if (!presentationGenerated) return;

    setIsDownloadingPPTX(true);
    try {
      // First, save the presentation to get its ID
      const saveResponse = await fetch("/api/save-presentation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: presentationTopic || `Presentation_${Date.now()}`,
          slides: generatedSlides,
          theme: presentationTheme,
          transition: presentationTransition,
        }),
      });

      const saveData = await saveResponse.json();

      if (!saveData.success || !saveData.url) {
        throw new Error("Failed to save presentation");
      }

      // Extract the presentation ID from the URL
      const presentationId = saveData.url.split("/").pop();

      // Get the PPTX file from the conversion endpoint
      const response = await fetch(
        `/api/presentation-to-pptx?id=${presentationId}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate PPTX");
      }

      // Get the blob but DON'T download it automatically
      const blob = await response.blob();
      setPptxBlob(blob);

      // Store URL for adding to lesson
      setPresentationUrl(saveData.url);

      // Show success message
      alert(
        'Presentation successfully converted! Click "Add to Lesson" to include it in your plan.'
      );
    } catch (error) {
      console.error("Error converting to PPTX:", error);
      alert("Failed to convert to PPTX. Please try again.");
    } finally {
      setIsDownloadingPPTX(false);
    }
  };

  const nextSlide = () => {
    if (currentSlideIndex < generatedSlides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const getThemeClass = (theme: string) => {
    switch (theme) {
      case "modern":
        return "bg-blue-50 border-blue-100";
      case "corporate":
        return "bg-gray-50 border-gray-100";
      case "creative":
        return "bg-purple-50 border-purple-100";
      case "minimal":
        return "bg-white border-gray-200";
      case "dark":
        return "bg-gray-800 text-white border-gray-700";
      default:
        return "bg-white border-gray-200";
    }
  };

  const getThemeContentClass = (theme: string) => {
    return theme === "dark" ? "text-white" : "text-gray-800";
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Plus className="h-4 w-4 text-pink-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleOptionClick("worksheet")}>
            Worksheet
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleOptionClick("video")}>
            Video
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleOptionClick("presentation")}>
            Presentation
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleOptionClick("quiz")}>
            Quiz
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent
          className={
            presentationGenerated
              ? "sm:max-w-[800px] max-h-[90vh] overflow-y-auto"
              : ""
          }
        >
          <DialogHeader>
            <DialogTitle>Add {selectedType}</DialogTitle>
          </DialogHeader>

          {selectedType === "presentation" ? (
            <>
              {!presentationGenerated ? (
                <Tabs
                  defaultValue="upload"
                  value={currentTab}
                  onValueChange={setCurrentTab}
                  className="w-full"
                >
                  <TabsList>
                    <TabsTrigger value="upload">Upload</TabsTrigger>
                    <TabsTrigger value="url">Add URL</TabsTrigger>
                    <TabsTrigger value="create">Create</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload">
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="file">Choose file</Label>
                        <Input
                          id="file"
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept=".ppt,.pptx,.pdf"
                        />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="url">
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="url">Presentation URL</Label>
                        <Input
                          id="url"
                          type="url"
                          placeholder="https://example.com/presentation.pdf"
                          value={presentationUrl}
                          onChange={handleUrlChange}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="create">
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="topic">Presentation Topic</Label>
                        <Textarea
                          id="topic"
                          placeholder="Enter presentation topic..."
                          value={presentationTopic}
                          onChange={(e) => setPresentationTopic(e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="theme">Theme</Label>
                        <Select
                          value={presentationTheme}
                          onValueChange={setPresentationTheme}
                        >
                          <SelectTrigger id="theme">
                            <SelectValue placeholder="Select theme" />
                          </SelectTrigger>
                          <SelectContent>
                            {themes.map((theme) => (
                              <SelectItem key={theme.value} value={theme.value}>
                                {theme.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="transition">Transition</Label>
                        <Select
                          value={presentationTransition}
                          onValueChange={setPresentationTransition}
                        >
                          <SelectTrigger id="transition">
                            <SelectValue placeholder="Select transition" />
                          </SelectTrigger>
                          <SelectContent>
                            {transitions.map((transition) => (
                              <SelectItem
                                key={transition.value}
                                value={transition.value}
                              >
                                {transition.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <div className="mt-4">
                    {currentTab === "upload" && (
                      <Button
                        onClick={handleUpload}
                        disabled={!selectedFile}
                        className="w-full"
                      >
                        Upload
                      </Button>
                    )}

                    {currentTab === "url" && (
                      <Button
                        onClick={handleUpload}
                        disabled={!presentationUrl}
                        className="w-full"
                      >
                        Add Presentation URL
                      </Button>
                    )}

                    {currentTab === "create" && (
                      <Button
                        onClick={handleCreatePresentation}
                        disabled={!presentationTopic.trim() || isCreating}
                        className="w-full"
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating real AI presentation...
                          </>
                        ) : (
                          <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Generate Presentation
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </Tabs>
              ) : (
                <div className="py-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">{presentationTopic}</h3>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleConvertToPPTX}
                      disabled={isDownloadingPPTX}
                      className="flex items-center"
                    >
                      {isDownloadingPPTX ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Converting...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Convert to PPTX
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={prevSlide}
                        disabled={currentSlideIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span>
                        Slide {currentSlideIndex + 1} of{" "}
                        {generatedSlides.length}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={nextSlide}
                        disabled={
                          currentSlideIndex === generatedSlides.length - 1
                        }
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {generatedSlides.length > 0 && (
                    <Card
                      className={`p-6 border ${getThemeClass(presentationTheme)}`}
                    >
                      <div
                        className={`flex flex-col ${getThemeContentClass(presentationTheme)}`}
                      >
                        <h2 className="text-xl font-bold mb-4">
                          {generatedSlides[currentSlideIndex].title}
                        </h2>

                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Image section */}
                          {generatedSlides[currentSlideIndex].image && (
                            <div className="md:w-1/2 h-[220px] overflow-hidden rounded-md bg-gray-100 relative border border-gray-200">
                              <div className="absolute inset-0 flex items-center justify-center z-10">
                                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                              </div>
                              <img
                                key={`slide-image-${currentSlideIndex}`} // Add this key for proper re-rendering
                                src={generatedSlides[currentSlideIndex].image}
                                alt={generatedSlides[currentSlideIndex].title}
                                className="w-full h-full object-contain relative z-20"
                                onLoad={(e) => {
                                  // When image loads, hide the loader
                                  const target = e.target as HTMLImageElement;
                                  target.style.opacity = "1";
                                  // Find parent and hide loader
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const loader = parent.querySelector("div");
                                    if (loader) loader.style.display = "none";
                                  }
                                }}
                                onError={(e) => {
                                  console.error(
                                    "Failed to load AI-generated image:",
                                    generatedSlides[currentSlideIndex].image
                                  );
                                  // Instead of showing a generic placeholder, create a text placeholder with slide title
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";

                                  // Find parent and show an error message
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const loader = parent.querySelector("div");
                                    if (loader) {
                                      loader.innerHTML = `
                                        <div class="text-center p-4">
                                          <div class="text-red-500 mb-2">Image unavailable</div>
                                          <div class="text-sm text-gray-500">AI-generated image failed to load</div>
                                        </div>
                                      `;
                                      loader.classList.remove("animate-spin");
                                    }
                                  }
                                }}
                                style={{
                                  opacity: 0,
                                  transition: "opacity 0.3s ease",
                                }}
                              />
                            </div>
                          )}

                          {/* Content section */}
                          <div className="md:w-1/2 flex flex-col">
                            <p className="mb-4">
                              {generatedSlides[currentSlideIndex].content}
                            </p>

                            {generatedSlides[currentSlideIndex]
                              .bulletPoints && (
                              <ul className="space-y-2 mt-auto">
                                {generatedSlides[
                                  currentSlideIndex
                                ].bulletPoints?.map((point, i) => (
                                  <li key={i} className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  <div className="mt-4">
                    <Button
                      onClick={handleAddToLesson}
                      className="w-full"
                      disabled={isDownloadingPPTX}
                    >
                      Add to Lesson
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : selectedType === "video" ? (
            <Tabs
              defaultValue="upload"
              value={currentTab}
              onValueChange={setCurrentTab}
              className="w-full"
            >
              <TabsList>
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="url">YouTube URL</TabsTrigger>
              </TabsList>
              <TabsContent value="upload">
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="file">Choose video file</Label>
                    <Input
                      id="file"
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="video/*"
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="url">
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="videoUrl">YouTube URL</Label>
                    <Input
                      id="videoUrl"
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={videoUrl}
                      onChange={handleVideoUrlChange}
                    />
                  </div>
                </div>
              </TabsContent>
              <div className="mt-4">
                <Button
                  onClick={handleUpload}
                  disabled={
                    (currentTab === "upload" && !selectedFile) ||
                    (currentTab === "url" && !videoUrl)
                  }
                  className="w-full"
                >
                  {currentTab === "upload" ? (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Video
                    </>
                  ) : (
                    <>
                      <Youtube className="mr-2 h-4 w-4" />
                      Add YouTube Video
                    </>
                  )}
                </Button>
              </div>
            </Tabs>
          ) : (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="file">Choose file</Label>
                <Input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept={
                    selectedType === "worksheet"
                      ? ".doc,.docx,.pdf"
                      : selectedType === "quiz"
                        ? ".pdf,.doc,.docx"
                        : undefined
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedType !== "presentation" && selectedType !== "video" && (
              <Button onClick={handleUpload} disabled={!selectedFile}>
                Upload
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
