"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SlideRenderer } from "./SlideRenderer";
import { Presentation, Slide } from "../types/presentation";

interface PresentationPreviewProps {
  presentation?: Presentation;
  onUpdateSlide: (slideId: string, updatedSlide: Slide) => void;
  imagesLoading?: boolean;
}

export default function PresentationPreview({
  presentation,
  onUpdateSlide,
  imagesLoading,
}: PresentationPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFullScreen = () => {
    if (containerRef.current) {
      containerRef.current.requestFullscreen();
    }
  };

  const handleDownload = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(presentation, null, 2));
    const anchor = document.createElement("a");
    anchor.href = dataStr;
    anchor.download = "presentation.json";
    anchor.click();
  };

  const handleDownloadPDF = () => {
    const dataStr =
      "data:application/pdf;base64," + btoa(JSON.stringify(presentation));
    const anchor = document.createElement("a");
    anchor.href = dataStr;
    anchor.download = "presentation.pdf";
    anchor.click();
  };

  const handleDownloadPPT = () => {
    const dataStr =
      "data:application/vnd.ms-powerpoint;base64," +
      btoa(JSON.stringify(presentation));
    const anchor = document.createElement("a");
    anchor.href = dataStr;
    anchor.download = "presentation.ppt";
    anchor.click();
  };

  if (!presentation) {
    return null;
  }

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="flex justify-between items-center">
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
          <Button variant="outline" onClick={handleFullScreen}>
            Fullscreen
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            Download JSON
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            Download PDF
          </Button>
          <Button variant="outline" onClick={handleDownloadPPT}>
            Download PPT
          </Button>
          <span className="px-4 py-2">
            Slide {currentSlide + 1} of {presentation.slides.length}
          </span>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden shadow-lg">
        <SlideRenderer
          slide={presentation.slides[currentSlide]}
          theme={presentation.theme}
          imagesLoading={imagesLoading}
        />
      </div>
    </div>
  );
}
