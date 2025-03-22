import { useState, useEffect, Fragment } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FillInTheBlankQuestionProps {
  question: {
    question: string;
    answer?: string; // Mark answer as optional if it might be undefined
    options?: string[];
  };
  index: number;
  userAnswer: string | null;
  onChange: (answer: string) => void;
  showResults: boolean;
}

export default function FillInTheBlankQuestion({
  question,
  index,
  userAnswer,
  onChange,
  showResults,
}: FillInTheBlankQuestionProps) {
  const [draggedOption, setDraggedOption] = useState<string | null>(null);

  useEffect(() => {
    if (userAnswer === null) {
      onChange("");
    }
  }, [userAnswer, onChange]);

  const handleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    option: string
  ) => {
    setDraggedOption(option);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggedOption) {
      onChange(draggedOption);
    }
  };

  const questionParts = question.question.split("___");
  // Use a safe fallback for answer
  const correctAnswer = question.answer || "";

  return (
    <div>
      <h3 className="font-semibold mb-2">Question {index + 1}:</h3>
      <div className="flex items-center space-x-2 mb-4">
        {questionParts.map((part, i) => (
          <Fragment key={i}>
            <span>{part}</span>
            {i < questionParts.length - 1 && (
              <div
                className="w-32 h-8 border-2 border-dashed border-gray-300 flex items-center justify-center"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {userAnswer || "___"}
              </div>
            )}
          </Fragment>
        ))}
      </div>
      {!showResults && (
        <div className="flex flex-wrap gap-2 mb-4">
          {(question.options || []).map((option, optionIndex) => (
            <Button
              key={optionIndex}
              variant="outline"
              draggable
              onDragStart={(e) => handleDragStart(e, option)}
              onClick={() => onChange(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      )}
      {showResults && (
        <>
          <div
            className={
              userAnswer?.toLowerCase() === correctAnswer.toLowerCase()
                ? "text-green-600"
                : "text-red-600"
            }
          >
            {userAnswer?.toLowerCase() === correctAnswer.toLowerCase()
              ? "Correct!"
              : `Incorrect. The correct answer is: ${correctAnswer}`}
          </div>
          {showResults &&
            userAnswer?.toLowerCase() !== correctAnswer.toLowerCase() && (
              <div className="mt-2 p-2 border rounded bg-red-100 text-sm">
                Your answer is incorrect because it does not match the expected word or phrase. The correct answer is "{correctAnswer}".
              </div>
            )}
        </>
      )}
    </div>
  );
}
