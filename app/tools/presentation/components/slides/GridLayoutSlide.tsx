"use client";

import { Slide } from "../../types/presentation";

interface GridLayoutSlideProps {
  slide: Slide;
}

export function GridLayoutSlide({ slide }: GridLayoutSlideProps) {
  return (
    <div className="min-h-[600px] p-12 bg-gray-50">
      <h2 className="text-4xl font-light mb-12">{slide.title}</h2>
      <div className="grid grid-cols-2 gap-8">
        {slide.additionalImages?.map((image, index) => (
          <div
            key={index}
            className="relative group overflow-hidden rounded-lg"
          >
            <img
              src={image}
              alt=""
              className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
              <p className="text-white text-lg font-medium">
                {index === 0 ? slide.leftContent : slide.rightContent}
              </p>
            </div>
          </div>
        ))}
      </div>
      {slide.content && (
        <p className="mt-8 text-gray-600 text-lg">{slide.content}</p>
      )}
    </div>
  );
}
