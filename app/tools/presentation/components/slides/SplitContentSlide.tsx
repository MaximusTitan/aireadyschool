"use client";

import { Slide } from "../../types/presentation";

interface SplitContentSlideProps {
  slide: Slide;
}

export function SplitContentSlide({ slide }: SplitContentSlideProps) {
  return (
    <div className="min-h-[600px] p-12 bg-white">
      <h2 className="text-5xl font-normal tracking-tight mb-16">
        {slide.title}
      </h2>
      <div className="grid grid-cols-2 gap-16">
        <div>
          <h3 className="text-2xl font-medium mb-4">Early Concepts</h3>
          <p className="text-gray-600 text-lg">{slide.leftContent}</p>
        </div>
        <div>
          <h3 className="text-2xl font-medium mb-4">First AI Programs</h3>
          <p className="text-gray-600 text-lg">{slide.rightContent}</p>
        </div>
      </div>
    </div>
  );
}
