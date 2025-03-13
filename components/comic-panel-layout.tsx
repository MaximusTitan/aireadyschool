"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComicPanelLayoutProps {
  images: string[];
  descriptions: string[];
  panelCount: number;
  comicStyle?: string;
}

// Style variations for different comic styles
const COMIC_STYLE_CONFIG = {
  Cartoon: {
    speechBubbleStyle: "rounded-xl",
    panelGap: 5,
    borderWidth: 2,
    fontFamily: "Comic Neue, sans-serif",
    effectsEnabled: true,
  },
  Manga: {
    speechBubbleStyle: "rounded-sm",
    panelGap: 3,
    borderWidth: 3,
    fontFamily: "Manga, Comic Neue, sans-serif",
    effectsEnabled: true,
  },
  Classic: {
    speechBubbleStyle: "rounded-none",
    panelGap: 8,
    borderWidth: 1,
    fontFamily: "Comic Neue, serif",
    effectsEnabled: false,
  },
  "3D": {
    speechBubbleStyle: "rounded-3xl",
    panelGap: 6,
    borderWidth: 4,
    fontFamily: "Arial, sans-serif",
    effectsEnabled: true,
  },
};

// Panel layout grid for different panel counts
const PANEL_LAYOUTS = {
  2: [
    { x: 2, y: 2, w: 96, h: 47, rotate: 0, zIndex: 1 },
    { x: 2, y: 51, w: 96, h: 47, rotate: 0, zIndex: 1 },
  ],
  4: [
    { x: 2, y: 2, w: 47, h: 47, rotate: 0, zIndex: 1 },
    { x: 51, y: 2, w: 47, h: 47, rotate: 0, zIndex: 1 },
    { x: 2, y: 51, w: 47, h: 47, rotate: 0, zIndex: 1 },
    { x: 51, y: 51, w: 47, h: 47, rotate: 0, zIndex: 1 },
  ],
  6: [
    { x: 2, y: 2, w: 31, h: 47, rotate: 0, zIndex: 1 },
    { x: 35, y: 2, w: 31, h: 47, rotate: 0, zIndex: 1 },
    { x: 68, y: 2, w: 31, h: 47, rotate: 0, zIndex: 1 },
    { x: 2, y: 51, w: 31, h: 47, rotate: 0, zIndex: 1 },
    { x: 35, y: 51, w: 31, h: 47, rotate: 0, zIndex: 1 },
    { x: 68, y: 51, w: 31, h: 47, rotate: 0, zIndex: 1 },
  ]
};

export default function ComicPanelLayout({
  images,
  descriptions,
  panelCount,
  comicStyle = "Cartoon"
}: ComicPanelLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const styleConfig = COMIC_STYLE_CONFIG[comicStyle as keyof typeof COMIC_STYLE_CONFIG] || COMIC_STYLE_CONFIG.Cartoon;

  // Set up container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const width = Math.min(Math.max(containerWidth * 0.95, 600), 900);
        const height = width * 1.4;
        setDimensions({ width, height });
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calculate content distribution
  const contentPanels = images.length - 1; // Subtract title image
  const panelsPerPage = 4;
  const totalPages = Math.ceil(contentPanels / panelsPerPage);

  // Log panel info for debugging
  useEffect(() => {
    console.log(`ComicPanelLayout received: ${images.length} images, panelCount: ${panelCount}`);
    console.log(`Content panels: ${contentPanels}, panels per page: ${panelsPerPage}, total pages: ${totalPages}`);
  }, [images, panelCount, contentPanels, panelsPerPage, totalPages]);

  // Get content for current page
  const getPageContent = () => {
    if (!images || !descriptions) return { pageImages: [], pageDialogues: [] };
    
    const startIdx = (currentPage * panelsPerPage) + 1; // Skip title
    const endIdx = Math.min(startIdx + panelsPerPage, images.length);
    
    return {
      pageImages: images.slice(startIdx, endIdx),
      pageDialogues: descriptions.slice(startIdx, endIdx),
    };
  };

  // Navigation
  const goToNextPage = () => currentPage < totalPages - 1 && setCurrentPage(p => p + 1);
  const goToPrevPage = () => currentPage > 0 && setCurrentPage(p => p - 1);

  // Early return if no content
  if (!images?.length) return <div className="p-8 text-center">No comic data available</div>;

  const { pageImages, pageDialogues } = getPageContent();

  return (
    <div className="w-full flex flex-col items-center comic-container">
      {/* Navigation */}
      <div className="flex items-center justify-between w-full max-w-md mb-4 comic-navigation">
        <Button onClick={goToPrevPage} disabled={currentPage === 0} variant="outline" size="lg">
          <ChevronLeft className="h-5 w-5" /> Previous
        </Button>
        <span className="text-sm font-medium">
          Page {currentPage + 1} of {totalPages}
        </span>
        <Button onClick={goToNextPage} disabled={currentPage >= totalPages - 1} variant="outline" size="lg">
          Next <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Comic panels */}
      <div
        ref={containerRef}
        className="relative bg-slate-100 p-4 rounded-lg shadow-xl comic-panels-container"
        style={{
          width: dimensions.width,
          height: dimensions.height,
          backgroundImage: 'url(/images/paper-texture.png)',
        }}
      >
        {pageImages.map((imageUrl, index) => {
          const panel = PANEL_LAYOUTS[4][index];
          if (!panel) return null;

          return (
            <motion.div
              key={`panel-${currentPage}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.2 }}
              className="absolute bg-white border-2 border-black overflow-hidden comic-panel"
              style={{
                left: `${panel.x}%`,
                top: `${panel.y}%`,
                width: `${panel.w}%`,
                height: `${panel.h}%`,
                transform: `rotate(${panel.rotate}deg)`,
                zIndex: panel.zIndex,
              }}
            >
              <div className="relative w-full h-full">
                <Image
                  src={imageUrl}
                  alt={`Panel ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes={`${dimensions.width * (panel.w/100)}px`}
                  priority={index < 2}
                />
                {pageDialogues[index] && (
                  <div className={`
                    absolute bottom-3 left-3 right-3 
                    bg-white p-2 border-2 border-black 
                    ${styleConfig.speechBubbleStyle} 
                    text-center shadow-md
                  `}>
                    <p className="font-comic text-sm leading-tight max-h-20 overflow-hidden">
                      {pageDialogues[index]}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Page dots */}
      <div className="flex justify-center gap-2 mt-4 mb-6 comic-navigation">
        {Array.from({ length: totalPages }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentPage(idx)}
            className={`w-3 h-3 rounded-full transition-colors ${
              idx === currentPage ? "bg-primary" : "bg-gray-300"
            }`}
            aria-label={`Go to page ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
