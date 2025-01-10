"use client";

import { Slide } from "../../types/presentation";

interface ComparisonSlideProps {
  slide: Slide;
  theme: string;
}

export function ComparisonSlide({ slide, theme }: ComparisonSlideProps) {
  const themeStyles = {
    modern: "bg-gray-50 text-gray-900",
    playful: "bg-pink-100 text-purple-900",
    nature: "bg-green-50 text-green-900",
    tech: "bg-blue-100 text-blue-900",
    vintage: "bg-sepia-100 text-sepia-900",
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
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-2xl font-semibold mb-4">
              {slide.comparison?.left.title}
            </h3>
            <ul className="list-disc list-inside space-y-2">
              {slide.comparison?.left.points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-2xl font-semibold mb-4">
              {slide.comparison?.right.title}
            </h3>
            <ul className="list-disc list-inside space-y-2">
              {slide.comparison?.right.points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
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
