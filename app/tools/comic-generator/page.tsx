"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, useSearchParams } from "next/navigation";
import {
  X,
  Send,
  Maximize2,
  FileJson,
  FileText,
  FileIcon as FilePresentation,
} from "lucide-react";
import Loader from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import pptxgen from "pptxgenjs";

function ComicGeneratorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prompt, setPrompt] = useState("");
  const [imageData, setImageData] = useState<{
    urls: string[];
    descriptions: string[];
  }>({ urls: [], descriptions: [] });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const topic = searchParams.get("topic");

  useEffect(() => {
    if (topic) {
      setPrompt(decodeURIComponent(topic));
    }
  }, [topic]);

  useEffect(() => {
    if (prompt) {
      handleSubmit();
    }
  }, [prompt]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setImageData({ urls: [], descriptions: [] });
    setLoading(true);

    try {
      const promptResponse = await fetch("/api/prompt-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const promptData = await promptResponse.json();
      if (!promptResponse.ok) throw new Error(promptData.message);

      const imageResponse = await fetch("/api/image-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts: promptData.prompts }),
      });

      const imageData = await imageResponse.json();
      if (!imageResponse.ok) throw new Error(imageData.message);

      setImageData({
        urls: imageData.imageUrls,
        descriptions: promptData.prompts,
      });
    } catch (error) {
      console.error("Error generating comic:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const getFileName = (extension: string) => {
    const sanitizedPrompt = prompt.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    return `${sanitizedPrompt}.${extension}`;
  };

  const downloadJSON = () => {
    const data = {
      images: imageData.urls.map((url, index) => ({
        url,
        description: imageData.descriptions[index],
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = getFileName("json");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [1024, 576],
    });

    const pageWidth = 1024;
    const pageHeight = 576;
    const margin = 20;
    const imageWidth = pageWidth - 2 * margin;
    const imageHeight = pageHeight - 3 * margin; // Leave space for text at the bottom

    for (let i = 0; i < imageData.urls.length; i++) {
      if (i > 0) {
        pdf.addPage([1024, 576], "landscape");
      }

      // Add image
      const img = await loadImage(imageData.urls[i]);
      pdf.addImage(
        img,
        "JPEG",
        margin,
        margin,
        imageWidth,
        imageHeight,
        undefined,
        "FAST"
      );

      // Add description
      pdf.setFontSize(12);
      const splitText = pdf.splitTextToSize(
        imageData.descriptions[i],
        imageWidth
      );
      pdf.text(splitText, margin, pageHeight - margin, {
        align: "left",
        baseline: "bottom",
      });
    }

    pdf.save(getFileName("pdf"));
  };

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  const downloadPPT = () => {
    const pptx = new pptxgen();
    pptx.layout = "LAYOUT_WIDE";
    pptx.defineLayout({ name: "COMIC_LAYOUT", width: 10.24, height: 5.76 });
    pptx.layout = "COMIC_LAYOUT";

    imageData.urls.forEach((url, index) => {
      const slide = pptx.addSlide();
      slide.addImage({ path: url, x: 0, y: 0, w: "100%", h: "85%" });
      slide.addText(imageData.descriptions[index], {
        x: 0,
        y: "85%",
        w: "100%",
        h: "15%",
        valign: "middle",
        align: "center",
        fontSize: 14,
      });
    });

    pptx.writeFile({ fileName: getFileName("pptx") });
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <div className="p-4 border-b border-border">
          <div className="max-w-6xl mx-auto flex flex-col items-start space-y-4">
            <h1 className="text-3xl text-rose-500 font-bold">
              Comic Generator
            </h1>
            <form onSubmit={handleSubmit} className="w-[500px] relative">
              <Textarea
                placeholder="Enter your comic idea here..."
                value={prompt}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                className="w-full resize-none px-4 py-2 text-base leading-tight h-[calc(1em+8px)]"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
              >
                <Send className="w-6 h-6" />
              </button>
              <p className="text-xs text-muted-foreground mt-1">
                Press Enter to send, Shift + Enter for new line
              </p>
            </form>
          </div>
        </div>

        {loading && <Loader />}

        {imageData.urls.length > 0 && (
          <div ref={containerRef} className="flex-1 flex flex-col">
            <div className="bg-muted p-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={handleFullscreen}
                  className="flex items-center gap-2"
                >
                  <Maximize2 className="h-5 w-5" />
                  <span>Fullscreen</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={downloadJSON}
                  className="flex items-center gap-2"
                >
                  <FileJson className="h-5 w-5" />
                  <span>Download JSON</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={downloadPDF}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-5 w-5" />
                  <span>Download PDF</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={downloadPPT}
                  className="flex items-center gap-2"
                >
                  <FilePresentation className="h-5 w-5" />
                  <span>Download PPT</span>
                </Button>
              </div>
              <div className="text-foreground">
                {imageData.urls.length} panels generated
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-7xl mx-auto space-y-12">
                {imageData.urls.map((url, index) => (
                  <div
                    key={index}
                    className="flex gap-8 items-stretch bg-white rounded-lg shadow-lg overflow-hidden"
                  >
                    <div className="w-1/2 relative">
                      <div className="aspect-[16/9] relative">
                        <Image
                          src={url}
                          alt={`Comic panel ${index + 1}`}
                          fill
                          className="object-contain"
                          sizes="(min-width: 1280px) 640px, (min-width: 768px) 50vw, 100vw"
                        />
                      </div>
                    </div>
                    <div className="w-1/2 p-8 flex items-center">
                      {index === 0 ? (
                        <h1 className="text-4xl leading-relaxed text-foreground font-comic-sans">
                          {imageData.descriptions[index]}
                        </h1>
                      ) : (
                        <p className="text-2xl leading-relaxed text-foreground font-comic-sans">
                          {imageData.descriptions[index]}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg text-center relative border border-border">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-6 w-6" />
              </button>
              <h2 className="text-lg mb-4">
                You do not have enough credits to generate a comic. <br />
                Please recharge your credits.
              </h2>
              <Button
                onClick={() => router.push("/credits")}
                className="bg-primary text-primary-foreground"
              >
                Buy Credits
              </Button>
            </div>
          </div>
        )}
      </div>
    </Suspense>
  );
}

export default function ComicGenerator() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComicGeneratorContent />
    </Suspense>
  );
}
