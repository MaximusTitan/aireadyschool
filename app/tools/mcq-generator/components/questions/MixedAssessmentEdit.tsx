// app/tools/mcq-generator/components/questions/MixedAssessmentEdit.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface MixedAssessmentEditProps {
  questions: any[]; // each question should include a `type` field: "mcq", "truefalse", etc.
  onAnswerChange: (index: number, answer: any) => void;
  onQuestionEdit: (index: number, field: string, value: string) => void;
  onOptionEdit: (questionIndex: number, optionIndex: number, value: string) => void;
  saveEdits: () => void;
  isSaving: boolean;
  uploadedImages: (string | null)[];
}

export default function MixedAssessmentEdit({
  questions,
  onAnswerChange,
  onQuestionEdit,
  onOptionEdit,
  saveEdits,
  isSaving,
  uploadedImages,
}: MixedAssessmentEditProps) {
  return (
    <div>
      {questions.map((question, index) => (
        <div key={index} className="border rounded-lg p-4 mb-4">
          <div className="flex gap-4 items-stretch">
            <div className="flex-1">
              {/* Editable question text */}
              <Textarea
                value={question.question}
                onChange={(e) => onQuestionEdit(index, "question", e.target.value)}
                className="mb-2"
              />
              {/* Editable inputs based on question type */}
              {question.type === "mcq" && question.options && (
                <div>
                  {question.options.map((option: string, optionIndex: number) => (
                    <Input
                      key={optionIndex}
                      value={option}
                      onChange={(e) => onOptionEdit(index, optionIndex, e.target.value)}
                      className="mb-1"
                    />
                  ))}
                </div>
              )}
              {(question.type === "truefalse" ||
                question.type === "fillintheblank" ||
                question.type === "shortanswer") && (
                <Input
                  value={question.answer}
                  onChange={(e) => onQuestionEdit(index, "answer", e.target.value)}
                  className="mt-2"
                />
              )}
            </div>
            {/* Show uploaded image if available */}
            <div className="w-32 h-32 bg-gray-100 flex items-center justify-center">
              {uploadedImages[index] ? (
                <img
                  src={uploadedImages[index] || "/placeholder.svg"}
                  alt={`Image for question ${index + 1}`}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-gray-400">No image</span>
              )}
            </div>
          </div>
        </div>
      ))}
      <Button onClick={saveEdits} className="mt-4 bg-rose-600 hover:bg-rose-500" disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Edits"}
      </Button>
    </div>
  );
}
