"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth"; // Import the existing auth hook

// Update StudentProps interface to include assessment details
interface StudentProps {
  studentId: string;
  studentName: string;
  studentGrade: string;
  studentEmail: string;
  subject?: string;
  title?: string;
  board?: string;
  assessmentId?: string; // Add assessmentId
}

interface CreateLessonPlanProps {
  studentProps?: StudentProps;
}

const subjects = [
  "Mathematics",
  "Science",
  "English",
  "History",
  "Geography",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Literature",
  "Art",
  "Music",
  "Physical Education",
];

const sections = ["A", "B", "C", "D", "E", "F"];

export default function CreateLessonPlan({
  studentProps,
}: CreateLessonPlanProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { email: userEmail, loading: isAuthChecking } = useAuth();
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [isLoadingAssessmentDetails, setIsLoadingAssessmentDetails] =
    useState(false);
  const [lessonObjectives, setLessonObjectives] = useState("");
  const [learningOutcomes, setLearningOutcomes] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");

  // Override userEmail with studentEmail when provided (for teacher creating plan for student)
  const targetEmail = studentProps?.studentEmail || userEmail;
  const isForStudent = !!studentProps?.studentId;
  const hasAssessmentId = !!studentProps?.assessmentId;

  // Check if we have assessment details to pre-populate the form
  const hasAssessmentDetails = !!(
    studentProps?.subject &&
    studentProps?.title &&
    studentProps?.board
  );

  // Add a function to fetch assessment evaluation data
  const fetchAssessmentEvaluation = async () => {
    if (!studentProps?.assessmentId || !studentProps?.studentId) {
      toast.error("Assessment ID or Student ID is missing");
      return;
    }

    setIsLoadingAssessmentDetails(true);

    try {
      const response = await fetch(
        `/api/assessmentEvaluation?assessmentId=${studentProps.assessmentId}&studentId=${studentProps.studentId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch assessment evaluation");
      }

      const data = await response.json();

      if (data) {
        // Populate the form fields with generated content
        if (data.lessonObjectives) {
          setLessonObjectives(data.lessonObjectives);
        }

        if (data.learningOutcomes) {
          setLearningOutcomes(data.learningOutcomes);
        }

        if (data.additionalInstructions) {
          setAdditionalInstructions(data.additionalInstructions);
        }

        toast.success("Assessment evaluation data loaded successfully");
      } else {
        toast.warning("No evaluation data found for this assessment");
      }
    } catch (error) {
      console.error("Error fetching assessment evaluation:", error);
      toast.error("Failed to fetch assessment evaluation data");
    } finally {
      setIsLoadingAssessmentDetails(false);
    }
  };

  // Modify auth check to skip if creating for a student
  useEffect(() => {
    if (isForStudent) return; // Skip auth check if creating for a student (teacher is already authenticated)

    if (!isAuthChecking && !userEmail && !redirectAttempted) {
      console.log("Auth state:", {
        userEmail,
        isAuthChecking,
        redirectAttempted,
      });

      setRedirectAttempted(true);

      const timer = setTimeout(() => {
        if (!userEmail) {
          console.log("No user found after delay, redirecting");
          toast.error("Please log in to create a lesson plan");
          router.push("/sign-in");
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [userEmail, isAuthChecking, redirectAttempted, router, isForStudent]);

  // Update loading state to consider student context
  if (!isForStudent && isAuthChecking) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!targetEmail) {
      toast.error("Email information is missing");
      return;
    }

    setIsLoading(true);

    try {
      // Get form data
      const formData = new FormData(event.currentTarget);

      // Create a proper request object to send to the API
      const requestData = {
        subject: formData.get("subject") as string,
        grade: formData.get("grade") as string,
        chapterTopic: formData.get("chapterTopic") as string,
        board: formData.get("board") as string,
        classDuration: formData.get("classDuration") as string,
        numberOfDays: formData.get("numberOfDays") as string,
        learningObjectives: formData.get("learningObjectives") as string,
        lessonObjectives: formData.get("lessonObjectives") as string,
        additionalInstructions:
          (formData.get("additionalInstructions") as string) || "",
        userEmail: targetEmail, // Use the target email (student or current user)
        studentId: studentProps?.studentId || null, // Include student ID when applicable
        createdByTeacher: isForStudent, // Flag to indicate if created by teacher
        assessmentId: studentProps?.assessmentId || null, // Include assessment ID when applicable
      };

      console.log("Sending request to generate lesson plan:", requestData);

      // Call the API route instead of using the imported function
      const response = await fetch("/api/generateLessonPlan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      // Handle response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate lesson plan");
      }

      // Parse the response to get the lesson plan data
      const lessonPlan = await response.json();

      if (!lessonPlan || !lessonPlan.plan_data) {
        throw new Error("Received empty or invalid lesson plan");
      }

      // Navigate to the output page with the lesson plan ID and assessment ID if it exists
      const queryParams = new URLSearchParams();
      queryParams.append("id", lessonPlan.id);

      if (studentProps?.assessmentId) {
        queryParams.append("assessmentId", studentProps.assessmentId);
      }

      router.push(`/tools/lesson-planner/output?${queryParams.toString()}`);
    } catch (error) {
      console.error("Error generating lesson plan:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(`Failed to generate lesson plan: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-backgroundApp">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => router.push("/tools/lesson-planner")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isForStudent
              ? `Create Lesson Plan for ${studentProps?.studentName}`
              : "Create Lesson Plan"}
          </h1>
          <p className="text-gray-600">
            Creates structured and optimized lesson plans for educators based on
            the subject, topic, grade, lesson objectives and duration provided.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student info banner when creating for a student */}
              {isForStudent && (
                <div className="bg-blue-50 p-4 rounded-md mb-4">
                  <p className="text-blue-700 font-medium">
                    Creating lesson plan for {studentProps?.studentName} (Grade{" "}
                    {studentProps?.studentGrade})
                  </p>
                  {hasAssessmentDetails && (
                    <p className="text-blue-600 mt-1">
                      Based on assessment: {studentProps?.subject} -{" "}
                      {studentProps?.title}
                    </p>
                  )}

                  {/* Add button to fetch assessment evaluation when assessmentId is available */}
                  {hasAssessmentId && (
                    <div className="mt-3">
                      <Button
                        type="button"
                        onClick={fetchAssessmentEvaluation}
                        disabled={isLoadingAssessmentDetails}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {isLoadingAssessmentDetails
                          ? "Generating content..."
                          : "Generate lesson content from assessment data"}
                      </Button>
                      <p className="text-xs text-blue-600 mt-1">
                        Click to auto-generate lesson objectives and learning
                        outcomes from assessment evaluation
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    name="subject"
                    defaultValue={
                      studentProps?.subject?.toLowerCase() || undefined
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject} value={subject.toLowerCase()}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Select
                    name="grade"
                    defaultValue={studentProps?.studentGrade || undefined}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          Grade {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="board">Board</Label>
                  <Select
                    name="board"
                    defaultValue={studentProps?.board || undefined}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Board" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "CBSE",
                        "ICSE",
                        "State Board",
                        "IB",
                        "IGCSE",
                        "Other",
                      ].map((board) => (
                        <SelectItem key={board} value={board}>
                          {board}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chapterTopic">Lesson Title</Label>
                <Input
                  id="chapterTopic"
                  name="chapterTopic"
                  placeholder="Enter the title of your lesson"
                  defaultValue={studentProps?.title || ""}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="classDuration">
                    Session Duration (Minutes)
                  </Label>
                  <Input
                    id="classDuration"
                    name="classDuration"
                    type="number"
                    min="1"
                    placeholder="Enter duration"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfDays">Number of Sessions</Label>
                  <Input
                    id="numberOfDays"
                    name="numberOfDays"
                    type="number"
                    min="1"
                    max="20"
                    placeholder="Enter number of sessions"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lessonObjectives">Lesson Objectives</Label>
                <Textarea
                  id="lessonObjectives"
                  name="lessonObjectives"
                  placeholder="What are the main objectives of this lesson?"
                  rows={3}
                  required
                  value={lessonObjectives}
                  onChange={(e) => setLessonObjectives(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="learningObjectives">Learning Outcomes</Label>
                <Textarea
                  id="learningObjectives"
                  name="learningObjectives"
                  placeholder="What should students be able to do after this lesson?"
                  rows={3}
                  required
                  value={learningOutcomes}
                  onChange={(e) => setLearningOutcomes(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalInstructions">
                  Additional Instructions
                </Label>
                <Textarea
                  id="additionalInstructions"
                  name="additionalInstructions"
                  placeholder="Any specific instructions or notes for this lesson plan?"
                  rows={3}
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                />
              </div>

              <div className="flex justify-center mt-6">
                <Button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white px-10"
                  disabled={isLoading}
                >
                  {isLoading ? "Generating..." : "Generate Lesson Plan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
