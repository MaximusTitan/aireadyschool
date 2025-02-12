import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface TrueFalseQuestionProps {
  question: {
    question: string;
    correctAnswer: boolean;
  };
  index: number;
  userAnswer: boolean | null;
  onChange: (answer: boolean) => void;
  showResults: boolean;
}

export default function TrueFalseQuestion({
  question,
  index,
  userAnswer,
  onChange,
  showResults,
}: TrueFalseQuestionProps) {
  return (
    <div>
      <h3 className="font-semibold mb-2">
        Question {index + 1}: {question.question}
      </h3>
      <RadioGroup
        value={userAnswer === null ? undefined : userAnswer.toString()}
        onValueChange={(value) => onChange(value === "true")}
        className="space-y-2"
      >
        {["true", "false"].map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <RadioGroupItem
              value={option}
              id={`q${index}-${option}`}
              disabled={showResults}
            />
            <Label htmlFor={`q${index}-${option}`}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Label>
            {showResults && (
              <span
                className={
                  option === question.correctAnswer.toString()
                    ? "text-green-600"
                    : userAnswer?.toString() === option
                      ? "text-red-600"
                      : ""
                }
              >
                {option === question.correctAnswer.toString()
                  ? "✓"
                  : userAnswer?.toString() === option
                    ? "✗"
                    : ""}
              </span>
            )}
          </div>
        ))}
      </RadioGroup>
      {showResults && userAnswer !== question.correctAnswer && (
        <div className="mt-2 p-2 border rounded bg-red-100 text-sm">
          Your answer is incorrect. The correct answer is "{question.correctAnswer ? "True" : "False"}". Please consider the statement carefully.
        </div>
      )}
    </div>
  );
}
