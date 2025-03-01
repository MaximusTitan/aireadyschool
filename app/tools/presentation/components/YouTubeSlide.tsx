"use client";

import React, { useEffect, useRef } from 'react';
import { Slide } from '../types/presentation';
import { cn } from '@/utils/cn';

interface YouTubeSlideProps {
  slide: Slide;
  theme: string;
  isEditing?: boolean;
  presentationTopic: string;
}

export function YouTubeSlide({ slide, theme, isEditing, presentationTopic }: YouTubeSlideProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure the container is visible and properly positioned
    if (containerRef.current) {
      containerRef.current.style.position = 'absolute';
      containerRef.current.style.inset = '0';
      containerRef.current.style.display = 'flex';
      containerRef.current.style.flexDirection = 'column';
      containerRef.current.style.alignItems = 'center';
      containerRef.current.style.justifyContent = 'center';
      containerRef.current.style.height = '100%';
      containerRef.current.style.width = '100%';
      containerRef.current.style.zIndex = '10';
      containerRef.current.style.overflow = 'hidden';
      containerRef.current.style.padding = '2rem';
    }
  }, [theme]);

  // Prepare video URL
  const videoUrl = slide.videoUrl || '';
  
  // Ensure it's an embed URL
  const embedUrl = videoUrl.includes('embed') 
    ? videoUrl 
    : videoUrl.replace(/watch\?v=([^&]+)/, 'embed/$1');
  
  // Add parameters for better presentation
  const finalUrl = embedUrl + (embedUrl.includes('?') ? '&' : '?') + 
    'autoplay=0&rel=0&showinfo=0&modestbranding=1';

  // Always prioritize using the presentation topic as the title
  const videoTitle = presentationTopic || slide.title || 'Presentation Video';

  return (
    <div 
      ref={containerRef}
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center p-8",
        `theme-${theme}`
      )}
    >
      {/* Always display the presentation topic as the title */}
      <h2 
        className="text-3xl font-bold mb-6 text-center w-full"
        style={{ 
          color: theme === 'modern' || theme === 'dark' ? '#ffffff' : '#333333',
          marginBottom: '1.5rem',
          textAlign: 'center',
          maxWidth: '100%'
        }}
      >
        {videoTitle}
      </h2>

      {/* Updated video container with proper 16:9 aspect ratio */}
      <div className="w-full max-w-4xl mx-auto" style={{ width: '80%', maxWidth: '70%' }}>
        <div className="aspect-video relative w-full">
          <iframe
            src={finalUrl}
            title={slide.title || `Video about ${presentationTopic}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          />
        </div>
      </div>

      <style>{`
        .aspect-video {
          position: relative;
          padding-bottom: 56.25%; /* 16:9 aspect ratio */
          height: 0;
          overflow: hidden;
        }
        
        .aspect-video iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
}