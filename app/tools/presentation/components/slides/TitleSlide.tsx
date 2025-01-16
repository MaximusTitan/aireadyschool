"use client";

import { Slide } from "../../types/presentation";

interface TitleSlideProps {
  slide: Slide;
  theme: string;
  style: React.CSSProperties;
}

export function TitleSlide({ slide, theme, style }: TitleSlideProps) {
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
    <div
      className={`w-full h-full flex flex-col ${bgStyle} font-sans`}
      style={style}
    >
      <div className="flex-1 flex">
        <div className="w-1/2 p-8 flex flex-col justify-center">
          <h1
            style={{
              fontSize: "3.5rem", // Decreased size
              lineHeight: "1.2",
              marginBottom: "var(--margin-vertical)",
              fontWeight: "300", // Lighter weight
              letterSpacing: "-0.02em", // Slight letter spacing adjustment
            }}
          >
            {slide.title}
          </h1>
          {slide.content && (
            <p
              style={{
                fontSize: "1.5rem", // Decreased size
                lineHeight: "1.5",
                marginBottom: "var(--margin-vertical)",
                fontWeight: "300",
                letterSpacing: "0.01em",
              }}
            >
              {slide.content}
            </p>
          )}
        </div>
        <div className="w-1/2 p-8 flex items-center justify-center">
          <img
            src={slide.image || "/placeholder.svg"}
            alt="Title slide illustration"
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          />
        </div>
      </div>
    </div>
  );
}
