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
import type { Presentation } from "../types/presentation"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Download, Edit, Play, Wand2 } from "lucide-react"
import { RevealPresentation } from "./RevealPresentation"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { Spinner } from "@/components/ui/spinner"
import { ShareButton } from "./ShareButton"

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setFormChanged(false)
    try {
      const presentation = await generatePresentation(
        prompt,
        theme,
        slideCount,
        learningObjective,
        "general", // gradeLevel
        detailedContent, // relevantTopic
        false, // includeQuiz
        false, // includeQuestions
        true, // includeFeedback
        generateImages // Pass the generateImages flag
      )

      if (presentation && presentation.slides && presentation.slides.length > 0) {
        const presentationToSave = {
          ...presentation,
          theme: presentation.theme || theme,
          transition: presentation.transition || transition,
        }

        const { id, error } = await savePresentation(presentationToSave)
        if (error) {
          throw new Error(error)
        }

        setPresentationId(id)
        setGeneratedPresentation(presentationToSave)
        onGenerated(presentationToSave)

        toast({
          title: "Presentation generated",
          description: `Your ${slideCount}-slide presentation has been created and saved.`,
        })
      } else {
        throw new Error("Failed to generate presentation: Invalid or empty response")
      }
    } catch (error) {
      console.error("Error generating presentation:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An unexpected error occurred while generating the presentation",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

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
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsEditing(!isEditing)
    if (!isEditing) {
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

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!presentationRef.current || !generatedPresentation) return

    setIsDownloading(true)
    setExportProgress(0)

    try {
      const slideElements = Array.from(
        presentationRef.current.querySelectorAll(".reveal .slides > section"),
      ) as HTMLElement[]

      if (slideElements.length === 0) {
        throw new Error("No slides found")
      }

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [1280, 720],
        hotfixes: ["px_scaling"],
      })

      const container = document.createElement("div")
      container.style.position = "fixed"
      container.style.left = "-9999px"
      container.style.top = "0"
      container.style.width = "1280px"
      container.style.height = "720px"
      document.body.appendChild(container)

      for (let i = 0; i < slideElements.length; i++) {
        try {
          setExportProgress(Math.round(((i + 1) / slideElements.length) * 100))

          if (i > 0) {
            pdf.addPage([1280, 720], "landscape")
          }

          const clonedSlide = slideElements[i].cloneNode(true) as HTMLElement
          container.innerHTML = ""
          container.appendChild(clonedSlide)

          clonedSlide.style.width = "1280px"
          clonedSlide.style.height = "720px"
          clonedSlide.style.position = "relative"
          clonedSlide.style.overflow = "hidden"
          clonedSlide.style.visibility = "visible"
          clonedSlide.style.opacity = "1"

          const themeClass = `theme-${theme}`
          clonedSlide.classList.add(themeClass)

          // Wait for fonts and images to load
          await document.fonts.ready
          await Promise.all(
            Array.from(clonedSlide.getElementsByTagName("img")).map(
              (img) =>
                new Promise((resolve) => {
                  if (img.complete) resolve(true)
                  img.onload = () => resolve(true)
                  img.onerror = () => resolve(false)
                }),
            ),
          )

          // Add a small delay to ensure rendering is complete
          await new Promise((resolve) => setTimeout(resolve, 500))

          const canvas = await html2canvas(clonedSlide, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false,
            width: 1280,
            height: 720,
            windowWidth: 1280,
            windowHeight: 720,
            onclone: (clonedDoc) => {
              const styles = document.getElementsByTagName("style")
              Array.from(styles).forEach((style) => {
                clonedDoc.head.appendChild(style.cloneNode(true))
              })

              const themeStyles = document.querySelectorAll(`style[data-theme="${theme}"]`)
              themeStyles.forEach((style) => {
                clonedDoc.head.appendChild(style.cloneNode(true))
              })

              return Promise.resolve()
            },
          })

          const slideImage = canvas.toDataURL("image/jpeg", 1.0)

          pdf.addImage({
            imageData: slideImage,
            format: "JPEG",
            x: 0,
            y: 0,
            width: 1280,
            height: 720,
            compression: "FAST",
            rotation: 0,
          })
        } catch (error) {
          console.error(`Error processing slide ${i + 1}:`, error)
          toast({
            title: "Warning",
            description: `Error processing slide ${i + 1}. Some slides may be missing.`,
            variant: "destructive",
          })
        }
      }

      document.body.removeChild(container)

      const filename = `${generatedPresentation.topic.replace(/\s+/g, "_")}_presentation.pdf`
      pdf.save(filename)

      toast({
        title: "Success",
        description: "Your presentation has been downloaded as PDF.",
      })
    } catch (error) {
      console.error("Error in PDF generation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate PDF",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
      setExportProgress(0)
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

  return (
    <div className="space-y-8">
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

        <div className="grid grid-cols-2 gap-4">
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
          </>
        )}

        <div className="flex items-center gap-4 mt-4">
          <Button type="submit" disabled={isGenerating || !formChanged}>
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
              <Button onClick={handleEdit} variant={isEditing ? "secondary" : "outline"}>
                <Edit className="mr-2 h-4 w-4" />
                {isEditing ? "Exit Edit Mode" : "Edit Presentation"}
              </Button>
              <Button onClick={handleDownload} variant="outline" disabled={isDownloading}>
                {isDownloading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    <span>Exporting PDF ({exportProgress}%)</span>
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    <span>Download PDF</span>
                  </>
                )}
              </Button>
              {generatedPresentation && presentationId && <ShareButton presentationId={presentationId} />}
            </>
          )}
        </div>
      </form>
      {generatedPresentation && (
        <Button onClick={handlePresent} variant="outline">
          <Play className="mr-2 h-4 w-4" />
          Present
        </Button>
      )}

      {generatedPresentation && (
        <div className="mt-4">
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

