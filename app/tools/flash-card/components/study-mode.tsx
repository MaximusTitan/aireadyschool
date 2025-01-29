"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Flashcard as FlashcardType } from "../types/flashcard";
import { Flashcard } from "./Flashcard";

interface StudyModeProps {
  flashcards: FlashcardType[];
}

export function StudyMode({ flashcards }: StudyModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    setIsFlipped(false);
  };

  const handlePrevious = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + flashcards.length) % flashcards.length
    );
    setIsFlipped(false);
  };

  if (flashcards.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p>No flashcards available. Generate some flashcards first!</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] bg-gray-100 p-4">
      <Flashcard
        flashcard={flashcards[currentIndex]}
        isFlipped={isFlipped}
        onClick={() => setIsFlipped(!isFlipped)}
      />
      <div className="flex gap-4 mt-8">
        <Button
          onClick={handlePrevious}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Previous
        </Button>
        <Button
          onClick={handleNext}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Next
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
