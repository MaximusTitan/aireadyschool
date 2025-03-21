"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Assessment from "@/app/tools/mcq-generator/components/assessment/Assessment";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Answer {
  index: number; // Changed from questionIndex to match Assessment component
  answer: string; // Changed from selectedAnswer to match Assessment component
  isCorrect?: boolean;
}

interface AssessmentQuestion {
  question: string;
  correctAnswer: string | number;
  options?: string[];
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
          .select("completed")
          .eq("id", assignedId)
          .single();

        if (assignedError) throw assignedError;

        if (assignedData.completed) {
          router.push("/dashboard");
          return;
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

      // Show success message and redirect
      alert(`Assessment completed! Your score: ${Math.round(score)}%`);
      // setTimeout(() => {
      //   router.push("/dashboard");
      // }, 2000);
    } catch (error) {
      console.error("Error submitting answers:", error);
      setError("Failed to submit answers");
    }
  };

  if (loading) return <div>Loading assessment...</div>;
  if (error) return <div>{error}</div>;
  if (!assessment) return <div>Assessment not found</div>;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Link href="/dashboard">
        <Button variant="outline" className="mb-4">
          ← Back to Dashboard
        </Button>
      </Link>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <Assessment
          assessment={assessment.questions}
          assessmentType={assessment.assessment_type}
          onSubmit={handleAnswerSubmit}
          showResults={showResults}
          userAnswers={userAnswers}
          assessmentId={assessment.id}
          topic={assessment.topic}
        />
      </div>
    </div>
  );
}
