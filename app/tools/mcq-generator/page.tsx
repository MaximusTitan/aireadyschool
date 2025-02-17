"use client";

import { useState, useEffect } from "react";
import ClassSelection from "./components/ClassSelection";
import SubjectSelection from "./components/SubjectSelection";
import TopicInput from "./components/TopicInput";
import AssessmentTypeSelection from "./components/AssessmentTypeSelection";
import DifficultySelection from "./components/DifficultySelection";
import QuestionCount from "./components/QuestionCount";
import GenerateButton from "./components/GenerateButton";
import Assessment from "./components/Assessment";
import CountrySelection from "./components/CountrySelection";
import BoardSelection from "./components/BoardSelection";
import LearningOutcomesInput from "./components/LearningOutcomesInput";
import { createClient } from "@/utils/supabase/client";
import { CountryKey } from "@/types/assessment";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

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
      // Get the currently authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }
      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .eq("user_email", user.email) // filter assessments by user email
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

  const handleReset = () => {
    setAssessment(null);
    setAssessmentId(null);
    setShowResults(false);
    setUserAnswers([]);
    setError("");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
      <Link href="/tools">
        <Button variant="outline" className="mb-2 border-neutral-500">
          ← Back
        </Button>
      </Link>

      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold text-rose-500">
          Assessment Generator
        </h1>
        <p className="text-muted-foreground text-lg">
          Create interactive multiple-choice, descriptive, fill in the blanks
          questions for students to assess their understanding.
        </p>
      </div>

      <Card className="shadow-lg border-2">
        <CardContent className="p-6 space-y-8">
          {!assessment ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* First Row - Country and Board */}
              <div className="grid md:grid-cols-2 gap-8">
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
              </div>

              {/* Second Row - Class, Subject and Assessment Type */}
              <div className="grid md:grid-cols-3 gap-8">
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
                <AssessmentTypeSelection
                  value={formData.assessmentType}
                  onChange={(value) =>
                    setFormData({ ...formData, assessmentType: value })
                  }
                />
              </div>

              {/* Topic Input */}
              <TopicInput
                value={formData.topic}
                onChange={(value) => setFormData({ ...formData, topic: value })}
              />

              {/* Learning Outcomes */}
              <LearningOutcomesInput
                value={formData.learningOutcomes}
                onChange={(value) =>
                  setFormData({ ...formData, learningOutcomes: value })
                }
              />

              {/* Third Row - Difficulty and Question Count */}
              <div className="grid md:grid-cols-2 gap-8">
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
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-fit h-10 text-base font-semibold bg-rose-500 hover:bg-rose-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Assessment"
                )}
              </Button>
            </form>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-neutral-500"
                >
                  ← Back to Generator
                </Button>
              </div>
              <Assessment
                assessment={assessment}
                assessmentType={formData.assessmentType}
                onSubmit={handleAnswerSubmit}
                showResults={showResults}
                userAnswers={userAnswers}
                assessmentId={assessmentId || ""}
                topic={formData.topic}
              />
            </>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <p>{error}</p>
              <p className="mt-2 text-sm">
                Please check the browser console for more details.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saved Assessments Card */}
      {savedAssessments.length > 0 && (
        <Card className="shadow-lg border-2">
          <CardHeader className="bg-muted/50 border-b">
            <CardTitle className="text-2xl font-bold">
              Saved Assessments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedAssessments.map((savedAssessment) => (
                <div
                  key={savedAssessment.id}
                  className="p-4 rounded-lg border-2 hover:border-neutral-400 hover:bg-muted/50 transition-all"
                >
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold line-clamp-1">
                      {savedAssessment.topic}
                    </h3>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span>{savedAssessment.subject}</span>
                      <span>•</span>
                      <span>{savedAssessment.class_level}</span>
                      <span>•</span>
                      <span className="capitalize">
                        {savedAssessment.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => handleLoadAssessment(savedAssessment.id)}
                      variant="secondary"
                      size="sm"
                    >
                      Load
                    </Button>
                    <Button
                      onClick={() => handleViewAnswers(savedAssessment.id)}
                      variant="outline"
                      size="sm"
                      className="bg-rose-500 text-white hover:bg-rose-600"
                    >
                      Answers
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
