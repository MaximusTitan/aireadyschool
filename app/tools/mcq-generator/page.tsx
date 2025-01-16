"use client";

import { useState, useEffect } from "react";
import Header from "./components/Header";
import ClassSelection from "./components/ClassSelection";
import SubjectSelection from "./components/SubjectSelection";
import TopicInput from "./components/TopicInput";
import AssessmentTypeSelection from "./components/AssessmentTypeSelection";
import DifficultySelection from "./components/DifficultySelection";
import QuestionCount from "./components/QuestionCount";
import GenerateButton from "./components/GenerateButton";
import Assessment from "./components/Assessment";
import Footer from "./components/Footer";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link"; // Added import

const supabase = createClient();

export default function Home() {
  const [formData, setFormData] = useState({
    classLevel: "Class 8",
    subject: "Math",
    topic: "",
    assessmentType: "mcq",
    difficulty: "Medium",
    questionCount: 5,
  });
  const [assessment, setAssessment] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [savedAssessments, setSavedAssessments] = useState<
    Array<{ id: string; subject: string; topic: string }>
  >([]);

  useEffect(() => {
    fetchSavedAssessments();
  }, []);

  useEffect(() => {
    const testDatabaseConnection = async () => {
      try {
        const { data, error } = await supabase
          .from("assessments")
          .select("id")
          .limit(1);

        if (error) {
          throw error;
        }

        console.log("Successfully connected to the assessments table:", data);
      } catch (error) {
        console.error("Error connecting to the assessments table:", error);
      }
    };

    testDatabaseConnection();
  }, []);

  const fetchSavedAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setSavedAssessments(data || []);
    } catch (error) {
      console.error("Error fetching saved assessments:", error);
      setError("Failed to fetch saved assessments. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setAssessment(null);
    setShowResults(false);
    setUserAnswers([]);

    try {
      console.log("Submitting form data:", formData);

      const response = await fetch("/api/generate-assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      console.log("Response status:", response.status);

      const data = await response.json();

      console.log("Response data:", data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (!data.assessment || !Array.isArray(data.assessment)) {
        throw new Error("Invalid assessment data received");
      }

      setAssessment(data.assessment);
      fetchSavedAssessments(); // Refresh the list of saved assessments
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setError(
        `An error occurred: ${error instanceof Error ? error.message : "Unknown error"}. Please check the console for more details and try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  interface UserAnswer {
    questionIndex: number;
    selectedAnswer: string;
  }

  const handleAnswerSubmit = (answers: UserAnswer[]): void => {
    setUserAnswers(answers);
    setShowResults(true);
  };

  interface SavedAssessment {
    id: string;
    class_level: string;
    subject: string;
    topic: string;
    assessment_type: string;
    difficulty: string;
    questions: any[]; // Type can be more specific based on your question structure
  }

  const handleLoadAssessment = async (id: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .eq("id", id)
        .single<SavedAssessment>();

      if (error) {
        throw error;
      }

      setAssessment(data.questions);
      setFormData({
        classLevel: data.class_level,
        subject: data.subject,
        topic: data.topic,
        assessmentType: data.assessment_type,
        difficulty: data.difficulty,
        questionCount: data.questions.length,
      });
      setShowResults(false);
      setUserAnswers([]);
    } catch (error: any) {
      console.error("Error loading assessment:", error);
      setError(`Failed to load assessment: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex flex-col justify-between">
      <Link
        href="/tools/"
        className="absolute top-4 left-4 text-blue-500 hover:text-blue-700"
      >
        ← Back
      </Link>
      <Header />
      <main className="container mx-auto px-4 py-8 flex-grow bg-white">
        <div className="bg-white rounded-lg border border-neutral-200 p-6 md:p-8 max-w-6xl mx-auto">
          {!assessment ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                <ClassSelection
                  value={formData.classLevel}
                  onChange={(value) =>
                    setFormData({ ...formData, classLevel: value })
                  }
                />
                <SubjectSelection
                  value={formData.subject}
                  onChange={(value) =>
                    setFormData({ ...formData, subject: value })
                  }
                />
                <TopicInput
                  value={formData.topic}
                  onChange={(value) =>
                    setFormData({ ...formData, topic: value })
                  }
                />
                <AssessmentTypeSelection
                  value={formData.assessmentType}
                  onChange={(value) =>
                    setFormData({ ...formData, assessmentType: value })
                  }
                />
                <DifficultySelection
                  value={formData.difficulty}
                  onChange={(value) =>
                    setFormData({ ...formData, difficulty: value })
                  }
                />
                <QuestionCount
                  value={formData.questionCount}
                  onChange={(value) =>
                    setFormData({ ...formData, questionCount: value })
                  }
                />
                <GenerateButton
                  isLoading={isLoading}
                  className="bg-rose-500 hover:bg-rose-600 text-white"
                />
              </form>
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">
                  Saved Assessments
                </h2>
                {savedAssessments.length > 0 ? (
                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                    {savedAssessments.map((savedAssessment) => (
                      <div
                        key={savedAssessment.id}
                        className="flex justify-between items-center bg-white border border-neutral-200 p-2 rounded"
                      >
                        <span>
                          {savedAssessment.subject} - {savedAssessment.topic}
                        </span>
                        <button
                          onClick={() =>
                            handleLoadAssessment(savedAssessment.id)
                          }
                          className="bg-white border border-rose-400 hover:bg-rose-500 hover:text-white px-2 py-1 rounded"
                        >
                          Load
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No saved assessments found.</p>
                )}
              </div>
            </>
          ) : (
            <Assessment
              assessment={assessment}
              assessmentType={formData.assessmentType}
              onSubmit={handleAnswerSubmit}
              showResults={showResults}
              userAnswers={userAnswers}
            />
          )}
          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <p>{error}</p>
              <p className="mt-2 text-sm">
                Please check the browser console for more details.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
