import { Textarea } from "@/components/ui/textarea";

interface ShortQuestionProps {
  question: {
    question: string;
    answer: string;
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
          rows={4} // adjust number of rows as needed
        />
      ) : (
        <div className="mt-2">
          <p>
            <strong>Your answer:</strong> {userAnswer || "No answer"}
          </p>
          <p>
            <strong>Correct answer:</strong> {question.answer}
          </p>
          <p className={evaluatedScore === 5 ? "text-green-600" : "text-red-600"}>
            Marks: {evaluatedScore !== undefined ? evaluatedScore : "Evaluating..."} / 5
          </p>
        </div>
      )}
    </div>
  );
}
