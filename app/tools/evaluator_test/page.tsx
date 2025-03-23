"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import React from "react";
import { useSearchParams } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Question {
  question: string;
  options?: string[] | { [key: string]: string };
  correctAnswer?: any;
  answer?: string; // for descriptive questions
  explanation?: string;
  modelAnswer?: string; // Add this for descriptive/short answer questions
}

function InputField({ label, ...props }: any) {
  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <input
        {...props}
        className="w-full px-4 py-3 text-gray-700 bg-white border-2 border-gray-200 
        rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 
        focus:ring-pink-200 transition-all shadow-sm"
      />
    </div>
  );
}

function GradientButton({ children, isLoading, ...props }: any) {
  return (
    <button
      {...props}
      className={`px-6 py-3 font-semibold text-white rounded-xl transition-all
        bg-gradient-to-r from-rose-500 to-rose-600 
        hover:from-rose-600 hover:to-rose-700 
        focus:outline-none focus:ring-2 focus:ring-rose-500 
        disabled:opacity-70 disabled:cursor-not-allowed
        shadow-md hover:shadow-lg ${isLoading ? "cursor-wait" : ""}`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Processing...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}

function QuestionCard({ question, studentAnswer, index }: any) {
  const questionType =
    question.questionType ||
    (question.options
      ? Array.isArray(question.options)
        ? "FillBlanks"
        : "MCQ"
      : question.correctAnswer !== undefined
        ? "TrueFalse"
        : "Descriptive");

  // Enhanced getModelAnswer function
  const getModelAnswer = () => {
    switch (questionType) {
      case "MCQ":
        return Array.isArray(question.options)
          ? question.options[Number(question.correctAnswer)]
          : question.options?.[String(question.correctAnswer)];
      case "TrueFalse":
        return question.correctAnswer?.toString() || "";
      case "FillBlanks":
        return question.answer || question.correctAnswer;
      default:
        return (
          question.modelAnswer ||
          question.correctAnswer ||
          question.answer ||
          ""
        );
    }
  };

  const correctAnswer = getModelAnswer();

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-800">
            Question {index + 1}
            <span className="ml-2 text-sm text-gray-500">({questionType})</span>
          </h3>
          <p className="mt-1 text-gray-600">{question.question}</p>
        </div>
        <span className="ml-4 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
          5 points
        </span>
      </div>

      {questionType === "MCQ" && (
        <div className="mt-4 space-y-2">
          {Object.entries(question.options).map(
            ([key, value]: [string, any]) => (
              <div
                key={key}
                className={`p-3 rounded-lg transition-all ${
                  key === question.correctAnswer && key === studentAnswer
                    ? "bg-green-100 text-green-800 border-2 border-green-500"
                    : key === studentAnswer
                      ? "bg-pink-100 text-pink-800 border-2 border-pink-500"
                      : key === question.correctAnswer
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center">
                  {key === question.correctAnswer && (
                    <span className="mr-2">✅</span>
                  )}
                  {key === studentAnswer && <span className="mr-2">🔵</span>}
                  {key}. {value}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {questionType === "TrueFalse" && (
        <div className="mt-4 space-y-2">
          {["True", "False"].map((option) => {
            const isSelected = studentAnswer === (option === "True");
            const isCorrect = question.correctAnswer === (option === "True");
            return (
              <div
                key={option}
                className={`p-3 rounded-lg transition-all ${
                  isCorrect && isSelected
                    ? "bg-green-100 text-green-800 border-2 border-green-500"
                    : isSelected
                      ? "bg-pink-100 text-pink-800 border-2 border-pink-500"
                      : isCorrect
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center">
                  {isCorrect && <span className="mr-2">✅</span>}
                  {isSelected && <span className="mr-2">🔵</span>}
                  {option}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {questionType === "FillBlanks" && (
        <div className="mt-4">
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="font-medium text-green-800 mb-1">
              Correct Answer:
            </div>
            <div className="text-green-700">{correctAnswer}</div>
          </div>
          <div className="mt-2 p-3 bg-pink-50 rounded-lg border border-pink-200">
            <div className="font-medium text-pink-800 mb-1">Your Answer:</div>
            <div className="text-pink-700">
              {studentAnswer || "No answer provided"}
            </div>
          </div>
          {question.explanation && (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="font-medium text-blue-800 mb-1">Explanation:</div>
              <div className="text-blue-700">{question.explanation}</div>
            </div>
          )}
        </div>
      )}

      {(questionType === "Short Answer" || questionType === "Descriptive") && (
        <div className="mt-4 space-y-3">
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="font-medium text-green-800 mb-1">Model Answer:</div>
            <div className="text-green-700">{correctAnswer}</div>
          </div>
          <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
            <div className="font-medium text-pink-800 mb-1">Your Answer:</div>
            <div className="text-pink-700">
              {studentAnswer || "No answer provided"}
            </div>
          </div>
          {question.explanation && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="font-medium text-blue-800 mb-1">Explanation:</div>
              <div className="text-blue-700">{question.explanation}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryCard({
  evaluation,
  onClick,
}: {
  evaluation: any;
  onClick: () => void;
}) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium text-gray-800">
            Assessment ID: {evaluation.assessment_id}
          </h3>
          <p className="text-sm text-gray-600">
            Student ID: {evaluation.student_id}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(evaluation.created_at).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={onClick}
          className="px-4 py-2 text-sm bg-gradient-to-r from-rose-500 to-rose-600 
            text-white rounded-lg hover:from-rose-600 hover:to-rose-700 transition-all"
        >
          View Details
        </button>
      </div>
    </div>
  );
}

function CircularProgress({ percentage }: { percentage: number }) {
  const circumference = 2 * Math.PI * 45; // 45 is the radius
  const offset = circumference * (1 - percentage / 100);

  return (
    <div className="relative w-40 h-40">
      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#e6e6e6"
          strokeWidth="10"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#4CAF50"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-3xl font-bold text-gray-800">{percentage}%</span>
        <span className="text-sm text-gray-500">Score</span>
      </div>
    </div>
  );
}

function QuestionCircle({
  number,
  correct,
}: {
  number: number;
  correct: boolean;
}) {
  return (
    <div
      className={`w-full aspect-square rounded-full flex items-center justify-center 
        text-xs font-bold shadow-sm transition-all duration-300 
        ${correct ? "bg-green-500 text-white hover:bg-green-600" : "bg-red-500 text-white hover:bg-red-600"}`}
    >
      {number}
    </div>
  );
}

// Update the DetailedFeedbackItem component to handle sequential numbering
function DetailedFeedbackItem({ question, index, feedback }: any) {
  const feedbackData =
    typeof feedback === "object" ? feedback : JSON.parse(feedback);
  const questionNumber = `Q${index + 1}`; // Use sequential numbering

  // Helper function to format MCQ answer display
  const formatMCQAnswer = (answer: string, isCorrect: boolean) => {
    return (
      <div className="flex items-start">
        <span
          className={`font-medium ${isCorrect ? "text-green-600" : "text-red-600"}`}
        >
          "{answer}"
        </span>
      </div>
    );
  };

  const renderMCQOptions = () => {
    if (!feedbackData.options || feedbackData.questionType !== 'MCQ') return null;

    return (
      <div className="mt-2 space-y-1">
        <p className="text-sm text-gray-600">Options:</p>
        <div className="grid grid-cols-1 gap-1 pl-4">
          {feedbackData.options.map((option: string, idx: number) => {
            const optionKey = feedbackData.optionKeys[idx];
            const isSelected = optionKey === feedbackData.selectedOptionIndex;
            const isCorrect = optionKey === feedbackData.correctOptionIndex;

            return (
              <div
                key={idx}
                className={`text-sm p-2 rounded ${
                  isCorrect && isSelected
                    ? "bg-green-100 text-green-800"
                    : isSelected
                      ? "bg-red-100 text-red-800"
                      : isCorrect
                        ? "bg-green-50 text-green-700"
                        : "text-gray-600"
                }`}
              >
                {feedbackData.optionKeys[idx]}. {option}
                {isCorrect && " ✓"}
                {isSelected && !isCorrect && " ✗"}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 border-b last:border-b-0">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-lg font-semibold text-gray-700">
            {questionNumber}
          </span>
        </div>
        <div className="flex-1 space-y-2">
          <p className="font-medium text-gray-800">{feedbackData.question}</p>

          {/* Display options if MCQ */}
          {feedbackData.options && (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600">Options:</p>
              <div className="grid grid-cols-1 gap-1 pl-4">
                {feedbackData.options.map((option: string, idx: number) => (
                  <div
                    key={idx}
                    className={`text-sm p-2 rounded ${
                      idx === feedbackData.correctOptionIndex
                        ? "bg-green-100 text-green-800"
                        : idx === feedbackData.selectedOptionIndex &&
                            !feedbackData.isCorrect
                          ? "bg-red-100 text-red-800"
                          : "text-gray-600"
                    }`}
                  >
                    {idx + 1}. {option}
                    {idx === feedbackData.correctOptionIndex && " ✓"}
                    {idx === feedbackData.selectedOptionIndex &&
                      !feedbackData.isCorrect &&
                      " ✗"}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p
            className={`text-sm ${feedbackData.isCorrect ? "text-green-600" : "text-red-600"}`}
          >
            {feedbackData.explanation}
          </p>
        </div>
      </div>
    </div>
  );
}

// Update the EnhancedEvaluationView component's DetailedFeedback section
function EnhancedEvaluationView({ evaluation, assessment }: any) {
  // Calculate actual percentage from the evaluation score
  const percentage = Math.round(
    (evaluation.score / evaluation.total_marks) * 100
  );

  // Update the calculation of correct and incorrect answers
  const correctAnswers = Object.values(evaluation.detailed_feedback).filter(
    (f: any) =>
      typeof f === "object" ? f.isCorrect : f.toString().includes("✅")
  ).length;

  const totalQuestions = Object.keys(evaluation.detailed_feedback).length;
  const incorrectAnswers = totalQuestions - correctAnswers;

  return (
    <div className="bg-slate-50 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {assessment.subject} - {assessment.topic}
          </h1>
          <p className="text-gray-600">Student ID: {evaluation.student_id}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center">
            <div className="text-3xl font-bold text-green-600 mr-2">
              {evaluation.score}/{evaluation.total_marks}
            </div>
            <div
              className={`text-sm px-2 py-1 rounded ${
                evaluation.performance === "Good"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {evaluation.performance}
            </div>
          </div>
          <p className="text-gray-600">
            Benchmark: {evaluation.benchmark_score}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Performance Summary</h2>
          <div className="flex items-center justify-center h-48">
            <CircularProgress percentage={percentage} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Question Analysis</h2>
          <div className="h-48 flex items-center justify-center">
            <div className="w-full h-full flex flex-col">
              <div className="flex mb-2">
                <div className="flex-1 bg-green-100 p-2 rounded-l text-center">
                  <div className="text-xl font-bold text-green-700">
                    {correctAnswers}
                  </div>
                  <div className="text-xs text-green-600">Correct</div>
                </div>
                <div className="flex-1 bg-red-100 p-2 rounded-r text-center">
                  <div className="text-xl font-bold text-red-700">
                    {incorrectAnswers}
                  </div>
                  <div className="text-xs text-red-600">Incorrect</div>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div className="bg-gray-200 h-6 rounded-full overflow-hidden">
                  <div
                    className="bg-green-500 h-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 mt-4">
                  {Object.entries(evaluation.detailed_feedback).map(
                    ([qId, feedback]: any, index: number) => (
                      <QuestionCircle
                        key={qId}
                        number={index + 1}
                        correct={
                          typeof feedback === "string"
                            ? feedback.includes("✅")
                            : feedback.isCorrect
                        }
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold p-4 border-b">
          Detailed Feedback
        </h2>
        <div className="divide-y">
          {Object.entries(evaluation.detailed_feedback)
            .sort((a, b) => {
              // Sort by question number
              const aNum = parseInt(a[0].replace(/\D/g, ""));
              const bNum = parseInt(b[0].replace(/\D/g, ""));
              return aNum - bNum;
            })
            .map(([_, feedback], index) => (
              <DetailedFeedbackItem
                key={index}
                question={assessment.questions[index]}
                index={index}
                feedback={feedback}
              />
            ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3">
          Recommended Areas for Improvement
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {evaluation.performance === "Needs Improvement" && (
            <>
              <div className="border rounded-lg p-3">
                <h3 className="font-medium text-red-600 mb-2">Focus Areas</h3>
                <p className="text-sm text-gray-700">
                  Review the questions you answered incorrectly and focus on
                  understanding the concepts behind them.
                </p>
              </div>
              <div className="border rounded-lg p-3">
                <h3 className="font-medium text-red-600 mb-2">Study Tips</h3>
                <p className="text-sm text-gray-700">
                  Practice similar questions and review the related topics in
                  your study materials.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Modify your component to use Suspense
export default function EvaluatorDashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EvaluatorContent />
    </Suspense>
  );
}

// Move the main component logic to a new component
function EvaluatorContent() {
  const searchParams = useSearchParams();
  const assessment_id = searchParams.get("assessment_id") || "";
  const student_email = searchParams.get("student_email") || "";

  // Use query params to pre-populate state if available
  const [testData, setTestData] = useState({
    assessment_id,
    student_id: student_email,
    student_answers: {
      q1: "",
      q2: "",
    },
  });

  const [formData, setFormData] = useState({
    assessmentIds: [assessment_id || ""],
    student_id: student_email || "",
  });

  const [currentEvaluation, setCurrentEvaluation] = useState<any>(null);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessmentDetails, setAssessmentDetails] = useState<{
    questions: Question[];
    answers: any;
    assessment_type?: string;
    subject?: string;
    topic?: string;
  } | null>(null);

  const [showHistory, setShowHistory] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  async function fetchEvaluations() {
    const { data, error } = await supabase
      .from("evaluation_test")
      .select(
        `
        *,
        assessments (
          subject,
          topic,
          assessment_type
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching evaluations:", error);
      return;
    }

    setEvaluations(data || []);
    setLoading(false);
  }

  async function handleSubmitTest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/evaluate_test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Evaluation result:", result);

      fetchEvaluations();
    } catch (err: any) {
      setError(err.message);
      console.error("Submission error:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddAssessmentId = () => {
    setFormData((prev) => ({
      ...prev,
      assessmentIds: [...prev.assessmentIds, ""],
    }));
  };

  const handleRemoveAssessmentId = (index: number) => {
    if (formData.assessmentIds.length > 1) {
      setFormData((prev) => ({
        ...prev,
        assessmentIds: prev.assessmentIds.filter((_, i) => i !== index),
      }));
    }
  };

  const handleAssessmentIdChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newIds = [...prev.assessmentIds];
      newIds[index] = value;
      return { ...prev, assessmentIds: newIds };
    });
  };

  async function fetchAssessmentDetails() {
    setLoading(true);
    setError(null);

    try {
      const validIds = formData.assessmentIds.filter((id) => id.trim());
      if (validIds.length === 0) {
        throw new Error("Please enter at least one assessment ID");
      }

      const promises = validIds.map((id) =>
        supabase.from("assessments").select("*").eq("id", id).single()
      );

      const results = await Promise.all(promises);

      let combinedQuestions: Question[] = [];
      let combinedAnswers: any[] = [];
      let subjects: string[] = [];
      let topics: string[] = [];

      results.forEach((result, index) => {
        if (result.error) {
          throw new Error(
            `Error fetching assessment ${validIds[index]}: ${result.error.message}`
          );
        }
        if (!result.data) {
          throw new Error(`Assessment ${validIds[index]} not found`);
        }

        // Add assessment ID to each question for tracking
        const questionsWithId = result.data.questions.map((q: Question) => ({
          ...q,
          assessmentId: validIds[index],
        }));

        combinedQuestions = [...combinedQuestions, ...questionsWithId];
        combinedAnswers = [...combinedAnswers, ...result.data.answers];
        if (result.data.subject) subjects.push(result.data.subject);
        if (result.data.topic) topics.push(result.data.topic);
      });

      setAssessmentDetails({
        questions: combinedQuestions,
        answers: combinedAnswers,
        subject: subjects.join(", "),
        topic: topics.join(", "),
      });
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching assessments:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleEvaluate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!assessmentDetails?.questions) {
        throw new Error("No questions to evaluate");
      }

      const response = await fetch("/api/evaluate_test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment_id: formData.assessmentIds.join(","),
          student_id: formData.student_id,
          student_answers: assessmentDetails.answers,
          questions: assessmentDetails.questions,
        }),
      });

      if (!response.ok) throw new Error(`Error: ${response.statusText}`);

      const result = await response.json();

      setCurrentEvaluation({
        ...result,
        assessments: {
          subject: assessmentDetails.subject || "Multiple Assessments",
          topic: assessmentDetails.topic || "Combined Topics",
          questions: assessmentDetails.questions,
        },
      });

      await fetchEvaluations();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignToStudent(evaluationData: any) {
    if (!evaluationData || !formData.assessmentIds[0]) {
      setError("Missing assessment ID or evaluation data");
      return;
    }

    setAssignLoading(true);
    setError(null);

    try {
      // Get the student email from the form data
      const studentEmail = formData.student_id;

      if (!studentEmail) {
        throw new Error("Student email is required");
      }

      // Update the assigned_assessments table with the evaluation data
      const { data, error: updateError } = await supabase
        .from("assigned_assessments")
        .update({
          evaluation: evaluationData,
          score: evaluationData.score,
          completed: true,
        })
        .eq("assessment_id", parseInt(formData.assessmentIds[0]))
        .eq("student_email", studentEmail);

      if (updateError) {
        throw new Error(
          `Failed to update assigned assessment: ${updateError.message}`
        );
      }

      setAssignSuccess(true);
      setTimeout(() => {
        setAssignSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message);
      console.error("Assignment error:", err);
    } finally {
      setAssignLoading(false);
    }
  }

  function renderQuestionDetails() {
    if (!assessmentDetails) return null;

    return (
      <div className="mt-6 space-y-4">
        {!currentEvaluation ? (
          <>
            <h3 className="text-lg font-semibold">Assessment Details</h3>
            {assessmentDetails.questions.map((q: Question, index: number) => (
              <QuestionCard
                key={index}
                question={q}
                studentAnswer={assessmentDetails.answers[index]}
                index={index}
              />
            ))}

            <GradientButton
              onClick={handleEvaluate}
              isLoading={loading}
              disabled={loading}
            >
              {loading ? "Evaluating..." : "Evaluate Answers"}
            </GradientButton>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Evaluation Result</h3>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleAssignToStudent(currentEvaluation)}
                  disabled={assignLoading}
                  className="px-6 py-3 font-semibold text-white rounded-xl transition-all
                  bg-gradient-to-r from-blue-500 to-blue-600 
                  hover:from-blue-600 hover:to-blue-700 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 
                  disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {assignLoading ? "Assigning..." : "Assign to Student"}
                </button>
                <GradientButton
                  onClick={() => setCurrentEvaluation(null)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  Evaluate Another
                </GradientButton>
              </div>
            </div>
            {renderEvaluation(currentEvaluation)}

            {/* Success Message */}
            {assignSuccess && (
              <div className="mt-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded animate-fade-in">
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p>Evaluation successfully assigned to student!</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  function renderEvaluation(evaluation: any) {
    return (
      <EnhancedEvaluationView
        evaluation={evaluation}
        assessment={evaluation.assessments}
      />
    );
  }

  const handleViewHistory = () => {
    setShowHistory(true);
    setCurrentEvaluation(null);
  };

  const handleBackToEvaluation = () => {
    setShowHistory(false);
    setSelectedEvaluation(null);
    setCurrentEvaluation(null);
  };

  function renderMainContent() {
    if (showHistory) {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Evaluation History
            </h2>
            <GradientButton onClick={handleBackToEvaluation}>
              Back to Evaluation
            </GradientButton>
          </div>

          {selectedEvaluation ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Evaluation Details</h3>
                <button
                  onClick={() => setSelectedEvaluation(null)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  ← Back to History
                </button>
              </div>
              {renderEvaluation(selectedEvaluation)}
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Detailed Feedback:</h4>
                {Object.entries(selectedEvaluation.detailed_feedback || {}).map(
                  ([qId, feedback]) => (
                    <div key={qId} className="mb-2 p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Q{qId}:</span>{" "}
                      {String(feedback)}
                    </div>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {evaluations.map((evaluation) => (
                <HistoryCard
                  key={evaluation.id}
                  evaluation={evaluation}
                  onClick={() => setSelectedEvaluation(evaluation)}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Assessment Details
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="space-y-4 mb-6">
            {formData.assessmentIds.map((id, index) => (
              <div key={index} className="flex gap-4 items-center">
                <InputField
                  label={`Assessment ID ${index + 1}`}
                  type="number"
                  value={id}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleAssessmentIdChange(index, e.target.value)
                  }
                  required
                  placeholder="Enter Assessment ID"
                />
                {formData.assessmentIds.length > 1 && (
                  <button
                    onClick={() => handleRemoveAssessmentId(index)}
                    className="mt-8 p-2 text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={handleAddAssessmentId}
              className="text-blue-600 hover:text-blue-800 font-medium"
              type="button"
            >
              + Add Another Assessment
            </button>

            <InputField
              label="Student ID"
              type="text"
              value={formData.student_id}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({ ...prev, student_id: e.target.value }))
              }
              required
              placeholder="Enter Student ID"
            />
          </div>

          <GradientButton
            onClick={fetchAssessmentDetails}
            isLoading={loading}
            disabled={formData.assessmentIds.every((id) => !id)}
          >
            {loading ? "Fetching..." : "Fetch Assessments"}
          </GradientButton>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          {renderQuestionDetails()}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-backgroundApp min-h-screen">
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Evaluation Dashboard</h1>
        {renderMainContent()}
      </div>
    </div>
  );
}
