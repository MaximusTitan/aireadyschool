import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface MCQAssessmentProps {
  assessment: MCQQuestion[];
  onSubmit: (answers: number[]) => void;
  showResults: boolean;
  userAnswers: number[];
}

export default function MCQAssessment({
  assessment,
  onSubmit,
  showResults,
  userAnswers,
}: MCQAssessmentProps) {
  const [answers, setAnswers] = useState<number[]>(
    new Array(assessment.length).fill(-1)
  );

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  const calculateScore = () => {
    return userAnswers.reduce((score, answer, index) => {
      return score + (answer === assessment[index].correctAnswer ? 1 : 0);
    }, 0);
  };

  return (
    <div className="space-y-8">
      {assessment.map((question, questionIndex) => (
        <div key={questionIndex} className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">
            Question {questionIndex + 1}: {question.question}
          </h3>
          <RadioGroup
            value={answers[questionIndex].toString()}
            onValueChange={(value) =>
              handleAnswerChange(questionIndex, parseInt(value))
            }
            className="space-y-2"
          >
            {question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={optionIndex.toString()}
                  id={`q${questionIndex}-o${optionIndex}`}
                />
                <Label htmlFor={`q${questionIndex}-o${optionIndex}`}>
                  {option}
                </Label>
                {showResults && (
                  <span
                    className={
                      optionIndex === question.correctAnswer
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {optionIndex === question.correctAnswer
                      ? "✓"
                      : userAnswers[questionIndex] === optionIndex
                        ? "✗"
                        : ""}
                  </span>
                )}
              </div>
            ))}
          </RadioGroup>
        </div>
      ))}
      {!showResults ? (
        <Button onClick={handleSubmit} className="w-full">
          Submit Answers
        </Button>
      ) : (
        <div className="text-center">
          <h2 className="text-2xl font-bold">
            Your Score: {calculateScore()} / {assessment.length}
          </h2>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Start New Assessment
          </Button>
        </div>
      )}
    </div>
  );
}
