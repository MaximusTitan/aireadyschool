import { useState } from "react";

type QuizCardProps = {
  topic: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty?: string;
  onAnswer?: (isCorrect: boolean) => void;
};

export const QuizCard = ({
  topic,
  question,
  options,
  correctAnswer,
  explanation,
  difficulty,
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
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs text-neutral-500 capitalize">{topic}</div>
        {difficulty && (
          <div
            className={`text-xs px-2 py-1 rounded-full ${
              difficulty === "easy"
                ? "bg-green-100 text-green-700"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            {difficulty}
          </div>
        )}
      </div>
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
