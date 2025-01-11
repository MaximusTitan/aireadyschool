"use client";

import { Slide } from "../../types/presentation";

interface TimelineSlideProps {
  slide: Slide;
  theme: string;
}

export function TimelineSlide({ slide, theme }: TimelineSlideProps) {
  const themeStyles = {
    modern: "bg-white text-gray-900",
    playful: "bg-indigo-100 text-indigo-900",
    nature: "bg-green-50 text-green-900",
    tech: "bg-gray-100 text-gray-900",
    vintage: "bg-amber-50 text-amber-900",
  };

  const bgStyle =
    themeStyles[theme as keyof typeof themeStyles] || themeStyles.modern;

  const isImageLeft = slide.order % 2 === 0;

  return (
    <div className={`min-h-[600px] ${bgStyle} flex items-center p-12`}>
      {isImageLeft && (
        <div className="flex-1 pr-8">
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>
      )}
      <div className="flex-1">
        <h2 className="text-4xl font-bold mb-8">{slide.title}</h2>
        <div className="space-y-6">
          {slide.timeline?.map((item, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0 w-24 font-bold">{item.year}</div>
              <div className="flex-grow">{item.event}</div>
            </div>
          ))}
        </div>
        {slide.content && <p className="mt-6 text-lg">{slide.content}</p>}
      </div>
      {!isImageLeft && (
        <div className="flex-1 pl-8">
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  );
}
