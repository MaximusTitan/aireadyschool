"use client";

import { Slide } from "../../types/presentation";

interface ModernTitleSlideProps {
  slide: Slide;
}

export function ModernTitleSlide({ slide }: ModernTitleSlideProps) {
  return (
    <div className="min-h-[600px] relative overflow-hidden bg-black text-white">
      <div className="absolute inset-0 opacity-60">
        <img src={slide.image} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="relative z-10 p-16 flex flex-col justify-center min-h-[600px]">
        <h1 className="text-6xl font-light tracking-tight mb-6 max-w-3xl">
          {slide.title}
        </h1>
        {slide.content && (
          <p className="text-xl text-gray-200 mb-8 max-w-2xl">
            {slide.content}
          </p>
        )}
        {slide.author && (
          <div className="flex items-center gap-4 mt-auto">
            {slide.author.avatar && (
              <img
                src={slide.author.avatar}
                alt={slide.author.name}
                className="w-12 h-12 rounded-full border-2 border-white"
              />
            )}
            <div>
              <div className="text-lg">{slide.author.name}</div>
              {slide.author.lastEdited && (
                <div className="text-sm text-gray-300">
                  Last edited {slide.author.lastEdited}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
