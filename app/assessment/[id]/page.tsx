"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Assessment from "@/app/tools/mcq-generator/components/assessment/Assessment";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Answer {
  index: number;
  answer: string;
  isCorrect?: boolean;
}

interface AssessmentQuestion {
  question: string;
  correctAnswer: string | number;
  options?: string[];
}

interface AssignedAssessment {
  id: string;
  assessment_id: string;
  completed: boolean;
  student_answers: Answer[] | null;
  score: number | null;
}

export default function TakeAssessment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [assessment, setAssessment] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [assignedAssessment, setAssignedAssessment] =
    useState<AssignedAssessment | null>(null);

  useEffect(() => {
    const fetchAssessment = async () => {
      const id = window.location.pathname.split("/").pop();
      const assignedId = searchParams.get("assigned_id");

      if (!id || !assignedId) {
        setError("Assessment not found");
        return;
      }

      try {
        // Fetch the assessment
        const { data: assessmentData, error: assessmentError } = await supabase
          .from("assessments")
          .select("*")
          .eq("id", id)
          .single();

        if (assessmentError) throw assessmentError;

        // Check if already completed
        const { data: assignedData, error: assignedError } = await supabase
          .from("assigned_assessments")
          .select("*")
          .eq("id", assignedId)
          .single();

        if (assignedError) throw assignedError;

        setAssignedAssessment(assignedData);

        if (assignedData.completed) {
          setIsCompleted(true);
          setShowResults(true);
          if (assignedData.student_answers) {
            setUserAnswers(assignedData.student_answers);
          }
        } else if (assessmentData.answers) {
          setUserAnswers(assessmentData.answers);
        }

        setAssessment(assessmentData);
      } catch (error) {
        console.error("Error:", error);
        setError("Failed to load assessment");
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [supabase, router, searchParams]);

  const calculateScore = (
    answers: Answer[],
    questions: AssessmentQuestion[]
  ): number => {
    let correctCount = 0;

    answers.forEach((answer) => {
      const question = questions[answer.index];
      if (!question) return;

      // For MCQ, correctAnswer is the index
      if (typeof question.correctAnswer === "number") {
        const correct =
          question.options?.[question.correctAnswer] === answer.answer;
        correctCount += correct ? 1 : 0;
      }
      // For true/false or fill in the blanks
      else {
        const correct =
          question.correctAnswer.toLowerCase() === answer.answer.toLowerCase();
        correctCount += correct ? 1 : 0;
      }
    });

    return (correctCount / answers.length) * 100;
  };

  const handleAnswerSubmit = async (answers: Answer[]) => {
    const assignedId = searchParams.get("assigned_id");
    if (!assignedId || !assessment) return;

    try {
      // Calculate score using the questions from the assessment
      const score = calculateScore(answers, assessment.questions);

      // Enhance answers with correctness before saving
      const enhancedAnswers = answers.map((answer) => {
        const question = assessment.questions[answer.index];
        if (!question) return answer;

        let isCorrect = false;
        if (typeof question.correctAnswer === "number") {
          isCorrect =
            question.options?.[question.correctAnswer] === answer.answer;
        } else {
          isCorrect =
            question.correctAnswer.toLowerCase() ===
            answer.answer.toLowerCase();
        }

        return {
          ...answer,
          isCorrect,
        };
      });

      // Update assigned_assessment
      const { error } = await supabase
        .from("assigned_assessments")
        .update({
          completed: true,
          score: score,
          student_answers: enhancedAnswers,
        })
        .eq("id", assignedId);

      if (error) throw error;

      // NEW: Update assessments table with student's answers
      const putResponse = await fetch("/api/generate-assessment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: assessment.id, answers: enhancedAnswers }),
      });
      if (!putResponse.ok) {
        const errorData = await putResponse.json();
        throw new Error(
          errorData.error || "Failed to update assessment record"
        );
      }

      setUserAnswers(enhancedAnswers);
      setShowResults(true);
      setIsCompleted(true);

      // Show success message but don't redirect automatically
      alert(`Assessment completed! Your score: ${Math.round(score)}%`);
    } catch (error) {
      console.error("Error submitting answers:", error);
      setError("Failed to submit answers");
    }
  };

  if (loading)
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
        <p className="text-center text-gray-500">Loading assessment...</p>
      </div>
    );

  if (error)
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
          <p className="text-red-600 text-center">{error}</p>
          <div className="flex justify-center mt-4">
            <Link href="/dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );

  if (!assessment)
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg">
          <p className="text-amber-600 text-center">Assessment not found</p>
          <div className="flex justify-center mt-4">
            <Link href="/dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <Link href="/dashboard">
          <Button variant="outline" className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Button>
        </Link>

        {isCompleted &&
          assignedAssessment &&
          assignedAssessment.score !== null && (
            <div className="text-right">
              <div className="text-sm text-gray-500">Score</div>
              <div className="text-xl font-semibold">
                {Math.round(assignedAssessment.score)}%
              </div>
            </div>
          )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <Assessment
          assessment={assessment.questions}
          assessmentType={assessment.assessment_type}
          onSubmit={handleAnswerSubmit}
          showResults={showResults}
          userAnswers={userAnswers}
          assessmentId={assessment.id}
          topic={assessment.topic}
          readOnly={isCompleted} // Now we can use readOnly prop since it's defined
        />
      </div>
    </div>
  );
}
