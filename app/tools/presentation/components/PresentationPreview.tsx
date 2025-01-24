"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { SlideRenderer } from "./SlideRenderer";
import { Presentation, Slide } from "../types/presentation";
import { toast } from "@/hooks/use-toast";
import { Spinner } from "../components/ui/spinner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface PresentationPreviewProps {
  presentation?: Presentation;
  onUpdateSlide: (slideId: string, updatedSlide: Slide) => void;
}

// Define constant dimensions for both PDF and screenshots
const SLIDE_WIDTH = 1150;
const SLIDE_HEIGHT = 647;

export default function PresentationPreview({
  presentation,
  onUpdateSlide,
}: PresentationPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const slideRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (slideRef.current) {
        const containerWidth = slideRef.current.offsetWidth;
        setScale(containerWidth / SLIDE_WIDTH);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  if (!presentation) {
    return <div>No presentation data available</div>;
  }

  const captureSlide = async (slideIndex: number): Promise<string> => {
    if (!slideRef.current) return "";

    setCurrentSlide(slideIndex);

    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const canvas = await html2canvas(slideRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        windowWidth: SLIDE_WIDTH,
        windowHeight: SLIDE_HEIGHT,
      });

      return canvas.toDataURL("image/png", 1.0);
    } catch (error) {
      console.error("Error capturing slide:", error);
      throw error;
    }
  };

  const handleExport = async (format: "pdf" | "ppt") => {
    if (format === "ppt") {
      toast({
        title: "Not Implemented",
        description: "PPT export is not yet available.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [SLIDE_WIDTH, SLIDE_HEIGHT],
        hotfixes: ["px_scaling"],
      });

      for (let i = 0; i < presentation.slides.length; i++) {
        setExportProgress(Math.round((i / presentation.slides.length) * 100));

        const slideImage = await captureSlide(i);

        if (i > 0) {
          pdf.addPage([SLIDE_WIDTH, SLIDE_HEIGHT]);
        }

        // Add image to fill the entire PDF page
        pdf.addImage({
          imageData: slideImage,
          format: "PNG",
          x: 0,
          y: 0,
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          compression: "FAST",
          rotation: 0,
        });
      }

      const fileName = `${presentation.topic.replace(/\s+/g, "_")}_Presentation.pdf`;
      pdf.save(fileName);

      toast({
        title: "Export Successful",
        description: "Your presentation has been exported as PDF.",
      });
    } catch (error) {
      console.error("Error exporting presentation:", error);
      toast({
        title: "Export Failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setCurrentSlide(0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setCurrentSlide((prev) =>
                Math.min(presentation.slides.length - 1, prev + 1)
              )
            }
            disabled={currentSlide === presentation.slides.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="px-4 py-2">
            Slide {currentSlide + 1} of {presentation.slides.length}
          </span>
        </div>
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            onClick={() => handleExport("pdf")}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                <span>Generating PDF ({exportProgress}%)</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                <span>Download as PDF</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div
        className="w-full overflow-hidden mt-4"
        style={{
          aspectRatio: `${SLIDE_WIDTH} / ${SLIDE_HEIGHT}`,
          maxWidth: `${SLIDE_WIDTH}px`,
          margin: "0 auto",
        }}
      >
        <div
          ref={slideRef}
          className="origin-top-left border rounded-lg overflow-hidden shadow-lg"
          style={{
            width: `${SLIDE_WIDTH}px`,
            height: `${SLIDE_HEIGHT}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <SlideRenderer
            slide={presentation.slides[currentSlide]}
            theme={presentation.theme}
            dimensions={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT }}
          />
        </div>
      </div>
    </div>
  );
}
