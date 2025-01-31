import { useState } from "react";

type MathProblemProps = {
  question: string;
  hint?: string;
  answer: number;
  topic: string;
  level: string;
  onAnswer?: (data: {
    studentAnswer: number;
    correctAnswer: number;
    question: string;
    topic: string;
    level: string;
  }) => void;
};

export const MathProblem = ({
  question,
  hint,
  answer,
  topic,
  level,
  onAnswer,
}: MathProblemProps) => {
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResult(true);

    onAnswer?.({
      studentAnswer: Number(userAnswer),
      correctAnswer: answer,
      question,
      topic,
      level,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
            {topic} - {level}
          </span>
        </div>

        <div className="text-xl font-bold text-neutral-800">{question}</div>

        {hint && !showResult && (
          <div className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg flex items-center gap-2">
            <span className="text-lg">💡</span> {hint}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            className="w-full p-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-300 transition-all"
            placeholder="Enter your answer..."
            disabled={showResult}
          />
          {!showResult && (
            <button
              type="submit"
              className="w-full p-3 bg-neutral-800 text-white rounded-lg hover:bg-neutral-900 transition-all"
            >
              Check Answer
            </button>
          )}
        </form>

        {showResult && (
          <div
            className={`p-4 rounded-lg flex items-center gap-2 transition-all ${
              Number(userAnswer) === answer
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            <span className="text-lg">
              {Number(userAnswer) === answer ? "🎉" : "❌"}
            </span>
            <span>
              {Number(userAnswer) === answer
                ? "Well done!"
                : `The correct answer is ${answer}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
