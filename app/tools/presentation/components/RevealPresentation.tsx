"use client"

import { useEffect, useRef, useState } from "react"
import Reveal from "reveal.js"
import "reveal.js/dist/reveal.css"
import "../styles/themes.css"
import type { Presentation, Slide } from "../types/presentation"
import { Button } from "@/components/ui/button"
import { Pencil, RefreshCw, Upload } from "lucide-react"
import { regenerateImage } from "../actions/generatePresentation"
import { toast } from "@/hooks/use-toast"
import type RevealType from "reveal.js"
// Add to the top of your RevealPresentation.tsx file or your global styles
import 'reveal.js/dist/reveal.css'
import 'reveal.js/dist/theme/white.css' // or any other theme you prefer

interface RevealPresentationProps {
  presentation: Presentation
  onSave: (updatedPresentation: Presentation) => void
  isEditing: boolean
  theme: string
  transition: "none" | "fade" | "slide" | "convex" | "concave" | "zoom"
}

export function RevealPresentation({ presentation, onSave, isEditing, theme, transition }: RevealPresentationProps) {
  const revealRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [editedSlides, setEditedSlides] = useState<Slide[]>(presentation.slides)
  const [scale, setScale] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeEditField, setActiveEditField] = useState<{
    slideIndex: number
    field: string
  } | null>(null)
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const revealInstance = useRef<RevealType.Api | null>(null)
  const [initializing, setInitializing] = useState(true)
  const lastKnownSlideIndex = useRef(0)

  const SLIDE_WIDTH = 1280
  const SLIDE_HEIGHT = 720

  const calculateDimensions = () => {
    if (isFullscreen) {
      const windowRatio = window.innerWidth / window.innerHeight;
      const presentationRatio = SLIDE_WIDTH / SLIDE_HEIGHT;

      if (windowRatio > presentationRatio) {
        // Window is wider than needed
        const height = window.innerHeight;
        const width = height * presentationRatio;
        return {
          width,
          height,
          scale: height / SLIDE_HEIGHT,
        };
      } else {
        // Window is taller than needed
        const width = window.innerWidth;
        const height = width / presentationRatio;
        return {
          width,
          height,
          scale: width / SLIDE_WIDTH,
        };
      }
    } else {
      // Preview mode
      const containerWidth = containerRef.current?.offsetWidth || SLIDE_WIDTH;
      const previewScale = containerWidth / SLIDE_WIDTH;
      return {
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        scale: previewScale,
      };
    }
  };

  // Handle resize for both modes
  useEffect(() => {
    const handleResize = () => {
      const { scale } = calculateDimensions();
      setScale(scale);
      
      if (revealInstance.current) {
        revealInstance.current.configure({ 
          width: SLIDE_WIDTH, 
          height: SLIDE_HEIGHT 
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial calculation

    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenMode = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFullscreenMode);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("msfullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    let deck: RevealType.Api | null = null;

    const initializeReveal = async () => {
      if (!revealRef.current || !containerRef.current) return;

      try {
        const themeClasses = ["modern", "corporate", "creative", "minimal", "dark"]
          .map((t) => `theme-${t}`);

        // Safely destroy existing instance
        if (revealInstance.current && typeof revealInstance.current.destroy === 'function') {
          try {
            revealInstance.current.destroy();
          } catch (e) {
            console.warn('Error destroying previous instance:', e);
          }
        }

        const { width, height, scale } = calculateDimensions();
        setScale(scale);

        const config = {
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          margin: 0,
          center: true,
          hash: false,
          transition: transition,
          keyboard: true,
          touch: true,
          controls: true,
          controlsLayout: "edges" as "edges",
          controlsBackArrows: "visible" as "visible",
          progress: true,
          slideNumber: true,
          overview: true,
          embedded: !isFullscreen,
          minScale: 0.2,
          maxScale: 2.0,
          viewDistance: 4,
          display: "block",
          fragmentInURL: false,
          transitionSpeed: 'fast' as 'fast', // Fix: Type assertion for transitionSpeed
          backgroundTransition: 'fade' as const,
          deck: {
            width,
            height,
          },
        };

        // Create new instance
        deck = new Reveal(revealRef.current, config);
        revealInstance.current = deck;

        // Add event listener before initialization
        deck.addEventListener('slidechanged', (event: any) => {
          const slideIndex = event.indexh;
          lastKnownSlideIndex.current = slideIndex;
          setCurrentSlideIndex(slideIndex);
        });

        // Initialize and sync theme
        await deck.initialize();
        
        // Apply theme after initialization
        if (revealRef.current && containerRef.current) {
          revealRef.current.classList.remove(...themeClasses);
          revealRef.current.classList.add(`theme-${theme}`);
          containerRef.current.classList.remove(...themeClasses);
          containerRef.current.classList.add(`theme-${theme}`);
        }

        // Restore slide position
        if (!initializing && lastKnownSlideIndex.current > 0) {
          deck.slide(lastKnownSlideIndex.current, 0, 0);
        }
        
        setInitializing(false);
      } catch (error) {
        console.error('Error initializing Reveal:', error);
      }
    };

    // Initialize
    initializeReveal();

    // Cleanup
    return () => {
      if (deck && typeof deck.destroy === 'function') {
        try {
          deck.destroy();
        } catch (e) {
          console.warn('Error during cleanup:', e);
        }
      }
      revealInstance.current = null;
    };
  }, [isFullscreen, theme, transition, editedSlides]);

  const handleSlideChange = (index: number, field: keyof Slide, value: string | string[]) => {
    const updatedSlides = [...editedSlides];
    updatedSlides[index] = { ...updatedSlides[index], [field]: value };
    setEditedSlides(updatedSlides);
    
    // Store current position before save
    const currentIndex = lastKnownSlideIndex.current;
    
    onSave({ ...presentation, slides: updatedSlides });
    
    // Restore position after save
    if (revealInstance.current) {
      setTimeout(() => {
        revealInstance.current?.slide(currentIndex, 0, 0);
      }, 0);
    }
  };

  const handleRegenerateImage = async (index: number) => {
    setIsRegeneratingImage(true)
    try {
      const slide = editedSlides[index]
      const newImage = await regenerateImage(slide.title, theme)
      const updatedSlides = [...editedSlides]
      updatedSlides[index] = { ...slide, image: newImage }
      setEditedSlides(updatedSlides)
      onSave({ ...presentation, slides: updatedSlides })
      toast({
        title: "Image Regenerated",
        description: "The slide image has been successfully regenerated.",
      })
    } catch (error) {
      console.error("Error regenerating image:", error)
      toast({
        title: "Error",
        description: "Failed to regenerate the image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRegeneratingImage(false)
    }
  }

  const handleUploadImage = async (index: number) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          const reader = new FileReader()
          reader.onload = async (e) => {
            const imageDataUrl = e.target?.result as string
            const updatedSlides = [...editedSlides]
            updatedSlides[index] = { ...updatedSlides[index], image: imageDataUrl }
            setEditedSlides(updatedSlides)
            onSave({ ...presentation, slides: updatedSlides })
            toast({
              title: "Image Uploaded",
              description: "Your image has been successfully uploaded to the slide.",
            })
          }
          reader.readAsDataURL(file)
        } catch (error) {
          console.error("Error uploading image:", error)
          toast({
            title: "Error",
            description: "Failed to upload the image. Please try again.",
            variant: "destructive",
          })
        }
      }
    }
    input.click()
  }

  const EditableText = ({
    value,
    onChange,
    slideIndex,
    field,
    className = "",
    multiline = false,
    style,
  }: {
    value: string
    onChange: (value: string) => void
    slideIndex: number
    field: string
    className?: string
    multiline?: boolean
    style?: React.CSSProperties
  }) => {
    const isActive = activeEditField?.slideIndex === slideIndex && activeEditField?.field === field
    const [editValue, setEditValue] = useState(value)

    const handleDoubleClick = () => {
      if (isEditing) {
        setActiveEditField({ slideIndex, field })
        setEditValue(value)
      }
    }

    const handleBlur = () => {
      if (editValue !== value) {
        onChange(editValue)
      }
      setActiveEditField(null)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleBlur()
      }
      if (e.key === "Escape") {
        setEditValue(value)
        setActiveEditField(null)
      }
    }

    if (!isActive) {
      return (
        <div
          className={`group relative ${className} ${isEditing ? "hover:bg-blue-100 hover:outline hover:outline-2 hover:outline-blue-500" : ""}`}
          onDoubleClick={handleDoubleClick}
          style={{
            ...style,
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}
        >
          {isEditing && (
            <Button
              size="sm"
              variant="ghost"
              className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100"
              onClick={() => setActiveEditField({ slideIndex, field })}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {multiline ? <div className="whitespace-pre-wrap">{value}</div> : <div>{value}</div>}
        </div>
      )
    }

    return multiline ? (
      <textarea
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full bg-transparent resize-none p-0 focus:outline-none focus:ring-0 ${className}`}
        style={{
          height: "auto",
          minHeight: "100px",
          ...style,
        }}
        autoFocus
      />
    ) : (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full bg-transparent p-0 focus:outline-none focus:ring-0 ${className}`}
        style={style}
        autoFocus
      />
    )
  }

  const renderSlideContent = (slide: Slide, index: number) => {
    const isTextLeft = slide.layout === 'textLeft'

    return (
      <div className="flex h-full" data-theme={theme}>
        <div className={`w-1/2 flex flex-col justify-start ${isTextLeft ? "pr-8" : "pl-8"} p-12`}>
          <EditableText
            value={slide.title}
            onChange={(value) => handleSlideChange(index, "title", value)}
            slideIndex={index}
            field="title"
            className="reveal-title text-[48px] font-bold mb-6 leading-tight text-left"
          />
          <EditableText
            value={slide.content || ""}
            onChange={(value) => handleSlideChange(index, "content", value)}
            slideIndex={index}
            field="content"
            className="reveal-content text-[24px] mb-6 leading-relaxed text-left"
            multiline
          />
          {slide.bulletPoints && (
            <ul className="reveal-list text-[24px] space-y-2">
              {slide.bulletPoints.map((point, pointIndex) => (
                <li key={pointIndex} className="reveal-list-item">
                  <EditableText
                    value={point}
                    onChange={(value) => {
                      const newBulletPoints = [...(slide.bulletPoints || [])]
                      newBulletPoints[pointIndex] = value
                      handleSlideChange(index, "bulletPoints", newBulletPoints)
                    }}
                    slideIndex={index}
                    field={`bulletPoint-${pointIndex}`}
                    className="inline-block"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={`w-1/2 flex flex-col items-center justify-center ${isTextLeft ? "pl-8" : "pr-8"} p-12`}>
          <div className="relative w-full">
            {slide.image && (
              <img
                src={slide.image || "/placeholder.svg"}
                alt={slide.title}
                className="reveal-img w-full h-auto object-contain mb-4"
              />
            )}
            {isEditing && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleRegenerateImage(index)}
                  disabled={isRegeneratingImage}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate Image
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleUploadImage(index)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`${isFullscreen ? "fixed inset-0 z-50 bg-black flex items-center justify-center" : "w-full h-full p-2"}`}
      style={{
        minHeight: isFullscreen ? "100vh" : `${SLIDE_HEIGHT}px`,
        aspectRatio: isFullscreen ? "auto" : "16/9",
      }}
    >
      <div
        className={`${isFullscreen ? "w-full h-full flex items-center justify-center" : ""}`}
        style={{
          ...(isFullscreen && {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          })
        }}
      >
        <div 
          ref={revealRef} 
          className={`reveal theme-${theme}`}
          style={{
            width: isFullscreen ? '100%' : `${SLIDE_WIDTH}px`,
            height: isFullscreen ? '100%' : `${SLIDE_HEIGHT}px`,
            transform: isFullscreen ? 'none' : `scale(${scale})`,
            transformOrigin: 'center',
          }}
        >
          <div className="slides">
            {editedSlides.map((slide, index) => (
              <section
                key={slide.id}
                className="relative"
                style={{
                  width: `${SLIDE_WIDTH}px`,
                  height: `${SLIDE_HEIGHT}px`,
                }}
              >
                {renderSlideContent(slide, index)}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}