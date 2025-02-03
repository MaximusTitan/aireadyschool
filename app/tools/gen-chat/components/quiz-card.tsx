import { useState } from "react";

type QuizCardProps = {
  topic: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  onAnswer?: (isCorrect: boolean) => void;
};

export const QuizCard = ({
  topic,
  question,
  options,
  correctAnswer,
  explanation,
  onAnswer,
}: QuizCardProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    const isCorrect = selectedAnswer === correctAnswer;
    setShowResult(true);
    onAnswer?.(isCorrect);
  };

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-white/50">
      <div className="text-sm font-medium">{question}</div>

      <div className="space-y-1">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => !showResult && setSelectedAnswer(option)}
            disabled={showResult}
            className={`w-full p-2 text-sm text-left rounded ${
              selectedAnswer === option
                ? "bg-neutral-800 text-white"
                : "bg-neutral-100 hover:bg-neutral-200"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {!showResult && selectedAnswer && (
        <button
          onClick={handleSubmit}
          className="w-full p-2 text-sm bg-neutral-800 text-white rounded"
        >
          Submit
        </button>
      )}

      {showResult && (
        <div className="space-y-1 text-sm">
          <div
            className={
              selectedAnswer === correctAnswer
                ? "text-green-600"
                : "text-red-600"
            }
          >
            {selectedAnswer === correctAnswer
              ? "✓ Correct!"
              : `× The answer is: ${correctAnswer}`}
          </div>
          {explanation && (
            <div className="text-neutral-600 text-xs">{explanation}</div>
          )}
        </div>
      )}
    </div>
  );
};
