import { useState } from "react";
import { cn } from "@/lib/utils";

type AssessmentQuestion = {
  question: string;
  type: "mcq" | "truefalse" | "shortanswer";
  options?: string[] | null;
  correctAnswer: number | boolean | string;
};

type AssessmentCardProps = {
  subject: string;
  topic: string;
  difficulty: string;
  questions: AssessmentQuestion[];
  onSubmit?: (
    answers: Array<{
      question: string;
      answer: string | number | boolean;
      isCorrect: boolean;
      correctAnswer: number | boolean | string;
    }>
  ) => void;
};

export const AssessmentCard = ({
  subject,
  topic,
  difficulty,
  questions,
  onSubmit,
}: AssessmentCardProps) => {
  const [answers, setAnswers] = useState<
    Record<number, string | number | boolean>
  >({});
  const [submitted, setSubmitted] = useState(false);

  const handleAnswerChange = (
    index: number,
    answer: string | number | boolean
  ) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [index]: answer }));
  };

  const handleSubmit = () => {
    if (!onSubmit || Object.keys(answers).length !== questions.length) return;

    const results = questions.map((question, index) => {
      let isCorrect = false;
      const userAnswer = answers[index];

      switch (question.type) {
        case "mcq":
          isCorrect = Number(question.correctAnswer) === Number(userAnswer);
          break;
        case "truefalse":
          isCorrect = question.correctAnswer === userAnswer;
          break;
        case "shortanswer":
          isCorrect =
            question.correctAnswer.toString().toLowerCase() ===
            userAnswer?.toString().toLowerCase();
          break;
      }

      return {
        question: question.question,
        answer: userAnswer,
        isCorrect,
        correctAnswer: question.correctAnswer,
      };
    });

    onSubmit(results);
    setSubmitted(true);
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-white/50">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-neutral-500">
          {subject} • {topic}
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

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((question, qIndex) => (
          <div key={qIndex} className="space-y-3 p-4 bg-neutral-50 rounded-lg">
            <div className="flex justify-between">
              <p className="font-medium text-sm">
                Question {qIndex + 1}: {question.question}
              </p>
              {submitted && (
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-1 rounded-md",
                    answers[qIndex] === question.correctAnswer
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  )}
                >
                  {answers[qIndex] === question.correctAnswer
                    ? "Correct"
                    : "Incorrect"}
                </span>
              )}
            </div>

            {/* MCQ Options */}
            {question.type === "mcq" && question.options && (
              <div className="space-y-2 ml-4">
                {question.options.map((option, oIndex) => (
                  <button
                    key={oIndex}
                    onClick={() => handleAnswerChange(qIndex, oIndex)}
                    disabled={submitted}
                    className={cn(
                      "w-full p-3 text-sm text-left rounded transition-colors",
                      answers[qIndex] === oIndex
                        ? "bg-neutral-800 text-white"
                        : "bg-white hover:bg-neutral-100",
                      submitted &&
                        Number(question.correctAnswer) === oIndex &&
                        "bg-green-100 text-green-800",
                      submitted &&
                        answers[qIndex] === oIndex &&
                        Number(question.correctAnswer) !== oIndex &&
                        "bg-red-100 text-red-800"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {/* True/False Options */}
            {question.type === "truefalse" && (
              <div className="flex gap-2 ml-4">
                {[true, false].map((value) => (
                  <button
                    key={value.toString()}
                    onClick={() => handleAnswerChange(qIndex, value)}
                    disabled={submitted}
                    className={cn(
                      "px-4 py-2 text-sm rounded transition-colors flex-1",
                      answers[qIndex] === value
                        ? "bg-neutral-800 text-white"
                        : "bg-white hover:bg-neutral-100",
                      submitted &&
                        question.correctAnswer === value &&
                        "bg-green-100 text-green-800",
                      submitted &&
                        answers[qIndex] === value &&
                        question.correctAnswer !== value &&
                        "bg-red-100 text-red-800"
                    )}
                  >
                    {value ? "True" : "False"}
                  </button>
                ))}
              </div>
            )}

            {/* Short Answer Input */}
            {question.type === "shortanswer" && (
              <div className="ml-4">
                <input
                  type="text"
                  value={answers[qIndex]?.toString() || ""}
                  onChange={(e) => handleAnswerChange(qIndex, e.target.value)}
                  disabled={submitted}
                  placeholder="Type your answer here..."
                  className={cn(
                    "w-full p-2 border rounded text-sm",
                    submitted &&
                      answers[qIndex]?.toString().toLowerCase() ===
                        question.correctAnswer.toString().toLowerCase()
                      ? "bg-green-50 border-green-200"
                      : submitted
                        ? "bg-red-50 border-red-200"
                        : ""
                  )}
                />
                {submitted && (
                  <p className="text-xs mt-1 text-neutral-500">
                    Correct answer: {question.correctAnswer}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit Button */}
      {!submitted && Object.keys(answers).length === questions.length && (
        <button
          onClick={handleSubmit}
          className="w-full p-3 text-sm bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors"
        >
          Submit Assessment
        </button>
      )}

      {/* Results Summary */}
      {submitted && (
        <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Results Summary</p>
              <p className="text-sm text-neutral-600">
                Score:{" "}
                {
                  questions.filter(
                    (_, i) => answers[i] === questions[i].correctAnswer
                  ).length
                }
                out of {questions.length} correct
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
