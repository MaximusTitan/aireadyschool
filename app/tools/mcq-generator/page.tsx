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
import CountrySelection from "./components/CountrySelection";
import BoardSelection from "./components/BoardSelection";
import LearningOutcomesInput from "./components/LearningOutcomesInput";
import { createClient } from "@/utils/supabase/client";
import { CountryKey } from "@/types/assessment";

const supabase = createClient();

interface FormData {
  country: CountryKey | "";
  board: string;
  classLevel: string;
  subject: string;
  topic: string;
  assessmentType: string;
  difficulty: string;
  questionCount: number;
  learningOutcomes: string[];
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    country: "",
    board: "",
    classLevel: "Grade 9",
    subject: "Math",
    topic: "",
    assessmentType: "mcq",
    difficulty: "Medium",
    questionCount: 10,
    learningOutcomes: [],
  });
  const [assessment, setAssessment] = useState<any[] | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Answer[]>([]);
  const [savedAssessments, setSavedAssessments] = useState<
    Array<{
      id: string;
      subject: string;
      topic: string;
      questions: any[];
      answers?: any[];
      country?: string;
      board?: string;
      class_level: string;
      assessment_type: string;
      difficulty: string;
      learning_outcomes?: string[];
    }>
  >([]);

  useEffect(() => {
    fetchSavedAssessments();
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
        body: JSON.stringify({
          ...formData,
          learningOutcomes: formData.learningOutcomes,
        }),
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
      setAssessmentId(data.id);
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

  interface Answer {
    questionIndex: number;
    selectedAnswer: string;
  }

  const handleAnswerSubmit = (answers: Answer[]): void => {
    setUserAnswers(answers);
    setShowResults(true);
  };

  interface Assessment {
    id: string;
    country?: string;
    board?: string;
    class_level: string;
    subject: string;
    topic: string;
    assessment_type: string;
    difficulty: string;
    questions: any[];
    answers?: any[];
    learning_outcomes?: string[];
  }

  interface AssessmentError {
    message: string;
  }

  const handleLoadAssessment = async (id: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .eq("id", id)
        .single<Assessment>();

      if (error) {
        throw error;
      }

      setAssessment(data.questions);
      setAssessmentId(data.id);
      setFormData({
        ...formData,
        country: (data.country as CountryKey) || "",
        board: data.board || "",
        classLevel: data.class_level,
        subject: data.subject,
        topic: data.topic,
        assessmentType: data.assessment_type,
        difficulty: data.difficulty,
        questionCount: data.questions.length,
        learningOutcomes: data.learning_outcomes || [],
      });
      setShowResults(false);
      setUserAnswers(data.answers || []);
    } catch (error: unknown) {
      const err = error as AssessmentError;
      console.error("Error loading assessment:", error);
      setError(`Failed to load assessment: ${err.message}`);
    }
  };

  interface AssessmentData {
    id: string;
    country?: string;
    board?: string;
    class_level: string;
    subject: string;
    topic: string;
    assessment_type: string;
    difficulty: string;
    questions: any[];
    answers?: any[];
    learning_outcomes?: string[];
  }

  interface AssessmentError {
    message: string;
  }

  const handleViewAnswers = async (id: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .eq("id", id)
        .single<AssessmentData>();

      if (error) {
        throw error;
      }

      setAssessment(data.questions);
      setAssessmentId(data.id);
      setFormData({
        country: (data.country as CountryKey) || "",
        board: data.board || "",
        classLevel: data.class_level,
        subject: data.subject,
        topic: data.topic,
        assessmentType: data.assessment_type,
        difficulty: data.difficulty,
        questionCount: data.questions.length,
        learningOutcomes: data.learning_outcomes || [],
      });
      setShowResults(true);
      setUserAnswers(data.answers || []);
    } catch (error: unknown) {
      const err = error as AssessmentError;
      console.error("Error loading assessment answers:", error);
      setError(`Failed to load assessment answers: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-grow bg-white">
        <div className="bg-white rounded-lg border p-6 md:p-8 max-w-5xl mx-auto">
          {!assessment ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                <CountrySelection
                  value={formData.country}
                  onChange={(value: CountryKey) =>
                    setFormData({ ...formData, country: value, board: "" })
                  }
                />
                <BoardSelection
                  value={formData.board}
                  onChange={(value) =>
                    setFormData({ ...formData, board: value })
                  }
                  country={formData.country}
                />
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
                <LearningOutcomesInput
                  value={formData.learningOutcomes}
                  onChange={(value) =>
                    setFormData({ ...formData, learningOutcomes: value })
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
                  className="bg-neutral-800 hover:bg-neutral-600 text-white"
                />
              </form>
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">
                  Saved Assessments
                </h2>
                {savedAssessments.length > 0 ? (
                  <ul className="space-y-2">
                    {savedAssessments.map((savedAssessment) => (
                      <li
                        key={savedAssessment.id}
                        className="flex justify-between items-center bg-gray-100 p-2 rounded"
                      >
                        <span>
                          {savedAssessment.subject} - {savedAssessment.topic}
                        </span>
                        <div>
                          <button
                            onClick={() =>
                              handleLoadAssessment(savedAssessment.id)
                            }
                            className="bg-neutral-500 hover:bg-neutral-600 text-white px-2 py-1 rounded mr-2"
                          >
                            Load
                          </button>
                          <button
                            onClick={() =>
                              handleViewAnswers(savedAssessment.id)
                            }
                            className="bg-purple-400 hover:bg-purple-300 text-white px-2 py-1 rounded"
                          >
                            View Answers
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
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
              assessmentId={assessmentId || ""} // Provide a default empty string
              topic={formData.topic} // Add this prop
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
