import React, { useState } from "react";
import { motion } from "framer-motion";
import type { Flashcard as FlashcardType } from "../types/flashcard";

interface FlashcardProps {
  flashcard: FlashcardType;
  isFlipped: boolean;
  onClick: () => void;
}

export function Flashcard({ flashcard, isFlipped, onClick }: FlashcardProps) {
  // const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div
      className="relative w-96 h-64 cursor-pointer [perspective:1000px]"
      onClick={onClick}
    >
      <div
        className="relative w-full h-full duration-500 [transform-style:preserve-3d]"
        style={{
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0)",
        }}
      >
        {/* Front of card (Question) */}
        <div className="absolute w-full h-full [backface-visibility:hidden]">
          <div className="w-full h-full bg-white rounded-lg shadow-lg p-6 flex items-center justify-center">
            <p className="text-xl font-semibold text-gray-800 text-center">
              {flashcard.question}
            </p>
          </div>
        </div>

        {/* Back of card (Answer) */}
        <div className="absolute w-full h-full [transform:rotateY(180deg)] [backface-visibility:hidden]">
          <div className="w-full h-full bg-blue-50 rounded-lg shadow-lg p-6 flex items-center justify-center">
            <p className="text-xl font-semibold text-gray-800 text-center">
              {flashcard.answer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
