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
    <div className="border rounded-lg p-3 space-y-2 bg-white/50">
      <div className="text-sm font-medium">{question}</div>

      {hint && !showResult && (
        <div className="text-xs text-neutral-600">💡 {hint}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="number"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          className="w-full p-2 text-sm rounded border"
          placeholder="Answer"
          disabled={showResult}
        />
        {!showResult && (
          <button
            type="submit"
            className="w-full p-2 text-sm bg-neutral-800 text-white rounded"
          >
            Check
          </button>
        )}
      </form>

      {showResult && (
        <div
          className={`text-sm ${Number(userAnswer) === answer ? "text-green-600" : "text-red-600"}`}
        >
          {Number(userAnswer) === answer
            ? "✓ Correct!"
            : `× The answer is ${answer}`}
        </div>
      )}
    </div>
  );
};
