"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check, X, RotateCcw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Flashcard } from "../types/flashcard";

interface TestModeProps {
  flashcards: Flashcard[];
}

export function TestMode({ flashcards }: TestModeProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [draggedAnswer, setDraggedAnswer] = useState<string | null>(null);
  const [droppedAnswer, setDroppedAnswer] = useState("");
  const [isTestCompleted, setIsTestCompleted] = useState(false);

  useEffect(() => {
    if (currentCardIndex === flashcards.length) {
      setIsTestCompleted(true);
    }
  }, [currentCardIndex, flashcards.length]);

  if (flashcards.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-xl text-gray-500">
          No cards generated. Please generate flashcards first.
        </p>
      </div>
    );
  }

  const handleNextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
      setShowFeedback(false);
      setDroppedAnswer("");
    } else {
      setIsTestCompleted(true);
    }
  };

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
      setShowFeedback(false);
      setDroppedAnswer("");
    }
  };

  const handleDragStart = (e: React.DragEvent, answer: string) => {
    setDraggedAnswer(answer);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedAnswer) {
      setDroppedAnswer(draggedAnswer);
      checkAnswer(draggedAnswer);
    }
  };

  const checkAnswer = (answer: string) => {
    const correct = answer === flashcards[currentCardIndex].answer;
    setIsCorrect(correct);
    setShowFeedback(true);
    if (correct && !showFeedback) {
      setScore(score + 1);
    }
  };

  const restartTest = () => {
    setCurrentCardIndex(0);
    setScore(0);
    setShowFeedback(false);
    setDroppedAnswer("");
    setIsTestCompleted(false);
  };

  // Generate options including the correct answer
  const generateOptions = (flashcard: Flashcard): string[] => {
    const options = [flashcard.answer];
    while (options.length < 4) {
      const randomCard =
        flashcards[Math.floor(Math.random() * flashcards.length)];
      if (!options.includes(randomCard.answer)) {
        options.push(randomCard.answer);
      }
    }
    return options.sort(() => Math.random() - 0.5);
  };

  if (isTestCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] bg-gray-100 p-4">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-2xl font-bold mb-4 text-blue-600">
            Test Completed!
          </h2>
          <p className="text-xl mb-6 text-blue-800">
            Your final score: {score} out of {flashcards.length}
          </p>
          <Button
            onClick={restartTest}
            className="flex items-center justify-center"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Restart Test
          </Button>
        </div>
      </div>
    );
  }

  const currentFlashcard = flashcards[currentCardIndex];
  const options = generateOptions(currentFlashcard);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] bg-gray-100 p-4">
      <div className="mb-4 text-xl font-bold text-blue-600">
        Score: {score}/{flashcards.length}
      </div>

      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6">
        {/* Question Area */}
        <div className="text-xl font-semibold text-gray-800 mb-6">
          {currentFlashcard.question}
        </div>

        {/* Drop Zone */}
        <div
          className={`min-h-12 border-2 border-dashed rounded-lg mb-6 flex items-center justify-center p-4
            ${!droppedAnswer ? "border-gray-300 bg-gray-50" : "border-blue-500 bg-blue-50"}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {droppedAnswer ? (
            <span className="text-lg font-medium text-blue-800 break-words">
              {droppedAnswer}
            </span>
          ) : (
            <span className="text-gray-400">Drop your answer here</span>
          )}
        </div>

        {/* Draggable Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {options.map((option, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) => handleDragStart(e, option)}
              className={`p-4 text-center rounded-lg cursor-move 
                ${
                  droppedAnswer === option
                    ? "bg-blue-100 border-2 border-blue-300 text-blue-800"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                } 
                transition-colors break-words font-medium`}
            >
              {option}
            </div>
          ))}
        </div>

        {/* Feedback Area */}
        {showFeedback && (
          <div className="mt-4">
            {isCorrect ? (
              <Alert className="bg-green-100 border-green-200">
                <Check className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  Well done! That's correct!
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-red-100 border-red-200">
                <X className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-600">
                  Not quite right. Try again!
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4 mt-8">
        <Button
          onClick={handlePreviousCard}
          disabled={currentCardIndex === 0}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Previous
        </Button>
        <Button
          onClick={handleNextCard}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {currentCardIndex === flashcards.length - 1 ? "Finish" : "Next"}
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
