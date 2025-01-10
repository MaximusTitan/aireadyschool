"use client";

import { Slide } from "../../types/presentation";

interface NumberedColumnsSlideProps {
  slide: Slide;
}

export function NumberedColumnsSlide({ slide }: NumberedColumnsSlideProps) {
  return (
    <div className="min-h-[600px] p-12 bg-white">
      <h2 className="text-5xl font-normal tracking-tight mb-16">
        {slide.title}
      </h2>
      <div className="grid grid-cols-[2fr,3fr] gap-8">
        <div className="space-y-12">
          <div className="flex gap-6">
            <div className="w-12 h-12 bg-gray-100 flex items-center justify-center text-xl">
              1
            </div>
            <div>
              <h3 className="text-2xl font-medium mb-2">Statistical Methods</h3>
              <p className="text-gray-600">{slide.leftContent}</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="w-12 h-12 bg-gray-100 flex items-center justify-center text-xl">
              2
            </div>
            <div>
              <h3 className="text-2xl font-medium mb-2">Data-Driven Models</h3>
              <p className="text-gray-600">{slide.rightContent}</p>
            </div>
          </div>
        </div>
        {slide.image && (
          <div className="relative">
            <img
              src={slide.image}
              alt=""
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}
