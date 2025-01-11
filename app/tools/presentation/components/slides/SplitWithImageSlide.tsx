"use client";

import { Slide } from "../../types/presentation";

interface SplitWithImageSlideProps {
  slide: Slide;
}

export function SplitWithImageSlide({ slide }: SplitWithImageSlideProps) {
  return (
    <div className="min-h-[600px] grid grid-cols-2 bg-white">
      <div className="p-12 flex flex-col justify-center">
        <h2 className="text-4xl font-light mb-6">{slide.title}</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-medium mb-2">{slide.leftContent}</h3>
            <p className="text-gray-600">{slide.content}</p>
          </div>
          {slide.rightContent && (
            <div>
              <h3 className="text-xl font-medium mb-2">Key Points</h3>
              <p className="text-gray-600">{slide.rightContent}</p>
            </div>
          )}
        </div>
      </div>
      <div className="relative">
        <img
          src={slide.image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
