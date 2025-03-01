"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "reveal.js";
import "reveal.js/dist/reveal.css";
import "../styles/themes.css";
import type { Presentation, Slide } from "../types/presentation";
import { Button } from "@/components/ui/button";
import { Pencil, RefreshCw, Upload } from "lucide-react";
import { regenerateImage } from "../actions/generatePresentation";
import type RevealType from "reveal.js";
// Add to the top of your RevealPresentation.tsx file or your global styles
import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/white.css"; // or any other theme you prefer
import { Spinner } from "./ui/spinner";
import { YouTubeSlide } from "./YouTubeSlide";
import { cn } from "@/utils/cn";
import { SimpleRichEditor } from "./SimpleRichEditor";
import { FileType2, FileText, Maximize2 } from "lucide-react";
import { exportToPDF, exportToPPTX } from "../utils/exportUtils";
import { toast } from "@/hooks/use-toast";

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
  const slideElementsRef = useRef<HTMLElement[]>([]);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });

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
    // Special handling for YouTube/video slides
    if (slide.type === "youtube" || slide.layout === "videoSlide") {
      // Always use presentation topic or title as the video slide title
      const videoTitle = presentation.topic || presentation.title || 'Video Content';
      
      // Force update the slide title to match presentation topic
      const updatedSlides = [...editedSlides];
      if (updatedSlides[index].title !== videoTitle) {
        updatedSlides[index] = { 
          ...updatedSlides[index], 
          title: videoTitle 
        };
        
        // Update state immediately for UI rendering
        setEditedSlides(updatedSlides);
        
        // Save the updated title persistently
        setTimeout(() => {
          onSave({
            ...presentation,
            slides: updatedSlides
          });
        }, 0);
      }
      
      return (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center w-full h-full" 
          data-slide-type="video"
        >
          <YouTubeSlide
            slide={{...slide, title: videoTitle}} // Force the title here
            theme={theme}
            isEditing={isEditing}
            presentationTopic={videoTitle}
          />
        </div>
      );
    }

    // Regular slides with text and image
    const isTextLeft = slide.layout === "textLeft";

    return (
      <div className="flex h-full" data-theme={theme}>
        <div
          className={`w-1/2 flex flex-col justify-start ${isTextLeft ? "pr-8" : "pl-8"} p-12`}
        >
          <SimpleRichEditor
            value={slide.title}
            onChange={(value) => handleSlideChange(index, "title", value)}
            className={`reveal-title text-[48px] font-bold mb-6 leading-tight text-left theme-${theme}`}
            isEditing={isEditing}
            theme={theme} // Pass theme to SimpleRichEditor
          />
          <SimpleRichEditor
            value={slide.content || ""}
            onChange={(value) => handleSlideChange(index, "content", value)}
            className={`reveal-content text-[24px] mb-6 leading-relaxed text-left theme-${theme}`}
            isEditing={isEditing}
            theme={theme} // Pass theme to SimpleRichEditor
          />
          {slide.bulletPoints && (
            <ul className={`reveal-list text-[24px] space-y-2 theme-${theme}`}>
              {slide.bulletPoints.map((point, pointIndex) => (
                <li key={pointIndex} className="reveal-list-item">
                  <SimpleRichEditor
                    value={point}
                    onChange={(value) => {
                      const newBulletPoints = [...(slide.bulletPoints || [])];
                      newBulletPoints[pointIndex] = value;
                      handleSlideChange(index, "bulletPoints", newBulletPoints);
                    }}
                    className={`inline-block theme-${theme}`}
                    isEditing={isEditing}
                    theme={theme} // Pass theme to SimpleRichEditor
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

  const prepareForExport = async () => {
    // Ensure slide container is ready
    if (!revealRef.current) return;
    
    // Apply special slide preparation styles to improve export quality
    const styleElement = document.createElement('style');
    styleElement.id = 'export-enhancements';
    styleElement.textContent = `
      /* Temporary styles applied during export to improve text rendering */
      .reveal .slides section * {
        font-family: Arial, Helvetica, sans-serif !important;
        letter-spacing: 0.025em !important;
        word-spacing: 0.05em !important;
        text-rendering: geometricPrecision !important;
      }
      
      .reveal .slides h1, .reveal .slides h2, .reveal .slides h3 {
        margin-bottom: 0.2em !important;
      }
      
      .reveal .slides p {
        margin-bottom: 0.5em !important;
      }
      
      .reveal .slides ul li {
        margin-bottom: 0.3em !important;
      }
      
      /* Make sure all elements are fully visible */
      .reveal .slides section {
        opacity: 1 !important;
        visibility: visible !important;
      }
      
      /* Ensure themes have proper contrast for export */
      .theme-modern .reveal .slides section {
        color: white !important;
        background: linear-gradient(135deg, #2b4162 0%, #12100e 100%) !important;
      }
      
      .theme-dark .reveal .slides section {
        color: white !important;
        background: #111111 !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    // Return a cleanup function
    return () => {
      const element = document.getElementById('export-enhancements');
      if (element) {
        document.head.removeChild(element);
      }
    };
  };

  const handleExportToPDF = async () => {
    try {
      setIsExporting(true);
      
      // Show progress toast
      toast({
        title: "Preparing PDF...",
        description: "This may take a few moments. Please wait.",
        duration: 5000,
      });
      
      // Ensure revealInstance exists
      if (!revealInstance.current) {
        throw new Error("Presentation not initialized");
      }
      
      // Apply temporary export enhancement styles
      const cleanup = await prepareForExport();
      
      // Set progress tracking
      setExportProgress({ current: 0, total: editedSlides.length });
      
      try {
        // Export with sequential slide capture
        await exportToPDF(presentation, revealInstance.current);
        
        // Success notification
        toast({
          title: "PDF Downloaded",
          description: "Your presentation has been downloaded as a PDF.",
        });
      } finally {
        // Clean up enhancement styles
        if (cleanup) cleanup();
      }
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast({
        title: "Export Failed",
        description: "There was an error creating your PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportProgress({ current: 0, total: 0 });
    }
  };
  
  const handleExportToPPTX = async () => {
    try {
      setIsExporting(true);
      
      // Show progress toast
      toast({
        title: "Preparing PowerPoint...",
        description: "This may take a few moments. Please wait.",
        duration: 5000,
      });
      
      // Ensure revealInstance exists
      if (!revealInstance.current) {
        throw new Error("Presentation not initialized");
      }
      
      // Apply temporary export enhancement styles
      const cleanup = await prepareForExport();
      
      // Set progress tracking
      setExportProgress({ current: 0, total: editedSlides.length });
      
      try {
        // Export with sequential slide capture
        await exportToPPTX(presentation, revealInstance.current);
        
        // Success notification
        toast({
          title: "PowerPoint Downloaded",
          description: "Your presentation has been downloaded as a PowerPoint file.",
        });
      } finally {
        // Clean up enhancement styles
        if (cleanup) cleanup();
      }
    } catch (error) {
      console.error("Error exporting to PPTX:", error);
      toast({
        title: "Export Failed",
        description: "There was an error creating your PowerPoint file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportProgress({ current: 0, total: 0 });
    }
  };

  // Add a new state to track fullscreen mode client-side
  const [isInFullscreenMode, setIsInFullscreenMode] = useState(false);
  
  // Update the fullscreen state whenever document.fullscreenElement changes
  useEffect(() => {
    const updateFullscreenState = () => {
      setIsInFullscreenMode(!!document.fullscreenElement);
    };
    
    // Initial check
    updateFullscreenState();
    
    // Add event listeners for fullscreen changes
    document.addEventListener('fullscreenchange', updateFullscreenState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenState);
    document.addEventListener('mozfullscreenchange', updateFullscreenState);
    document.addEventListener('MSFullscreenChange', updateFullscreenState);
    
    return () => {
      // Clean up event listeners
      document.removeEventListener('fullscreenchange', updateFullscreenState);
      document.removeEventListener('webkitfullscreenchange', updateFullscreenState);
      document.removeEventListener('mozfullscreenchange', updateFullscreenState);
      document.removeEventListener('MSFullscreenChange', updateFullscreenState);
    };
  }, []);

  // Fix the renderExportButtons function to use the state instead of checking document directly
  const renderExportButtons = () => (
    <div className="flex items-center gap-2 mb-4">
      {/* Export PDF Button */}
      <Button
        variant="outline"
        onClick={handleExportToPDF}
        disabled={isExporting}
        className="flex items-center gap-2"
      >
        {isExporting && exportProgress.total > 0 ? (
          <div className="flex items-center gap-2">
            <Spinner className="h-4 w-4" />
            <span>
              Exporting... ({exportProgress.current}/{exportProgress.total})
            </span>
          </div>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </>
        )}
      </Button>
      
      {/* Export PowerPoint Button */}
      <Button
        variant="outline"
        onClick={handleExportToPPTX}
        disabled={isExporting}
        className="flex items-center gap-2"
      >
        {isExporting && exportProgress.total > 0 ? (
          <div className="flex items-center gap-2">
            <Spinner className="h-4 w-4" />
            <span>
              Exporting... ({exportProgress.current}/{exportProgress.total})
            </span>
          </div>
        ) : (
          <>
            <FileType2 className="w-4 h-4" />
            <span>Export PowerPoint</span>
          </>
        )}
      </Button>
      
      {/* Fullscreen Button - fixed to use state instead of document directly */}
      <Button
        variant="outline"
        onClick={() => {
          if (isInFullscreenMode) {
            document.exitFullscreen();
          } else if (containerRef.current) {
            containerRef.current.requestFullscreen();
          }
        }}
        className="flex items-center gap-2"
      >
        <Maximize2 className="w-4 h-4" />
        <span>{isInFullscreenMode ? "Exit Fullscreen" : "Fullscreen"}</span>
      </Button>
    </div>
  );

  useEffect(() => {
    if (!initializing) {
      // Update slide elements ref whenever slides change
      slideElementsRef.current = Array.from(
        document.querySelectorAll('.reveal .slides section')
      ) as HTMLElement[];
    }
  }, [initializing, editedSlides]);

  useEffect(() => {
    if (!revealInstance.current || !isExporting) return;
    
    const handleSlideChange = (event: any) => {
      if (isExporting && exportProgress.total > 0) {
        setExportProgress(prev => ({
          ...prev,
          current: event.indexh + 1
        }));
      }
    };
    
    // Add event listener for slide changes during export
    revealInstance.current.addEventListener('slidechanged', handleSlideChange);
    
    return () => {
      if (revealInstance.current) {
        revealInstance.current.removeEventListener('slidechanged', handleSlideChange);
      }
    };
  }, [isExporting, exportProgress.total, revealInstance.current]);

  return (
    <div className="space-y-4">
      {renderExportButtons()}
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
    </div>
  );
}