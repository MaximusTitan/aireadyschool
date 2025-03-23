import { Check, X } from "lucide-react"; // or any icon library you prefer
import { Textarea } from "@/components/ui/textarea";

interface ShortQuestionProps {
  question: {
    question: string;
    answer?: string;        // If you store correct answers in 'answer'
    correctAnswer?: string; // If you store correct answers in 'correctAnswer'
  };
  index: number;
  userAnswer: string | null;
  onChange: (answer: string) => void;
  showResults: boolean;
  evaluatedScore?: number; // new prop from API evaluation
}

export default function ShortQuestion({
  question,
  index,
  userAnswer,
  onChange,
  showResults,
  evaluatedScore,
}: ShortQuestionProps) {
  // Decide whether the short answer is correct or not.
  // If your API returns 1 for correct, 0 for incorrect:
  const isCorrect = evaluatedScore === 1;

  return (
    <div className="mb-4">
      <h3 className="font-semibold mb-2">
        Question {index + 1}: {question.question}
      </h3>

      {!showResults ? (
        // Use Textarea for multi-line input
        <Textarea
          value={userAnswer || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer here..."
          rows={4}
        />
      ) : (
        <div className="mt-2">
          {/* 
            Show check or cross near the user's answer. 
            For example, to the left of the "Your answer:" label 
          */}
          <p className="flex items-center">
            {evaluatedScore !== undefined ? (
              isCorrect ? (
                <Check className="text-green-600 mr-1" />
              ) : (
                <X className="text-red-600 mr-1" />
              )
            ) : null}
            <strong>Your answer:</strong> {userAnswer || "No answer"}
          </p>

          <p>
            <strong>Correct answer:</strong>{" "}
            {question.answer ?? question.correctAnswer}
          </p>
        </div>
      )}
    </div>
  );
}
