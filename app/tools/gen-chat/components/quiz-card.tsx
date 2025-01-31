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
    <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 p-6 rounded-xl shadow-sm border border-neutral-200">
      <div className="space-y-4">
        <div className="text-sm font-medium text-neutral-600 uppercase tracking-wide">
          {topic}
        </div>
        <div className="text-lg font-bold text-neutral-800">{question}</div>

        <div className="space-y-2">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => !showResult && setSelectedAnswer(option)}
              disabled={showResult}
              className={`w-full p-3 rounded-lg text-left transition-colors ${
                selectedAnswer === option
                  ? "bg-neutral-800 text-white"
                  : "bg-white/50 hover:bg-white/80"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {!showResult && selectedAnswer && (
          <button
            onClick={handleSubmit}
            className="w-full p-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-900 transition-colors"
          >
            Submit Answer
          </button>
        )}

        {showResult && (
          <>
            <div
              className={`p-3 rounded-lg ${
                selectedAnswer === correctAnswer
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {selectedAnswer === correctAnswer
                ? "🎉 Correct!"
                : `The correct answer is: ${correctAnswer}`}
            </div>
            {explanation && (
              <div className="text-sm text-blue-700 bg-white/50 p-3 rounded-lg">
                {explanation}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
