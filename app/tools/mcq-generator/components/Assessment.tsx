import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import MCQQuestion from "./MCQQuestion";
import TrueFalseQuestion from "./TrueFalseQuestion";
import FillInTheBlankQuestion from "./FillInTheBlankQuestion";
import { downloadAssessment } from "@/utils/exportAssessment";
import { Download } from "lucide-react";

interface AssessmentProps {
  assessment: any[];
  assessmentType: string;
  onSubmit: (answers: any[]) => void;
  showResults: boolean;
  userAnswers: any[];
  assessmentId?: string; // Make assessmentId optional
  topic: string; // Add this prop
}

export default function Assessment({
  assessment,
  assessmentType,
  onSubmit,
  showResults,
  userAnswers,
  assessmentId,
  topic,
}: AssessmentProps) {
  const [answers, setAnswers] = useState<any[]>(
    userAnswers.length > 0
      ? userAnswers
      : new Array(assessment.length).fill(null)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setAnswers(
      Array.isArray(userAnswers) && userAnswers.length > 0
        ? userAnswers
        : new Array(assessment.length).fill(null)
    );
  }, [userAnswers, assessment]);

  const handleAnswerChange = (questionIndex: number, answer: any) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answer;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  const calculateScore = () => {
    if (!Array.isArray(answers)) {
      console.error("Answers is not an array:", answers);
      return 0;
    }
    return answers.reduce((score, answer, index) => {
      const question = assessment[index];
      if (!question) return score;

      if (assessmentType === "mcq" && question.correctAnswer !== undefined) {
        return score + (answer === question.correctAnswer ? 1 : 0);
      } else if (
        assessmentType === "truefalse" &&
        question.correctAnswer !== undefined
      ) {
        return score + (answer === question.correctAnswer ? 1 : 0);
      } else if (assessmentType === "fillintheblank" && question.answer) {
        return (
          score +
          (answer?.toLowerCase() === question.answer.toLowerCase() ? 1 : 0)
        );
      }
      return score;
    }, 0);
  };

  const handleSaveResults = async () => {
    setIsSaving(true);
    setSaveError("");

    try {
      const response = await fetch("/api/generate-assessment", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: assessmentId,
          answers: answers,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save answers");
      }

      const data = await response.json();
      console.log("Answers saved successfully:", data);
    } catch (error) {
      console.error("Error saving answers:", error);
      setSaveError(
        `Failed to save answers: ${error instanceof Error ? error.message : "Unknown error occurred"}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end mb-4">
        <Button 
          onClick={() => downloadAssessment(assessment, assessmentType, topic, 'pdf', showResults)}
          className="bg-neutral-900 hover:bg-neutral-700"
        >
          <Download className="mr-2 h-4 w-4" />
          Download {showResults ? "PDF with Answers" : "Questions PDF"}
        </Button>
      </div>

      {assessment.map((question, index) => (
        <div key={index} className="border rounded-lg p-4">
          {assessmentType === "mcq" && (
            <MCQQuestion
              question={question}
              index={index}
              userAnswer={answers[index]}
              onChange={(answer) => handleAnswerChange(index, answer)}
              showResults={showResults}
            />
          )}
          {assessmentType === "truefalse" && (
            <TrueFalseQuestion
              question={question}
              index={index}
              userAnswer={answers[index]}
              onChange={(answer) => handleAnswerChange(index, answer)}
              showResults={showResults}
            />
          )}
          {assessmentType === "fillintheblank" && (
            <FillInTheBlankQuestion
              question={question}
              index={index}
              userAnswer={answers[index]}
              onChange={(answer) => handleAnswerChange(index, answer)}
              showResults={showResults}
            />
          )}
        </div>
      ))}
      {!showResults ? (
        <Button
          onClick={handleSubmit}
          className="w-full bg-neutral-500 hover:bg-neutral-600"
        >
          Submit Answers
        </Button>
      ) : (
        <div className="text-center">
          <h2 className="text-2xl font-bold">
            Your Score: {calculateScore()} / {assessment.length}
          </h2>
          <div className="flex justify-center gap-2 mt-4">
            <Button
              onClick={handleSaveResults}
              className="bg-neutral-900 hover:bg-neutral-700"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Results"}
            </Button>
            <Button 
              onClick={() => downloadAssessment(assessment, assessmentType, topic, 'pdf', true)}
              className="bg-neutral-900 hover:bg-neutral-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF with Answers
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="bg-neutral-900 hover:bg-neutral-700"
            >
              Start New Assessment
            </Button>
          </div>
          {saveError && <p className="text-red-600 mt-2">{saveError}</p>}
        </div>
      )}
    </div>
  );
}
