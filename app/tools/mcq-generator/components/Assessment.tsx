import { useState } from "react";
import { Button } from "@/components/ui/button";
import MCQQuestion from "./MCQQuestion";
import TrueFalseQuestion from "./TrueFalseQuestion";
import FillInTheBlankQuestion from "./FillInTheBlankQuestion";
import { createClient } from "@/utils/supabase/client";

interface AssessmentProps {
  assessment: any[];
  assessmentType: string;
  onSubmit: (answers: any[]) => void;
  showResults: boolean;
  userAnswers: any[];
}

const supabase = createClient();

export default function Assessment({
  assessment,
  assessmentType,
  onSubmit,
  showResults,
  userAnswers,
}: AssessmentProps) {
  const [answers, setAnswers] = useState<any[]>(
    new Array(assessment.length).fill(null)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleAnswerChange = (questionIndex: number, answer: any) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answer;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  const calculateScore = () => {
    return userAnswers.reduce((score, answer, index) => {
      if (assessmentType === "mcq") {
        return score + (answer === assessment[index].correctAnswer ? 1 : 0);
      } else if (assessmentType === "truefalse") {
        return score + (answer === assessment[index].correctAnswer ? 1 : 0);
      } else if (assessmentType === "fillintheblank") {
        return (
          score +
          (answer.toLowerCase() === assessment[index].answer.toLowerCase()
            ? 1
            : 0)
        );
      }
      return score;
    }, 0);
  };

  const handleSaveResults = async () => {
    setIsSaving(true);
    setSaveError("");

    try {
      console.log("Saving assessment results:", {
        assessment_type: assessmentType,
        user_answers: userAnswers,
        score: calculateScore(),
        total_questions: assessment.length,
      });

      const { data, error } = await supabase
        .from("assessment_results")
        .insert({
          assessment_type: assessmentType,
          user_answers: userAnswers,
          score: calculateScore(),
          total_questions: assessment.length,
        })
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(`Failed to save results: ${error.message}`);
      }

      console.log("Results saved successfully:", data);
    } catch (error) {
      console.error("Error saving results:", error);
      setSaveError(
        `Failed to save results: ${error instanceof Error ? error.message : "Unknown error occurred"}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
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
          <Button
            onClick={handleSaveResults}
            className="mt-4 mr-2 bg-neutral-500 hover:bg-neutral-600"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Results"}
          </Button>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4 bg-neutral-500 hover:bg-neutral-600"
          >
            Start New Assessment
          </Button>
          {saveError && <p className="text-red-600 mt-2">{saveError}</p>}
        </div>
      )}
    </div>
  );
}
