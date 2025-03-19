import { useState } from "react";
import { cn } from "@/lib/utils";

type QuizOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

type QuizCardProps = {
  subject: string;
  topic?: string;
  question: string;
  options: QuizOption[];
  explanation: string;
  difficulty: string;
  onAnswer?: (data: {
    selectedOption: QuizOption;
    question: string;
    allOptions: QuizOption[];
    subject: string;
    difficulty: string;
    explanation: string;
  }) => void;
};

export const QuizCard = ({
  subject,
  topic,
  question,
  options,
  explanation,
  difficulty,
  onAnswer,
}: QuizCardProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = () => {
    if (!selectedId) return;
    const selectedOption = options.find((opt) => opt.id === selectedId);
    if (selectedOption) {
      setShowResult(true);
      onAnswer?.({
        selectedOption,
        question,
        allOptions: options,
        subject,
        difficulty,
        explanation,
      });
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-white/50">
      <div className="flex justify-between items-center">
        <div className="text-xs text-neutral-500">
          {subject} {topic && `• ${topic}`}
        </div>
        <div
          className={cn(
            "text-xs px-2 py-1 rounded-full",
            difficulty === "easy"
              ? "bg-green-100 text-green-700"
              : difficulty === "medium"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
          )}
        >
          {difficulty}
        </div>
      </div>

      <div className="text-sm font-medium">{question}</div>

      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => !showResult && setSelectedId(option.id)}
            disabled={showResult}
            className={cn(
              "w-full p-3 text-sm text-left rounded transition-colors",
              selectedId === option.id
                ? "bg-neutral-800 text-white"
                : "bg-neutral-100 hover:bg-neutral-200",
              showResult && option.isCorrect && "bg-green-100 text-green-800",
              showResult &&
                selectedId === option.id &&
                !option.isCorrect &&
                "bg-red-100 text-red-800"
            )}
          >
            {option.text}
          </button>
        ))}
      </div>

      {!showResult && selectedId && (
        <button
          onClick={handleSubmit}
          className="w-full p-2 text-sm bg-neutral-800 text-white rounded hover:bg-neutral-700"
        >
          Check Answer
        </button>
      )}

      {showResult && (
        <div className="text-sm space-y-2 p-3 bg-neutral-50 rounded">
          <div
            className={cn(
              "font-medium",
              options.find((o) => o.id === selectedId)?.isCorrect
                ? "text-green-600"
                : "text-red-600"
            )}
          >
            {options.find((o) => o.id === selectedId)?.isCorrect
              ? "✓ Correct!"
              : "× Incorrect"}
          </div>
          <div className="text-neutral-600 text-sm">{explanation}</div>
        </div>
      )}
    </div>
  );
};
