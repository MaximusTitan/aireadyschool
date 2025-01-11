"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { X, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import Loader from "@/components/ui/loader";

// Add these styles to your global CSS file
const styles = `
  @keyframes slideOutLeft {
    from { transform: translateX(0); }
    to { transform: translateX(-100%); }
  }
  
  @keyframes slideOutRight {
    from { transform: translateX(0); }
    to { transform: translateX(100%); }
  }
  
  @keyframes slideInLeft {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
  
  @keyframes slideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  
  .animate-slide-out-left {
    animation: slideOutLeft 0.3s ease-in-out forwards;
  }
  
  .animate-slide-out-right {
    animation: slideOutRight 0.3s ease-in-out forwards;
  }
  
  .animate-slide-in-left {
    animation: slideInLeft 0.3s ease-in-out forwards;
  }
  
  .animate-slide-in-right {
    animation: slideInRight 0.3s ease-in-out forwards;
  }
`;

export default function ComicGenerator() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [imageData, setImageData] = useState<{
    urls: string[];
    descriptions: string[];
  }>({ urls: [], descriptions: [] });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<{ [key: number]: HTMLImageElement }>({});

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const preloadImage = useCallback((index: number) => {
    if (index < 0 || index >= imageData.urls.length) return;
    const existingPreload = preloadedImages[index];
    if (existingPreload) return;
    const img = new (window.Image as any)();
    img.crossOrigin = "anonymous";
    img.src = imageData.urls[index];
    img.onload = () => {
      setPreloadedImages(prev => ({
        ...prev,
        [index]: img
      }));
    };
  }, [imageData.urls, preloadedImages]);

  useEffect(() => {
    if (selectedImageIndex !== null) {
      imageData.urls.forEach((_, index) => preloadImage(index));
    }
  }, [selectedImageIndex, imageData.urls, preloadImage]);

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

      // Make sure we're setting both URLs and descriptions
      setImageData({
        urls: imageData.imageUrls,
        descriptions: promptData.prompts // Use the prompts as descriptions
      });
    } catch (error) {
      console.error('Error generating comic:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleNavigation = useCallback((direction: "left" | "right") => {
    if (isAnimating || selectedImageIndex === null) return;
    setIsAnimating(true);
    setAnimationDirection(direction);
    setTimeout(() => {
      setSelectedImageIndex(prev => {
        if (prev === null) return null;
        const newIndex = direction === "right"
          ? Math.min(prev + 1, imageData.urls.length - 1)
          : Math.max(prev - 1, 0);
        preloadImage(newIndex + (direction === "right" ? 1 : -1));
        return newIndex;
      });
      setTimeout(() => {
        setIsAnimating(false);
        setAnimationDirection(null);
      }, 300);
    }, 150);
  }, [imageData.urls.length, preloadImage, isAnimating, selectedImageIndex]);

  const currentImage = useMemo(() => {
    return selectedImageIndex !== null ? preloadedImages[selectedImageIndex] || null : null;
  }, [preloadedImages, selectedImageIndex]);

  const getAnimationClasses = () => {
    if (!animationDirection) return "";
    if (animationDirection === "right") {
      return isAnimating ? "animate-slide-out-left" : "animate-slide-in-right";
    } else {
      return isAnimating ? "animate-slide-out-right" : "animate-slide-in-left";
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="flex flex-col items-center p-4">
        <h1 className="text-3xl font-bold mb-6">Comic Generator</h1>
        <form onSubmit={handleSubmit} className="w-full mb-8 relative">
          <Textarea
            ref={textareaRef}
            placeholder="Enter your comic idea here..."
            value={prompt}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            className="w-full resize-none px-4 py-2 text-base leading-none pr-12"
            style={{
              minHeight: 'calc(1em + 2px)',
            }}
          />
          <button
            type="submit"
            className="absolute right-2 top-2 text-gray-500 hover:text-black"
          >
            <Send className="w-6 h-6" />
          </button>
          <p className="text-xs text-muted-foreground mt-1">Press Enter to send, Shift + Enter for new line</p>
        </form>
        {loading && <Loader />}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center relative">
              <button onClick={() => setShowModal(false)} className="absolute top-2 right-2 text-gray-500 hover:text-black">
                <X className="h-6 w-6" />
              </button>
              <h2 className="text-lg mb-4">
                You do not have enough credits to generate a comic. <br />
                Please recharge your credits.
              </h2>
              <Button onClick={() => router.push('/credits')} className="bg-primary text-white">
                Buy Credits
              </Button>
            </div>
          </div>
        )}

        {/* Image Grid */}
        {imageData.urls.length > 0 && (
          <div className="flex gap-4 w-full max-w-6xl overflow-x-auto p-4">
            {imageData.urls.map((url, index) => (
              <div 
                key={index} 
                className="relative flex flex-col w-64 flex-shrink-0 cursor-pointer"
              >
                <div 
                  className="relative w-64 h-64 transition-transform duration-200 hover:scale-105"
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <Image 
                    src={url} 
                    alt={`Comic panel ${index + 1}`} 
                    fill
                    sizes="(max-width: 768px) 25vw, 20vw"
                    className="rounded-lg object-cover"
                  />
                </div>
                <p className="mt-2 text-sm text-white line-clamp-2 text-center px-2 min-h-[2.5rem]">
                  {imageData.descriptions[index]}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Image Modal with Navigation */}
        {selectedImageIndex !== null && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImageIndex(null)}
          >
            <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
              <button 
                onClick={() => setSelectedImageIndex(null)}
                className="absolute top-0 right-0 m-4 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 transition-colors z-50"
              >
                <X className="h-6 w-6" />
              </button>
              <div 
                className="relative w-full h-full max-h-[80vh]"
                onClick={(e) => e.stopPropagation()}
              >
                {currentImage && (
                  <div
                    key={selectedImageIndex}
                    className={`w-full h-full ${getAnimationClasses()}`}
                  >
                    <Image
                      src={currentImage.src}
                      alt={`Comic panel ${selectedImageIndex + 1}`}
                      fill
                      sizes="100vw"
                      className="rounded-lg object-contain"
                    />
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/75 p-4">
                <p className="text-center text-white text-sm md:text-base">
                  {imageData.descriptions[selectedImageIndex || 0]}
                </p>
              </div>
              {selectedImageIndex < imageData.urls.length - 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigation("right");
                  }}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}
              {selectedImageIndex > 0 && (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigation("left");
                  }}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

