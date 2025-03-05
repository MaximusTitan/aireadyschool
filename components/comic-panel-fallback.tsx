"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface ComicPanelFallbackProps {
  images: string[];
  descriptions: string[];
  panelCount: number;
  comicStyle?: string;
}

export default function ComicPanelFallback({
  images,
  descriptions,
  panelCount = 4,
  comicStyle = "Cartoon"
}: ComicPanelFallbackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  if (!images || images.length === 0) {
    return <div className="p-8 text-center">No comic data available</div>;
  }

  // Calculate how many columns to use based on panel count
  const getGridColumns = () => {
    if (panelCount <= 4) return 2; // 2x2 grid
    if (panelCount <= 6) return 3; // 3x2 grid
    return 4; // 2x4 or 3x3 grid for 8+ panels
  };

  const columns = getGridColumns();
  const title = descriptions[0];
  const contentImages = images.slice(0, panelCount);
  const contentDescriptions = descriptions.slice(1, panelCount + 1);

  return (
    <div ref={containerRef} className="w-full max-w-6xl mx-auto mb-8">
      {/* Comic title */}
      <div className="w-full bg-gradient-to-r from-slate-900 to-slate-700 p-4 mb-4 rounded-lg shadow-lg text-center relative overflow-hidden h-36">
        <div className="absolute inset-0 opacity-30">
          <Image
            src={images[0]}
            alt="Comic title background"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
        <h1 className="text-4xl font-bold text-white relative z-10 drop-shadow-lg">
          {title}
        </h1>
      </div>
      
      {/* Comic panels grid */}
      <div 
        className="grid gap-3 bg-slate-100 p-4"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridAutoRows: "minmax(250px, auto)"
        }}
      >
        {contentImages.map((imageUrl, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative bg-white border-2 border-black overflow-hidden rounded-lg"
          >
            <div className="relative w-full h-64">
              <Image
                src={imageUrl}
                alt={`Comic panel ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={index < 2}
              />
            </div>
            <div className="p-3 bg-white border-t-2 border-black">
              <p className="text-center">{contentDescriptions[index] || ''}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
