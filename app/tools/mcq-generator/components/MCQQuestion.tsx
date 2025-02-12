import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface MCQQuestionProps {
  question: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
  index: number;
  userAnswer: number | null;  // Change back to number
  onChange: (answer: number) => void;  // Change back to number
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
              disabled={showResults}
            />
            <Label htmlFor={`q${index}-o${optionIndex}`}>{option}</Label>
            {showResults && (
              <div className="ml-2 flex space-x-1">
                {userAnswer === optionIndex && (
                  <span className={optionIndex === question.correctAnswer ? "text-green-600" : "text-red-600"}>
                    {optionIndex === question.correctAnswer ? "✓" : "✗"}
                  </span>
                )}
                {optionIndex === question.correctAnswer && userAnswer !== optionIndex && (
                  <span className="text-green-600 ml-1">✓</span>
                )}
              </div>
            )}
          </div>
        ))}
      </RadioGroup>
      {showResults && userAnswer !== question.correctAnswer && (
        <div className="mt-2 p-2 border rounded bg-red-100 text-sm">
          Your answer: {userAnswer !== null ? question.options[userAnswer] : "No answer"}<br/>
          Correct answer: {question.options[question.correctAnswer]}
        </div>
      )}
    </div>
  );
}
