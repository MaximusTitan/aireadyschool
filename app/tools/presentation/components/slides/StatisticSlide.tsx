"use client";

import { Slide } from "../../types/presentation";

interface StatisticSlideProps {
  slide: Slide;
  theme: string;
}

export function StatisticSlide({ slide, theme }: StatisticSlideProps) {
  const themeStyles = {
    modern: "bg-blue-600 text-white",
    playful: "bg-purple-500 text-yellow-100",
    nature: "bg-green-600 text-white",
    tech: "bg-gray-900 text-blue-300",
    vintage: "bg-sepia-700 text-amber-100",
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
        <h2 className="text-4xl font-bold mb-8 text-center">{slide.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {slide.statistics?.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-5xl font-bold mb-2">{stat.value}</div>
              <div className="text-xl">{stat.label}</div>
            </div>
          ))}
        </div>
        {slide.content && (
          <p className="text-xl text-center max-w-3xl mx-auto">
            {slide.content}
          </p>
        )}
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
