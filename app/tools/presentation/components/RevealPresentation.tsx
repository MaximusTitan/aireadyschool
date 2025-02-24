"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "reveal.js";
import "reveal.js/dist/reveal.css";
import "../styles/themes.css";
import type { Presentation, Slide } from "../types/presentation";
import { Button } from "@/components/ui/button";
import { Pencil, RefreshCw, Upload } from "lucide-react";
import { regenerateImage } from "../actions/generatePresentation";
import { toast } from "@/hooks/use-toast";
import type RevealType from "reveal.js";
// Add to the top of your RevealPresentation.tsx file or your global styles
import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/white.css"; // or any other theme you prefer
import { Spinner } from "./ui/spinner";
import { YouTubeSlide } from "./YouTubeSlide";
import { cn } from "@/utils/cn";

interface RevealPresentationProps {
  presentation: Presentation;
  onSave: (updatedPresentation: Presentation) => void;
  isEditing: boolean;
  theme: string;
  transition: "none" | "fade" | "slide" | "convex" | "concave" | "zoom";
}

export function RevealPresentation({
  presentation,
  onSave,
  isEditing,
  theme,
  transition,
}: RevealPresentationProps) {
  const revealRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [editedSlides, setEditedSlides] = useState<Slide[]>(
    presentation.slides
  );
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeEditField, setActiveEditField] = useState<{
    slideIndex: number;
    field: string;
  } | null>(null);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const revealInstance = useRef<RevealType.Api | null>(null);
  const [initializing, setInitializing] = useState(true);
  const lastKnownSlideIndex = useRef(0);

  const SLIDE_WIDTH = 1280;
  const SLIDE_HEIGHT = 720;

  const calculateDimensions = () => {
    if (isFullscreen) {
      const windowRatio = window.innerWidth / window.innerHeight;
      const presentationRatio = SLIDE_WIDTH / SLIDE_HEIGHT;

      if (windowRatio > presentationRatio) {
        const height = window.innerHeight;
        const scale = height / SLIDE_HEIGHT;
        return {
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          scale: scale,
        };
      } else {
        const width = window.innerWidth;
        const scale = width / SLIDE_WIDTH;
        return {
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          scale: scale,
        };
      }
    } else {
      const containerWidth = containerRef.current?.parentElement?.offsetWidth || SLIDE_WIDTH;
      const scale = Math.min(0.875, containerWidth / SLIDE_WIDTH);
      return {
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        scale: scale,
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
          height: SLIDE_HEIGHT,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial calculation

    return () => window.removeEventListener("resize", handleResize);
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
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  useEffect(() => {
    let deck: RevealType.Api | null = null;

    const initializeReveal = async () => {
      if (!revealRef.current || !containerRef.current) return;

      try {
        const themeClasses = [
          "modern",
          "corporate",
          "creative",
          "minimal",
          "dark",
        ].map((t) => `theme-${t}`);

        // Safely destroy existing instance
        if (
          revealInstance.current &&
          typeof revealInstance.current.destroy === "function"
        ) {
          try {
            revealInstance.current.destroy();
          } catch (e) {
            console.warn("Error destroying previous instance:", e);
          }
        }

        const { width, height, scale } = calculateDimensions();
        setScale(scale);

        // Initialize Reveal with safeguards
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
          transitionSpeed: "fast" as "fast", // Fix: Type assertion for transitionSpeed
          backgroundTransition: "fade" as const,
          deck: {
            width,
            height,
          },
        };

        deck = new Reveal(revealRef.current, config);
        revealInstance.current = deck;

        // Add event listener before initialization
        deck.addEventListener("slidechanged", (event: any) => {
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
        console.error("Error initializing Reveal:", error);
      }
    };

    initializeReveal();

    // Cleanup function
    return () => {
      if (deck && typeof deck.destroy === "function") {
        try {
          deck.destroy();
        } catch (e) {
          console.warn("Error during cleanup:", e);
        }
      }
      revealInstance.current = null;
    };
  }, [isFullscreen, theme, transition, editedSlides]);

  const handleSlideChange = (
    index: number,
    field: keyof Slide,
    value: string | string[]
  ) => {
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
    setIsRegeneratingImage(true);
    try {
      const slide = editedSlides[index];
      const newImage = await regenerateImage(slide.title, theme);
      const updatedSlides = [...editedSlides];
      updatedSlides[index] = { ...slide, image: newImage };
      setEditedSlides(updatedSlides);
      onSave({ ...presentation, slides: updatedSlides });
      toast({
        title: "Image Regenerated",
        description: "The slide image has been successfully regenerated.",
      });
    } catch (error) {
      console.error("Error regenerating image:", error);
      toast({
        title: "Error",
        description: "Failed to regenerate the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegeneratingImage(false);
    }
  };

  const handleUploadImage = async (index: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const imageDataUrl = e.target?.result as string;
            const updatedSlides = [...editedSlides];
            updatedSlides[index] = {
              ...updatedSlides[index],
              image: imageDataUrl,
            };
            setEditedSlides(updatedSlides);
            onSave({ ...presentation, slides: updatedSlides });
            toast({
              title: "Image Uploaded",
              description:
                "Your image has been successfully uploaded to the slide.",
            });
          };
          reader.readAsDataURL(file);
        } catch (error) {
          console.error("Error uploading image:", error);
          toast({
            title: "Error",
            description: "Failed to upload the image. Please try again.",
            variant: "destructive",
          });
        }
      }
    };
    input.click();
  };

  const EditableText = ({
    value,
    onChange,
    slideIndex,
    field,
    className = "",
    multiline = false,
    style,
  }: {
    value: string;
    onChange: (value: string) => void;
    slideIndex: number;
    field: string;
    className?: string;
    multiline?: boolean;
    style?: React.CSSProperties;
  }) => {
    const isActive =
      activeEditField?.slideIndex === slideIndex &&
      activeEditField?.field === field;
    const [editValue, setEditValue] = useState(value);

    const handleDoubleClick = () => {
      if (isEditing) {
        setActiveEditField({ slideIndex, field });
        setEditValue(value);
      }
    };

    const handleBlur = () => {
      if (editValue !== value) {
        onChange(editValue);
      }
      setActiveEditField(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleBlur();
      }
      if (e.key === "Escape") {
        setEditValue(value);
        setActiveEditField(null);
      }
    };

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
          {multiline ? (
            <div className="whitespace-pre-wrap">{value}</div>
          ) : (
            <div>{value}</div>
          )}
        </div>
      );
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
    );
  };

  const renderMedia = (slide: Slide, isEditing: boolean, index: number) => {
    if (slide.videoUrl) {
      return (
        <div className="video-container" style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <iframe
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            src={slide.videoUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }
    return slide.image && (
      <div className="relative group">
        <img 
          src={slide.image} 
          alt={slide.title} 
          className={cn(
            "w-full rounded-lg transition-all duration-200",
            isEditing && "filter brightness-75" // Blur effect when editing
          )}
        />
        {isEditing && (
          <div className="absolute top-4 right-4 flex gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleRegenerateImage(index)}
              disabled={isRegeneratingImage}
              className="bg-white/90 hover:bg-white text-black shadow-lg flex items-center gap-2 py-6 px-4"
            >
              {isRegeneratingImage ? (
                <Spinner className="h-5 w-5" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
              Regenerate
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleUploadImage(index)}
              className="bg-white/90 hover:bg-white text-black shadow-lg flex items-center gap-2 py-6 px-4"
            >
              <Upload className="h-5 w-5" />
              Upload
            </Button>
          </div>
        )}
      </div>
    )
  }

  const renderSlideContent = (slide: Slide, index: number) => {
    if (slide.type === "youtube" || slide.layout === "videoSlide") {
      return (
        <div className="absolute inset-0 w-full h-full" data-slide-type="video">
          <div className={`w-full h-full ${theme}`}>
            <YouTubeSlide
              slide={slide}
              theme={theme}
              isEditing={isEditing}
              presentationTopic={presentation.topic || presentation.title} // Pass the presentation title
            />
          </div>
        </div>
      );
    }

    const isTextLeft = slide.layout === "textLeft";

    return (
      <div className="flex h-full" data-theme={theme}>
        <div
          className={`w-1/2 flex flex-col justify-start ${isTextLeft ? "pr-8" : "pl-8"} p-12`}
        >
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
                      const newBulletPoints = [...(slide.bulletPoints || [])];
                      newBulletPoints[pointIndex] = value;
                      handleSlideChange(index, "bulletPoints", newBulletPoints);
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
        <div
          className={`w-1/2 flex flex-col items-center justify-center ${isTextLeft ? "pl-8" : "pr-8"} p-12`}
        >
          <div className="relative w-full">
            {renderMedia(slide, isEditing, index)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`${
        isFullscreen ? "fixed inset-0 z-50 bg-black" : ""
      } flex items-center justify-center w-full overflow-hidden`}
      style={{
        minHeight: isFullscreen ? "100vh" : `${SLIDE_HEIGHT}px`,
        aspectRatio: "16/9",
        marginInline: "auto",
        paddingBottom: "1rem", // Add padding at the bottom
      }}
    >
      <div
        className="relative"
        style={{
          width: `${SLIDE_WIDTH}px`,
          margin: "0 auto",
        }}
      >
        <div
          ref={revealRef}
          className={`reveal reveal-viewport theme-${theme}`}
          style={{
            width: `${SLIDE_WIDTH}px`,
            height: `${SLIDE_HEIGHT}px`,
            transform: `scale(${scale})`,
            transformOrigin: "center center", // Changed from "top center" to "center center"
            //margin: "2rem auto", // Added margin to adjust vertical position
            ["--slide-scale" as any]: "1",
            ["--viewport-width" as any]: `${SLIDE_WIDTH}px`,
            ["--viewport-height" as any]: `${SLIDE_HEIGHT}px`,
            ["--slide-width" as any]: `${SLIDE_WIDTH}px`,
            ["--slide-height" as any]: `${SLIDE_HEIGHT}px`,
          }}
        >
          <div className="slides">
            {editedSlides.map((slide, index) => (
              <section
                key={slide.id}
                className={`relative ${slide.type === "youtube" || slide.layout === "videoSlide" ? "video-slide" : ""}`}
                data-slide-type={slide.type === "youtube" || slide.layout === "videoSlide" ? "video" : "content"}
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
  );
}