"use client";

import { Slide } from "../../types/presentation";

interface FullBleedSlideProps {
  slide: Slide;
}

export function FullBleedSlide({ slide }: FullBleedSlideProps) {
  return (
    <div
      className="min-h-[600px] relative flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: slide.backgroundColor || "rgb(15, 23, 42)" }}
    >
      <div className="absolute inset-0">
        <img
          src={slide.image}
          alt=""
          className="w-full h-full object-cover opacity-20"
        />
      </div>
      <div className="relative z-10 text-center p-16 text-white max-w-4xl">
        <h2 className="text-5xl font-bold mb-8">{slide.title}</h2>
        <p className="text-xl leading-relaxed">{slide.content}</p>
      </div>
    </div>
  );
}
