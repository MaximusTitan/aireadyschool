import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface MCQQuestionProps {
  question: {
    question: string
    options: string[]
    correctAnswer: number
  }
  index: number
  userAnswer: number | null
  onChange: (answer: number) => void
  showResults: boolean
}

export default function MCQQuestion({ question, index, userAnswer, onChange, showResults }: MCQQuestionProps) {
  return (
    <div className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.05)] p-6 mb-4">
      <div className="flex gap-4">
        <div className="text-2xl font-bold text-rose-500 min-w-[2rem]">{index + 1}</div>
        <div className="flex-1">
          <h3 className="text-gray-800 mb-4">{question.question}</h3>
          <RadioGroup
            value={userAnswer?.toString()}
            onValueChange={(value) => onChange(Number.parseInt(value))}
            className="space-y-3"
          >
            {question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-3">
                <RadioGroupItem
                  value={optionIndex.toString()}
                  id={`q${index}-o${optionIndex}`}
                  disabled={showResults}
                  className="text-rose-500 border-gray-300"
                />
                <Label htmlFor={`q${index}-o${optionIndex}`} className="text-gray-700">
                  {option}
                </Label>
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
                    {optionIndex === question.correctAnswer ? "✓" : userAnswer === optionIndex ? "✗" : ""}
                  </span>
                )}
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  )
}

