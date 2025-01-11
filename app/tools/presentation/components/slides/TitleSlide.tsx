"use client";

import { Slide } from "../../types/presentation";

interface TitleSlideProps {
  slide: Slide;
  theme: string;
}

export function TitleSlide({ slide, theme }: TitleSlideProps) {
  const themeStyles = {
    modern: "bg-gradient-to-r from-blue-500 to-purple-600 text-white",
    playful: "bg-yellow-300 text-indigo-900",
    nature: "bg-green-700 text-white",
    tech: "bg-gray-900 text-green-400",
    vintage: "bg-sepia-700 text-amber-100",
  };

  const bgStyle =
    themeStyles[theme as keyof typeof themeStyles] || themeStyles.modern;

  return (
    <div className={`min-h-[600px] ${bgStyle} flex items-center p-12`}>
      <div className="flex-1 pr-8">
        <h1 className="text-6xl font-bold mb-6">{slide.title}</h1>
        {slide.content && (
          <p className="text-2xl mb-8 max-w-2xl">{slide.content}</p>
        )}
        {slide.author && (
          <div className="flex items-center mt-8">
            {slide.author.avatar && (
              <img
                src={slide.author.avatar}
                alt={slide.author.name}
                className="w-12 h-12 rounded-full mr-4"
              />
            )}
            <div>
              <div className="font-medium">{slide.author.name}</div>
              {slide.author.lastEdited && (
                <div className="text-sm opacity-75">
                  Last edited {slide.author.lastEdited}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex-1">
        <img
          src={slide.image}
          alt={slide.title}
          className="w-full h-auto rounded-lg shadow-lg"
        />
      </div>
    </div>
  );
}
