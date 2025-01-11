"use client";

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { X, Send, ChevronLeft, ChevronRight, Maximize2, FileJson, FileText, FileIcon as FilePresentation } from 'lucide-react';
import Loader from "@/components/ui/loader";
import { cn } from "@/lib/utils";

export default function ComicGenerator() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [imageData, setImageData] = useState<{
    urls: string[];
    descriptions: string[];
  }>({ urls: [], descriptions: [] });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    e.preventDefault();
    setImageData({ urls: [], descriptions: [] });
    setLoading(true);

    try {
      const promptResponse = await fetch('/api/prompt-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const promptData = await promptResponse.json();
      if (!promptResponse.ok) throw new Error(promptData.message);

      const imageResponse = await fetch('/api/image-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompts: promptData.prompts }),
      });

      const imageData = await imageResponse.json();
      if (!imageResponse.ok) throw new Error(imageData.message);

      setImageData({
        urls: imageData.imageUrls,
        descriptions: promptData.prompts
      });
    } catch (error) {
      console.error('Error generating comic:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = useCallback((direction: 'left' | 'right') => {
    setCurrentIndex(prevIndex => {
      const totalImages = imageData.urls.length;
      if (direction === 'right') {
        return (prevIndex + 1) % totalImages;
      } else {
        return (prevIndex - 1 + totalImages) % totalImages;
      }
    });
  }, [imageData.urls.length]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const downloadJSON = () => {
    const data = {
      images: imageData.urls.map((url, index) => ({
        url,
        description: imageData.descriptions[index]
      }))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comic-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Input Form - Restructured */}
      <div className="p-4 border-b border-border">
        <div className="max-w-6xl mx-auto flex justify-between items-start">
          <h1 className="text-3xl font-bold">
            Comic<br />Generator
          </h1>
          <form onSubmit={handleSubmit} className="w-[500px] relative">
            <Textarea
              placeholder="Enter your comic idea here..."
              value={prompt}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              className="w-full resize-none px-4 py-2 text-base leading-none pr-12"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
            >
              <Send className="w-6 h-6" />
            </button>
            <p className="text-xs text-muted-foreground mt-1">Press Enter to send, Shift + Enter for new line</p>
          </form>
        </div>
      </div>

      {loading && <Loader />}

      {/* Main Content */}
      {imageData.urls.length > 0 && (
        <div ref={containerRef} className="flex-1 flex flex-col">
          {/* Navigation Bar */}
          <div className="bg-muted p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleNavigation('left')}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleNavigation('right')}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
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
                className="flex items-center gap-2"
              >
                <FileText className="h-5 w-5" />
                <span>Download PDF</span>
              </Button>
              <Button
                variant="ghost"
                className="flex items-center gap-2"
              >
                <FilePresentation className="h-5 w-5" />
                <span>Download PPT</span>
              </Button>
            </div>
            <div className="text-foreground">
              Slide {currentIndex + 1} of {imageData.urls.length}
            </div>
          </div>

          {/* Split View */}
          <div className="flex-1 flex">
            {/* Left Side - Image */}
            <div className="w-1/2 bg-background relative">
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="relative w-full h-full">
                  <Image
                    src={imageData.urls[currentIndex]}
                    alt={`Comic panel ${currentIndex + 1}`}
                    fill
                    className="object-contain rounded-lg"
                    sizes="50vw"
                  />
                </div>
              </div>
            </div>

            {/* Right Side - Description */}
            <div className={cn(
              "w-1/2 p-8 flex flex-col justify-center",
              "bg-primary text-primary-foreground"
            )}>
              <p className="text-xl leading-relaxed">
                {imageData.descriptions[currentIndex]}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Credits Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg text-center relative border border-border">
            <button onClick={() => setShowModal(false)} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-lg mb-4">
              You do not have enough credits to generate a comic. <br />
              Please recharge your credits.
            </h2>
            <Button onClick={() => router.push('/credits')} className="bg-primary text-primary-foreground">
              Buy Credits
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

