"use client";

import type React from "react";
import { useState, useEffect } from "react";
import ClassSelection from "./components/inputs/ClassSelection";
import SubjectSelection from "./components/inputs/SubjectSelection";
import TopicInput from "./components/inputs/TopicInput";
import AssessmentTypeSelection from "./components/inputs/AssessmentTypeSelection";
import DifficultySelection from "./components/inputs/DifficultySelection";
import QuestionCount from "./components/inputs/QuestionCount";
import Assessment from "./components/assessment/Assessment";
import BoardSelection from "./components/inputs/BoardSelection";
import LearningOutcomesInput from "./components/inputs/LearningOutcomesInput";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SavedAssessments from "./components/savedAssessments";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

const supabase = createClient();

interface FormData {
  board: string;
  classLevel: string;
  subject: string;
  topic: string;
  assessmentType: string;
  difficulty: string;
  questionCount: number;
  learningOutcomes: string[];
  selectedDocument?: string | null;
}

// Updated DocumentFile interface: removed country property.
interface DocumentFile {
  id: string;
  grade: string;
  education_board: string;
  subject: string;
  file_url: string; //topic of a selectedDoc is just the file_url
}

interface Assignment {
  grade_id: string;
  section_id: string;
  grade_name: string;
  section_name: string;
}

interface Student {
  id: string;
  email: string;
  grade_id: string;
  section_id: string;
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    board: "",
    classLevel: "Grade 9",
    subject: "Math",
    topic: "",
    assessmentType: "mcq",
    difficulty: "Medium",
    questionCount: 10,
    learningOutcomes: [],
    selectedDocument: null,
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
      board?: string;
      class_level: string;
      assessment_type: string;
      difficulty: string;
      learning_outcomes?: string[];
      created_at: string;
    }>
  >([]);
  const [documentFiles, setDocumentFiles] = useState<DocumentFile[]>([]);
  const [isDocumentSelected, setIsDocumentSelected] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [assignmentType, setAssignmentType] = useState<"class" | "student">(
    "class"
  );
  const [teacherId, setTeacherId] = useState<string>("");

  // --- Handlers for updating form fields ---
  const handleBoardChange = (value: string) =>
    setFormData((prev) => ({ ...prev, board: value }));
  const handleGradeChange = (value: string) =>
    setFormData((prev) => ({ ...prev, classLevel: value }));
  const handleSubjectChange = (value: string) =>
    setFormData((prev) => ({ ...prev, subject: value }));

  // When the user selects a document, update formData accordingly.
  const handleDocumentSelect = (docId: string) => {
    const selectedDoc = documentFiles.find((doc) => doc.id === docId);
    if (selectedDoc) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        board: selectedDoc.education_board,
        classLevel: selectedDoc.grade,
        subject: selectedDoc.subject,
        topic: selectedDoc.file_url, //topic of a selectedDoc is just the file_url
        selectedDocument: docId,
      }));
      setIsDocumentSelected(true);
      console.log("Updated form data:", {
        board: selectedDoc.education_board,
        classLevel: selectedDoc.grade,
        subject: selectedDoc.subject,
        topic: selectedDoc.file_url, //topic of a selectedDoc is just the file_url
        selectedDocument: docId,
      });
    }
  };

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

      // Fetch teacher ID
      const { data: teacherData } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (teacherData) {
        setTeacherId(teacherData.id);
      }

      await Promise.all([
        fetchSavedAssessments(user.email || ""),
        fetchKnowledgeBaseDocs(),
      ]);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to fetch user data. Please try again or log in.");
    }
  };

  const fetchSavedAssessments = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .eq("user_email", email)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSavedAssessments(data || []);
    } catch (error) {
      console.error("Error fetching saved assessments:", error);
      setError("Failed to fetch saved assessments. Please try again.");
    }
  };

  const fetchKnowledgeBaseDocs = async () => {
    try {
      const { data, error } = await supabase.from("knowledge_base").select("*");
      if (error) throw error;
      setDocumentFiles(data || []);
    } catch (error) {
      console.error("Error fetching knowledge_base docs:", error);
      setError("Failed to fetch documents. Please try again.");
    }
  };

  const fetchTeacherAssignments = async (teacherId: string) => {
    try {
      const { data: assignmentData } = await supabase
        .from("teacher_assignments")
        .select(
          `
          grade_id,
          section_id,
          grades (name),
          sections (name)
        `
        )
        .eq("teacher_id", teacherId);

      if (assignmentData) {
        const unique = Array.from(
          new Map(
            (assignmentData as any[]).map((item) => [
              `${item.grade_id}-${item.section_id}`,
              {
                grade_id: item.grade_id,
                section_id: item.section_id,
                grade_name: item.grades?.name,
                section_name: item.sections?.name,
              },
            ])
          ).values()
        );
        setAssignments(unique);

        // Fetch students
        const { data: studentData } = await supabase.from("school_students")
          .select(`
            id,
            user_id,
            grade_id,
            section_id
          `);

        if (studentData) {
          const studentsWithEmail = await Promise.all(
            studentData
              .filter((stu: any) =>
                unique.some(
                  (a) =>
                    a.grade_id === stu.grade_id &&
                    a.section_id === stu.section_id
                )
              )
              .map(async (stu: any) => {
                const { data: userData } = await supabase
                  .from("users")
                  .select("email")
                  .eq("user_id", stu.user_id)
                  .single();
                return {
                  id: stu.id,
                  email: userData?.email || "No email",
                  grade_id: stu.grade_id,
                  section_id: stu.section_id,
                };
              })
          );
          setStudents(studentsWithEmail);
        }
      }
    } catch (error) {
      console.error("Error fetching teacher assignments:", error);
    }
  };

  // Submission handler: if a document is selected, override the payload with its values.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setAssessment(null);
    setShowResults(false);
    setUserAnswers([]);

    try {
      let submissionData: any = { ...formData };
      let apiRoute = "/api/generate-assessment";

      if (formData.selectedDocument) {
        apiRoute = "/api/rag-assessment";
        const selectedDoc = documentFiles.find(
          (doc) => doc.id === formData.selectedDocument
        );
        if (selectedDoc && selectedDoc.file_url) {
          submissionData.topic = selectedDoc.file_url;
          submissionData.board = selectedDoc.education_board;
          submissionData.subject = selectedDoc.subject;
        } else {
          setError("Selected document not found or missing file URL.");
          setIsLoading(false);
          return;
        }
      }

      // Add model to submissionData after determining the route
      submissionData.model =
        formData.board === "CAIE" ? "claude-3-7-sonnet-20250219" : "gpt-4o";
      console.log("Selected model:", submissionData.model);
      console.log("Using API route:", apiRoute);
      console.log("Submission data:", submissionData);

      const response = await fetch(apiRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
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

      // Refresh saved assessments
      const user = await supabase.auth.getUser();
      if (user.data.user?.email) {
        fetchSavedAssessments(user.data.user.email);
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setError(
        `An error occurred: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please check the console for more details and try again.`
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

      // Scroll to the top of the page
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: unknown) {
      const err = error as AssessmentError;
      console.error("Error loading assessment:", error);
      setError(`Failed to load assessment: ${err.message}`);
    }
  };

  const handleViewAnswers = async (id: string): Promise<void> => {
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

  // Update helper to return the inserted student assessment row
  const insertStudentAssessment = async (studentEmail: string) => {
    const newAssessmentData = {
      class_level: formData.classLevel,
      subject: formData.subject,
      topic: formData.topic,
      assessment_type: formData.assessmentType,
      difficulty: formData.difficulty,
      questions: assessment, // using current assessment state (array)
      board: formData.board,
      learning_outcomes: formData.learningOutcomes,
      user_email: studentEmail,
    };
    const { data: insertedData, error: newAssessError } = await supabase
      .from("assessments")
      .insert(newAssessmentData)
      .select();
    if (newAssessError) throw newAssessError;
    return insertedData[0]; // return the inserted student assessment row
  };

  const handleAssignAssessment = async () => {
    if (!assessmentId || !dueDate) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: teacherData } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!teacherData) throw new Error("Teacher not found");

      if (assignmentType === "class") {
        const assignmentObj = JSON.parse(selectedClass);
        const filteredStudents = students.filter(
          (student) =>
            student.grade_id === assignmentObj.grade_id &&
            student.section_id === assignmentObj.section_id
        );
        if (filteredStudents.length === 0) {
          alert("No students found for the selected class.");
          return;
        }
        // For each student, create a new assessment copy and assign it
        const inserts = filteredStudents.map(async (student) => {
          const insertedAssessment = await insertStudentAssessment(
            student.email
          );
          const { error } = await supabase.from("assigned_assessments").insert({
            assessment_id: insertedAssessment.id, // use student's assessment id
            teacher_id: teacherData.id,
            due_date: dueDate.toISOString(),
            grade_id: assignmentObj.grade_id,
            section_id: assignmentObj.section_id,
            student_id: student.id,
          });
          if (error) throw error;
        });
        await Promise.all(inserts);
        alert("Assessment assigned to entire class successfully!");
      } else {
        const insertedAssessment = await insertStudentAssessment(
          students.find((stu) => stu.id === selectedStudent)?.email || ""
        );
        const assignmentData = {
          assessment_id: insertedAssessment.id, // use student's assessment id
          teacher_id: teacherData.id,
          due_date: dueDate.toISOString(),
          grade_id: selectedGrade,
          section_id: selectedSection,
          student_id: selectedStudent,
        };
        const { error } = await supabase
          .from("assigned_assessments")
          .insert(assignmentData);
        if (error) throw error;
        alert("Assessment assigned to the student successfully!");
      }
      // Refresh user data so that saved assessments update in the UI
      await fetchUserAndData();
    } catch (error) {
      console.error("Error assigning assessment:", error);
      alert("Failed to assign assessment. Please try again.");
    }
  };

  const handleReset = () => {
    setAssessment(null);
    setAssessmentId(null);
    setShowResults(false);
    setUserAnswers([]);
    setError("");
    setIsDocumentSelected(false);
    setFormData({
      board: "",
      classLevel: "",
      subject: "",
      topic: "",
      assessmentType: formData.assessmentType,
      difficulty: formData.difficulty,
      questionCount: formData.questionCount,
      learningOutcomes: formData.learningOutcomes,
      selectedDocument: null,
    });
  };

  return (
    <div className="bg-backgroundApp min-h-screen">
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
                {/* Document Selection */}
                <div className="mb-4">
                  <Select
                    value={formData.selectedDocument || "_none"}
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
                      <SelectItem value="_none">
                        None (Input manually)
                      </SelectItem>
                      {documentFiles.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.subject} - Grade {doc.grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* OR Separator */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 text-neutral-500 bg-white font-medium">
                      OR
                    </span>
                  </div>
                </div>

                {/* Manual Input Section */}
                <div className="mt-8 space-y-4">
                  <h3 className="text-lg font-semibold mb-4">
                    Option 2: Fill details
                  </h3>
                  {isDocumentSelected ? (
                    <>
                      <div className="grid md:grid-cols-1 gap-8">
                        <BoardSelection
                          value={formData.board}
                          onChange={handleBoardChange}
                          disabled
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Selected Board: {formData.board}
                        </p>
                      </div>
                      <div className="grid md:grid-cols-2 gap-8">
                        <ClassSelection
                          value={formData.classLevel}
                          onChange={handleGradeChange}
                          disabled
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Selected Grade: {formData.classLevel}
                        </p>
                        <SubjectSelection
                          value={formData.subject}
                          onChange={handleSubjectChange}
                          disabled
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Selected Subject: {formData.subject}
                        </p>
                      </div>
                      <div>
                        <AssessmentTypeSelection
                          value={formData.assessmentType}
                          onChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              assessmentType: value,
                            }))
                          }
                        />
                      </div>
                    </>
                  ) : (
                    // Otherwise, allow manual selection.
                    <>
                      <div className="grid md:grid-cols-1 gap-8">
                        <BoardSelection
                          value={formData.board}
                          onChange={(value) =>
                            setFormData({ ...formData, board: value })
                          }
                        />
                      </div>
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
                    </>
                  )}

                  {/* Topic Input */}
                  <TopicInput
                    value={formData.topic}
                    onChange={(value) =>
                      setFormData({ ...formData, topic: value })
                    }
                    disabled={isDocumentSelected}
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
                </div>

                {/* Generate Button */}
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

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="default"
                        className="bg-rose-500 hover:bg-rose-600"
                        onClick={() => {
                          if (teacherId) {
                            fetchTeacherAssignments(teacherId);
                          } else {
                            alert("Teacher ID not found. Please try again.");
                          }
                        }}
                      >
                        Assign Assessment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Assign Assessment</DialogTitle>
                      </DialogHeader>

                      <Tabs
                        value={assignmentType}
                        onValueChange={(val) =>
                          setAssignmentType(val as "class" | "student")
                        }
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="class">Entire Class</TabsTrigger>
                          <TabsTrigger value="student">
                            Single Student
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="class" className="space-y-4">
                          <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full p-2 border rounded"
                          >
                            <option value="">Select Class</option>
                            {assignments.map((assignment) => (
                              <option
                                key={`${assignment.grade_id}-${assignment.section_id}`}
                                value={JSON.stringify(assignment)}
                              >
                                {assignment.grade_name} -{" "}
                                {assignment.section_name}
                              </option>
                            ))}
                          </select>
                        </TabsContent>

                        <TabsContent value="student" className="space-y-4">
                          <select
                            value={selectedGrade}
                            onChange={(e) => {
                              setSelectedGrade(e.target.value);
                              setSelectedSection("");
                              setSelectedStudent("");
                            }}
                            className="w-full p-2 border rounded"
                          >
                            <option value="">Select Grade</option>
                            {Array.from(
                              new Map(
                                assignments.map((a) => [
                                  a.grade_id,
                                  {
                                    grade_id: a.grade_id,
                                    grade_name: a.grade_name,
                                  },
                                ])
                              ).values()
                            ).map((item) => (
                              <option key={item.grade_id} value={item.grade_id}>
                                {item.grade_name}
                              </option>
                            ))}
                          </select>

                          {selectedGrade && (
                            <select
                              value={selectedSection}
                              onChange={(e) => {
                                setSelectedSection(e.target.value);
                                setSelectedStudent("");
                              }}
                              className="w-full p-2 border rounded"
                            >
                              <option value="">Select Section</option>
                              {assignments
                                .filter((a) => a.grade_id === selectedGrade)
                                .map((a) => (
                                  <option
                                    key={a.section_id}
                                    value={a.section_id}
                                  >
                                    {a.section_name}
                                  </option>
                                ))}
                            </select>
                          )}

                          {selectedGrade && selectedSection && (
                            <select
                              value={selectedStudent}
                              onChange={(e) =>
                                setSelectedStudent(e.target.value)
                              }
                              className="w-full p-2 border rounded"
                            >
                              <option value="">Select Student</option>
                              {students.map((student) => (
                                <option key={student.id} value={student.id}>
                                  {student.email}
                                </option>
                              ))}
                            </select>
                          )}
                        </TabsContent>
                      </Tabs>

                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-2">
                          Due Date
                        </label>
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={setDueDate}
                          className="rounded-md border"
                          disabled={(date) => date < new Date()}
                        />
                      </div>

                      <Button
                        onClick={handleAssignAssessment}
                        className="w-full mt-4"
                        disabled={
                          !dueDate ||
                          (assignmentType === "class"
                            ? !selectedClass
                            : !selectedStudent)
                        }
                      >
                        Assign
                      </Button>
                    </DialogContent>
                  </Dialog>
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
          <SavedAssessments
            savedAssessments={savedAssessments}
            handleLoadAssessment={handleLoadAssessment}
            handleViewAnswers={handleViewAnswers}
          />
        )}
      </div>
    </div>
  );
}
