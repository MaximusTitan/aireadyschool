import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface MCQQuestionProps {
  question: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
  index: number;
  userAnswer: number | null;
  onChange: (answer: number) => void;
  showResults: boolean;
}

export default function MCQQuestion({
  question,
  index,
  userAnswer,
  onChange,
  showResults,
}: MCQQuestionProps) {
  return (
    <div>
      <h3 className="font-semibold mb-2">
        Question {index + 1}: {question.question}
      </h3>
      <RadioGroup
        value={userAnswer?.toString()}
        onValueChange={(value) => onChange(parseInt(value))}
        className="space-y-2"
      >
        {question.options.map((option, optionIndex) => (
          <div key={optionIndex} className="flex items-center space-x-2">
            <RadioGroupItem
              value={optionIndex.toString()}
              id={`q${index}-o${optionIndex}`}
            />
            <Label htmlFor={`q${index}-o${optionIndex}`}>{option}</Label>
            {showResults && (
              <span
                className={
                  optionIndex === question.correctAnswer
                    ? "text-green-600"
                    : userAnswer === optionIndex
                      ? "text-red-600"
                      : ""
                }
              >
                {optionIndex === question.correctAnswer
                  ? "✓"
                  : userAnswer === optionIndex
                    ? "✗"
                    : ""}
              </span>
            )}
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
