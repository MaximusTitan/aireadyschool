import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface MCQQuestionProps {
  question: {
    question: string;
    options: string[];
    correctAnswer: number; // assuming correctAnswer is still stored as an index
  };
  index: number;
  // update userAnswer type to string or null
  userAnswer: string | null;
  onChange: (answer: string) => void;
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
        // use userAnswer directly (option text) rather than converting a number to a string
        value={userAnswer || ""}
        // update onValueChange to pass the selected option text
        onValueChange={(value) => onChange(value)}
        className="space-y-2"
      >
        {question.options.map((option, optionIndex) => (
          <div key={optionIndex} className="flex items-center space-x-2">
            <RadioGroupItem
              // use option text as the value
              value={option}
              id={`q${index}-o${optionIndex}`}
              disabled={showResults}
            />
            <Label htmlFor={`q${index}-o${optionIndex}`}>{option}</Label>
            {showResults && (
              <span
                className={
                  // Compare the selected option text to the correct answer using the stored index
                  question.options[question.correctAnswer] === option
                    ? "text-green-600"
                    : userAnswer === option
                    ? "text-red-600"
                    : ""
                }
              >
                {question.options[question.correctAnswer] === option
                  ? "✓"
                  : userAnswer === option
                  ? "✗"
                  : ""}
              </span>
            )}
          </div>
        ))}
      </RadioGroup>
      {showResults && userAnswer !== question.options[question.correctAnswer] && (
        <div className="mt-2 p-2 border rounded bg-red-100 text-sm">
          Your answer is incorrect. The correct answer is "{question.options[question.correctAnswer]}". Please review the question details.
        </div>
      )}
    </div>
  );
}
