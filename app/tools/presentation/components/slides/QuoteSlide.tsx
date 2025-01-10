"use client";

import { Slide } from "../../types/presentation";

interface QuoteSlideProps {
  slide: Slide;
  theme: string;
}

export function QuoteSlide({ slide, theme }: QuoteSlideProps) {
  const themeStyles = {
    modern: "bg-gray-100 text-gray-900",
    playful: "bg-yellow-200 text-purple-800",
    nature: "bg-green-100 text-green-800",
    tech: "bg-blue-900 text-blue-100",
    vintage: "bg-sepia-200 text-sepia-900",
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
      <div className="flex-1 flex flex-col justify-center">
        <h2 className="text-3xl font-bold mb-6">{slide.title}</h2>
        <blockquote className="text-3xl font-serif italic mb-6">
          "{slide.quote?.text}"
        </blockquote>
        {slide.quote?.author && (
          <cite className="text-xl font-semibold">— {slide.quote.author}</cite>
        )}
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
