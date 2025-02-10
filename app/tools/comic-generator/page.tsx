"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import {
  X,
  Maximize2,
  FileJson,
  FileText,
  FileIcon as FilePresentation,
  ChevronLeft,
} from "lucide-react";
import Loader from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import pptxgen from "pptxgenjs";
import localFont from "next/font/local";

// Initialize your custom font
const comicNeue = localFont({
  src: "../../../public/fonts/ComicNeue-Bold.ttf",
  weight: "700",
  variable: "--font-comic",
  display: "swap",
});

const supabase = createClient();

export default function ComicGenerator() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [imageData, setImageData] = useState<{
    urls: string[];
    descriptions: string[];
  }>({ urls: [], descriptions: [] });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadedImages, setLoadedImages] = useState<boolean[]>([]);

  // Set prompt from query string if available
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const topic = searchParams.get("topic");
    if (topic) {
      setPrompt(topic);
    }
  }, []);

  // Auto-submit if a topic is provided in the URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const topic = searchParams.get("topic");
    if (topic && prompt === topic && !loading && imageData.urls.length === 0) {
      handleSubmit(new Event("submit") as unknown as React.FormEvent);
    }
  }, [prompt, loading]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault?.(); // Allow programmatic calls without event
    setImageData({ urls: [], descriptions: [] });
    setLoadedImages([]);
    setLoading(true);

    try {
      // Generate prompts based on the input
      const promptResponse = await fetch("/api/prompt-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const promptData = await promptResponse.json();
      if (!promptResponse.ok) throw new Error(promptData.message);

      // Generate images based on the prompts
      const imageResponse = await fetch("/api/image-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts: promptData.prompts }),
      });
      const imageGenData = await imageResponse.json();
      if (!imageResponse.ok) throw new Error(imageGenData.message);

      // Pre-load all images in parallel
      const preloadPromises: Promise<HTMLImageElement>[] = imageGenData.imageUrls.map(
        (url: string) => loadImage(url)
      );
      await Promise.all(preloadPromises);

      // Save generated data to state
      setImageData({
        urls: imageGenData.imageUrls,
        descriptions: promptData.prompts,
      });
      setLoadedImages(new Array(imageGenData.imageUrls.length).fill(true));

      // -------------------------------
      // SUPABASE SAVE LOGIC
      // -------------------------------
      const { error } = await supabase.from("comics").insert([
        {
          prompt,
          image_urls: imageGenData.imageUrls,
          descriptions: promptData.prompts,
        },
      ]);
      if (error) {
        console.error("Error saving comic record:", error);
      }
      // -------------------------------
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

      // Add description text
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
    <div
      className={`flex flex-col min-h-screen bg-background text-foreground ${comicNeue.variable}`}
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center ml-4 gap-2 mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/tools")}
            className="p-0 hover:bg-transparent"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold text-neutral-800">
            Comic Generator
          </h1>
        </div>
        <div className="max-w-5xl mx-auto space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Textarea
                placeholder="Enter your comic idea here..."
                value={prompt}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                className="w-full resize-none px-4 py-2 text-base leading-normal h-[calc(6em+16px)]"
              />
            </div>
            <div className="flex flex-col items-end gap-2">
              <Button
                type="submit"
                className="w-fit max-w-md flex items-center gap-2"
                disabled={loading || !prompt.trim()}
              >
                Generate Comic
              </Button>
              <p className="text-xs text-muted-foreground">
                Press Enter to send, Shift + Enter for new line
              </p>
            </div>
          </form>
        </div>
      </div>

      {loading && <Loader />}

      {imageData.urls.length > 0 && (
        <div ref={containerRef} className="flex-1 flex flex-col">
          <div className="bg-muted p-2">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
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
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-5xl mx-auto space-y-8">
              {imageData.urls.map((url, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row gap-8 items-stretch bg-white rounded-lg shadow-lg overflow-hidden"
                >
                  <div className="w-full md:w-1/2 relative">
                    <div className="aspect-[16/9] relative">
                      {!loadedImages[index] && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                          <Loader />
                        </div>
                      )}
                      <Image
                        src={url}
                        alt={`Comic panel ${index + 1}`}
                        fill
                        className={cn(
                          "object-contain",
                          !loadedImages[index] && "opacity-0"
                        )}
                        sizes="(min-width: 1280px) 640px, (min-width: 768px) 50vw, 100vw"
                        priority={index < 2}
                        onLoad={() => {
                          const newLoadedImages = [...loadedImages];
                          newLoadedImages[index] = true;
                          setLoadedImages(newLoadedImages);
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-1/2 p-8 flex items-center">
                    {index === 0 ? (
                      <h1 className="text-4xl leading-relaxed text-foreground font-comic">
                        {imageData.descriptions[index]}
                      </h1>
                    ) : (
                      <p className="text-2xl leading-relaxed text-foreground font-comic">
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
              aria-label="Close modal"
              title="Close modal"
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
  );
}
