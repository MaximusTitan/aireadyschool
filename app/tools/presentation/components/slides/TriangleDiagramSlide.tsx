"use client";

import { Slide } from "../../types/presentation";

interface TriangleDiagramSlideProps {
  slide: Slide;
}

export function TriangleDiagramSlide({ slide }: TriangleDiagramSlideProps) {
  return (
    <div className="min-h-[600px] p-12 bg-white">
      <h2 className="text-5xl font-normal tracking-tight mb-16">
        {slide.title}
      </h2>
      <div className="grid grid-cols-2 gap-12">
        <div className="relative">
          <div className="w-[400px] h-[400px] relative mx-auto">
            <div className="absolute inset-0 bg-gray-100 transform rotate-45"></div>
            {slide.numbers && (
              <>
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-4xl font-light">
                  {slide.numbers.first}
                </div>
                <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 text-4xl font-light">
                  {slide.numbers.second}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="space-y-12">
          <div>
            <h3 className="text-2xl font-medium mb-4">{slide.leftContent}</h3>
            <p className="text-gray-600 text-lg">{slide.content}</p>
          </div>
          {slide.rightContent && (
            <div>
              <h3 className="text-2xl font-medium mb-4">Deep Learning</h3>
              <p className="text-gray-600 text-lg">{slide.rightContent}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
