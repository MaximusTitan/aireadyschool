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
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

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

interface DocumentFile {
  id: string;
  grade: string;
  education_board: string;
  subject: string;
  file_url: string;
}

interface CreateLessonPlanProps {
  studentProps?: StudentProps;
}

interface FormData {
  board: string;
  classLevel: string;
  subject: string;
  topic: string;
  chapterTopic: string;
  classDuration: string;
  numberOfDays: string;
  learningObjectives: string;
  lessonObjectives: string;
  additionalInstructions: string;
}

// Add view type
type ViewType = "teacher" | "professional";

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
  const [viewType, setViewType] = useState<ViewType>("teacher");
  const [documentFiles, setDocumentFiles] = useState<DocumentFile[]>([]);
  const [isDocumentSelected, setIsDocumentSelected] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    board: studentProps?.board || "",
    classLevel: studentProps?.studentGrade || "",
    subject: studentProps?.subject || "",
    topic: "",
    chapterTopic: "",
    classDuration: "",
    numberOfDays: "",
    learningObjectives: learningOutcomes,
    lessonObjectives: lessonObjectives,
    additionalInstructions: additionalInstructions,
  });

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

  useEffect(() => {
    fetchUserAndData();
  }, []);

  const fetchUserAndData = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("User not authenticated");

      await Promise.all([
        fetchKnowledgeBaseDocs(),
      ]);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to fetch user data. Please try again or log in.");
    }
  };

  const fetchKnowledgeBaseDocs = async () => {
    try {
      const { data, error } = await supabase.from("knowledge_base").select("*");
      if (error) throw error;
      setDocumentFiles(data || []);
    } catch (error) {
      console.error("Error fetching knowledge_base docs:", error);
      toast.error("Failed to fetch documents. Please try again.");
    }
  };

  const handleDocumentSelect = (docId: string) => {
    const selectedDoc = documentFiles.find((doc) => doc.id === docId);
    if (selectedDoc) {
      setSelectedDocument(docId);
      setFormState((prev) => ({
        ...prev,
        board: selectedDoc.education_board,
        classLevel: selectedDoc.grade,
        subject: selectedDoc.subject,
        topic: selectedDoc.file_url,
      }));
      setIsDocumentSelected(true);
    }
  };

  const handleReset = () => {
    setSelectedDocument(null);
    setIsDocumentSelected(false);
    setFormState({
      board: studentProps?.board || "",
      classLevel: studentProps?.studentGrade || "",
      subject: studentProps?.subject || "",
      topic: "",
      chapterTopic: "",
      classDuration: "",
      numberOfDays: "",
      learningObjectives: "",
      lessonObjectives: "",
      additionalInstructions: "",
    });
  };

  // Add new state for file upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Add file upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      
      // Check file size (20MB = 20 * 1024 * 1024 bytes)
      if (file.size > 20 * 1024 * 1024) {
        toast.error('File size must be less than 20MB');
        return;
      }

      setUploadedFile(file);
    }
  };

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

      // Create request data based on view type
      if (viewType === "professional") {
        // For professional view, use FormData to handle file upload
        const formDataToSend = new FormData();
        
        // Append file if uploaded
        if (uploadedFile) {
          formDataToSend.append('document', uploadedFile);
        }

        // Append other form fields
        formDataToSend.append('chapterTopic', formState.chapterTopic);
        formDataToSend.append('classDuration', formState.classDuration);
        formDataToSend.append('numberOfDays', formState.numberOfDays);
        formDataToSend.append('learningObjectives', formState.learningObjectives);
        formDataToSend.append('lessonObjectives', formState.lessonObjectives);
        formDataToSend.append('additionalInstructions', formState.additionalInstructions || '');
        formDataToSend.append('userEmail', targetEmail);
        formDataToSend.append('studentId', studentProps?.studentId || '');
        formDataToSend.append('createdByTeacher', String(isForStudent));
        formDataToSend.append('assessmentId', studentProps?.assessmentId || '');

        const response = await fetch('/api/proLessonPlan', {
          method: 'POST',
          body: formDataToSend,
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
      } else {
        // Existing teacher view logic
        const requestData = {
          subject: viewType === "teacher" ? formState.subject : undefined,
          grade: viewType === "teacher" ? formState.classLevel : undefined,
          board: viewType === "teacher" ? formState.board : undefined,
          chapterTopic: formState.chapterTopic || formData.get("chapterTopic"),
          classDuration: formState.classDuration || formData.get("classDuration"),
          numberOfDays: formState.numberOfDays || formData.get("numberOfDays"),
          learningObjectives: formState.learningObjectives || formData.get("learningObjectives"),
          lessonObjectives: formState.lessonObjectives || formData.get("lessonObjectives"),
          additionalInstructions: formState.additionalInstructions || formData.get("additionalInstructions") || "",
          userEmail: targetEmail,
          studentId: studentProps?.studentId || null,
          createdByTeacher: isForStudent,
          assessmentId: studentProps?.assessmentId || null,
          selectedDocument: selectedDocument,
        };

        const apiEndpoint = selectedDocument ? "/api/ragLessonPlan" : "/api/generateLessonPlan";
        const response = await fetch(apiEndpoint, {
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
      }
    } catch (error) {
      console.error("Error generating lesson plan:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
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

        {/* Add view toggle */}
        <div className="flex items-center space-x-2 mb-6">
          <Label htmlFor="view-mode">{viewType === "teacher" ? "Teacher View" : "Professional View"}</Label>
          <Switch
            id="view-mode"
            checked={viewType === "professional"}
            onCheckedChange={(checked) =>
              setViewType(checked ? "professional" : "teacher")
            }
          />
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

              {/* Show subject, grade, and board fields only in teacher view */}
              {viewType === "teacher" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select
                      name="subject"
                      defaultValue={studentProps?.subject?.toLowerCase() || undefined}
                      required={viewType === "teacher"}
                      disabled={isDocumentSelected}
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
                      required={viewType === "teacher"}
                      disabled={isDocumentSelected}
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
                      required={viewType === "teacher"}
                      disabled={isDocumentSelected}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Board" />
                      </SelectTrigger>
                      <SelectContent>
                        {["CBSE", "ICSE", "State Board", "IB", "IGCSE", "Other"].map(
                          (board) => (
                            <SelectItem key={board} value={board}>
                              {board}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Document Selection */}
              {viewType === "teacher" ? (
                <div className="mb-4">
                  <Label htmlFor="document-select">Select Document (Optional)</Label>
                  <Select
                    value={selectedDocument || "_none"}
                    onValueChange={(value) => {
                      if (value === "_none") {
                        handleReset();
                      } else {
                        handleDocumentSelect(value);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a document" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">None (Input manually)</SelectItem>
                      {documentFiles.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.subject} - Grade {doc.grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="mb-4">
                  <Label htmlFor="document-upload">Upload Document (Optional)</Label>
                  <Input
                    id="document-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Maximum file size: 20MB. Accepted format: PDF only
                  </p>
                  {uploadedFile && (
                    <p className="text-sm text-green-600 mt-1">
                      File selected: {uploadedFile.name}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="chapterTopic">Lesson Title</Label>
                <Input
                  id="chapterTopic"
                  name="chapterTopic"
                  placeholder="Enter the title of your lesson"
                  value={formState.chapterTopic}
                  onChange={(e) => setFormState(prev => ({ ...prev, chapterTopic: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="classDuration">Session Duration (Minutes)</Label>
                  <Input
                    id="classDuration"
                    name="classDuration"
                    type="number"
                    min="1"
                    placeholder="Enter duration"
                    value={formState.classDuration}
                    onChange={(e) => setFormState(prev => ({ ...prev, classDuration: e.target.value }))}
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
                    value={formState.numberOfDays}
                    onChange={(e) => setFormState(prev => ({ ...prev, numberOfDays: e.target.value }))}
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
                  value={formState.lessonObjectives}
                  onChange={(e) => setFormState(prev => ({ ...prev, lessonObjectives: e.target.value }))}
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
                  value={formState.learningObjectives}
                  onChange={(e) => setFormState(prev => ({ ...prev, learningObjectives: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalInstructions">Additional Instructions</Label>
                <Textarea
                  id="additionalInstructions"
                  name="additionalInstructions"
                  placeholder="Any specific instructions or notes for this lesson plan?"
                  rows={3}
                  value={formState.additionalInstructions}
                  onChange={(e) => setFormState(prev => ({ ...prev, additionalInstructions: e.target.value }))}
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
