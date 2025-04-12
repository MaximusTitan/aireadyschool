"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, Info, Edit, Download } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import Markdown from "react-markdown"
import { jsPDF } from "jspdf"
import { createClient } from "@/utils/supabase/client"
// Import marked for Markdown to HTML conversion.
import { marked } from "marked"

interface Evaluation {
  contentUnderstanding: { score: number; comment: string }
  criticalThinking: { score: number; comment: string }
  structureAndOrganization: { score: number; comment: string }
  languageAndCommunication: { score: number; comment: string }
  researchAndCitation: { score: number; comment: string }
  totalScore: number
  strengths: string
  areasForImprovement: string
  overallComment: string
}

const isValidEvaluation = (data: any): data is Evaluation => {
  return data && typeof data === "object" && "contentUnderstanding" in data && "totalScore" in data
}

export function AssessmentEvaluator() {
  // General states
  const [file, setFile] = useState<File | null>(null)
  const [evaluation, setEvaluation] = useState<Evaluation | string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [answerSheetText, setAnswerSheetText] = useState("")
  const [questionPaperText, setQuestionPaperText] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [inputMethod, setInputMethod] = useState<"file" | "text" | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedEvaluation, setEditedEvaluation] = useState<Evaluation | null>(null)
  const [fileUrl, setfileUrl] = useState("")
  const [extractedText, setExtractedText] = useState("")
  const [isExtractingText, setIsExtractingText] = useState(false)
  // New state for evaluating loading status
  const [isEvaluating, setIsEvaluating] = useState(false)

  // Teacher-related states
  const [teacherGrade, setTeacherGrade] = useState<string | null>(null)
  const [teacherSection, setTeacherSection] = useState<string | null>(null)
  const [teacherGradeId, setTeacherGradeId] = useState<string | null>(null)
  const [teacherSectionId, setTeacherSectionId] = useState<string | null>(null)
  const [isTeacher, setIsTeacher] = useState<boolean>(false)

  // Students state from school_students with email info.
  const [students, setStudents] = useState<Array<{ user_id: string; email: string }>>([])

  // New state to store uploaded answer sheet details per student.
  // Each key is a student id; the value includes the file URL, extracted text, and evaluation result (as string).
  const [studentUploads, setStudentUploads] = useState<
    Record<string, { fileUrl: string; extractedText: string; evaluation?: string }>
  >({})

  // -------------------------------
  // Function to open a new window and display the evaluation result.
  const openEvaluationPage = (evaluationText: string) => {
    // Convert Markdown to HTML.
    const htmlContent = marked(evaluationText);
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Evaluation Result</title>
            <style>
              body { font-family: sans-serif; margin: 20px; }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  // -------------------------------
  // Fetch teacher assignments for current user.
  useEffect(() => {
    const fetchTeacherData = async () => {
      const supabase = createClient();
      // 1. Get current user.
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error("Auth error:", authError.message);
        return;
      }
      if (!user) {
        console.log("No authenticated user found");
        return;
      }
      console.log("Current User ID:", user.id);
      // 2. Fetch teacher id from "teachers" table.
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (teacherError) {
        console.error("Error fetching teacher id:", teacherError.message);
        return;
      }
      if (!teacherData?.id) {
        console.log("Teacher id not found");
        return;
      }
      // Mark as teacher.
      setIsTeacher(true);
      const teacherId = teacherData.id;
      // 3. From teacher_assignments, get grade_id and section_id.
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("teacher_assignments")
        .select("grade_id, section_id")
        .eq("teacher_id", teacherId)
        .single();
      if (assignmentError) {
        console.error("Error fetching teacher assignments:", assignmentError.message);
        return;
      }
      if (!assignmentData) {
        console.log("No assignment data found for this teacher");
        return;
      }
      if (assignmentData.grade_id) {
        setTeacherGradeId(assignmentData.grade_id);
      }
      if (assignmentData.section_id) {
        setTeacherSectionId(assignmentData.section_id);
      }
      // 4. Fetch grade's name.
      if (assignmentData.grade_id) {
        const { data: gradeData, error: gradeError } = await supabase
          .from("grades")
          .select("name")
          .eq("id", assignmentData.grade_id)
          .single();
        if (gradeError) {
          console.error("Error fetching grade name:", gradeError.message);
        } else if (gradeData?.name) {
          setTeacherGrade(gradeData.name);
        }
      }
      // 5. Fetch section's name.
      if (assignmentData.section_id) {
        const { data: sectionData, error: sectionError } = await supabase
          .from("sections")
          .select("name")
          .eq("id", assignmentData.section_id)
          .single();
        if (sectionError) {
          console.error("Error fetching section name:", sectionError.message);
        } else if (sectionData?.name) {
          setTeacherSection(sectionData.name);
        }
      }
    };
    fetchTeacherData();
  }, []);

  // -------------------------------
  // Fetch student data from school_students.
  useEffect(() => {
    const fetchStudents = async () => {
      if (!teacherGradeId || !teacherSectionId) return;
      const supabase = createClient();
      const { data: studentData, error: studentError } = await supabase
        .from("school_students")
        .select("user_id")
        .eq("grade_id", teacherGradeId)
        .eq("section_id", teacherSectionId);
      if (studentError) {
        console.error("Error fetching students:", studentError.message);
        return;
      }
      if (!studentData || studentData.length === 0) {
        setStudents([]);
        return;
      }
      const userIds = studentData.map((student) => student.user_id);
      console.log("User IDs to lookup:", userIds);
      const { data: usersData, error: usersError } = await supabase
        .from("user_emails")
        .select("user_id, email")
        .in("user_id", userIds);
      if (usersError) {
        console.error("Error fetching user emails:", usersError.message);
        return;
      }
      console.log("User emails fetched:", usersData);
      const emailMap = usersData.reduce((acc, user) => {
        acc[user.user_id] = user.email;
        return acc;
      }, {} as Record<string, string>);
      const studentEmails = studentData.map((student) => ({
        user_id: student.user_id,
        email: emailMap[student.user_id] || "N/A",
      }));
      setStudents(studentEmails);
    };
    fetchStudents();
  }, [teacherGradeId, teacherSectionId]);

  // -------------------------------
  // Common file-upload function.
  const handleFileUpload = async (file: File) => {
    try {
      setIsExtractingText(true);
      const formData = new FormData();
      formData.append("file", file);
      // Upload the file to get a URL.
      const response = await fetch("/api/assessment-evaluator/fileurl", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to extract text from PDF");
      const data = await response.json();
      console.log("File URL: ", data.fileUrl);
      // Pass URL to OCR backend.
      const ocrResponse = await fetch("/api/assessment-evaluator/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: data.fileUrl }),
      });
      if (!ocrResponse.ok) throw new Error("Failed to extract text from OCR");
      const ocrData = await ocrResponse.json();
      console.log("Extracted Text: ", ocrData.extractedText);
      return { fileUrl: data.fileUrl, extractedText: ocrData.extractedText };
    } catch (error) {
      console.error("Error during file upload:", error);
      throw error;
    } finally {
      setIsExtractingText(false);
    }
  };

  // -------------------------------
  // For teacher view: when a teacher clicks the upload button for a student.
  const handleTeacherUploadChange = async (studentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        // 1. Upload the student's answer sheet file.
        const uploadResult = await handleFileUpload(e.target.files[0]);
        console.log("Upload result for student", studentId, uploadResult);

        // 2. Save upload result for that student.
        setStudentUploads((prev) => ({
          ...prev,
          [studentId]: { ...uploadResult },
        }));

        // 3. Ensure the Question Paper has been uploaded.
        if (!questionPaperText) {
          console.warn("Please upload the Question Paper first.");
          return;
        }

        // 4. Build FormData for evaluation using common question paper text and the student's answer sheet text.
        const formData = new FormData();
        formData.append("questionPaperText", questionPaperText);
        formData.append("answerSheetText", uploadResult.extractedText);

        // 5. Indicate evaluation loading.
        setIsEvaluating(true);

        // 6. Call the evaluation API.
        const evalResponse = await fetch("/api/assessment-evaluator", {
          method: "POST",
          body: formData,
        });
        const evalData = await evalResponse.json();
        console.log("Evaluation API response for student", studentId, evalData);

        // 7. Save evaluation result (as string) for that student.
        if (evalResponse.ok && evalData.evaluation) {
          setStudentUploads((prev) => ({
            ...prev,
            [studentId]: { ...prev[studentId], evaluation: evalData.evaluation },
          }));
        } else {
          console.error("Error evaluating assessment for student", studentId, evalData.error);
        }
      } catch (error) {
        console.error("Error uploading file for student", studentId, error);
      } finally {
        setIsEvaluating(false);
      }
    }
  };

  // -------------------------------
  // Handlers for student view (unchanged)
  const handleQuestionFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setInputMethod("file");
      setQuestionPaperText("");
      setError("");
      if (e.target.files[0].type === "application/pdf") {
        try {
          setIsExtractingText(true);
          const formData = new FormData();
          formData.append("file", e.target.files[0]);
          const response = await fetch("/api/assessment-evaluator/upload", {
            method: "POST",
            body: formData,
          });
          if (response.ok) {
            const data = await response.json();
            setQuestionPaperText(data.extractedText);
            console.log("Question Paper Text: ", data.extractedText);
          } else {
            console.error("Failed to extract text from PDF");
          }
        } catch (error) {
          console.error("Error extracting text from PDF:", error);
        } finally {
          setIsExtractingText(false);
        }
      }
    }
  };

  const handleAssessmentFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setInputMethod("file");
      setAnswerSheetText("");
      setError("");
      if (e.target.files[0].type === "application/pdf") {
        try {
          setIsExtractingText(true);
          const formData = new FormData();
          formData.append("file", e.target.files[0]);
          const response = await fetch("/api/assessment-evaluator/fileurl", {
            method: "POST",
            body: formData,
          });
          if (response.ok) {
            const data = await response.json();
            console.log("Assessment File URL: ", data.fileUrl);
            setfileUrl(data.fileUrl);
            const ocrResponse = await fetch("/api/assessment-evaluator/ocr", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: data.fileUrl }),
            });
            if (ocrResponse.ok) {
              const ocrData = await ocrResponse.json();
              console.log("Extracted Text: ", ocrData.extractedText);
              setAnswerSheetText(ocrData.extractedText);
            } else {
              console.error("Failed to extract text from OCR");
            }
          } else {
            console.error("Failed to extract text from PDF");
          }
        } catch (error) {
          console.error("Error extracting text from PDF:", error);
        } finally {
          setIsExtractingText(false);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file && !answerSheetText) {
      setError("Please provide an assignment (file or text), fill in all required fields.");
      return;
    }
    setIsLoading(true);
    setError("");
    setEvaluation(null);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 1000);
    const formData = new FormData();
    formData.append("questionPaperText", questionPaperText);
    formData.append("answerSheetText", answerSheetText || extractedText);
    if (teacherGrade) {
      formData.append("grade", teacherGrade);
    }
    if (teacherSection) {
      formData.append("section", teacherSection);
    }
    try {
      const response = await fetch("/api/assessment-evaluator", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        if (isValidEvaluation(data.evaluation)) {
          setEvaluation(data.evaluation);
        } else {
          setEvaluation(data.evaluation);
        }
      } else {
        setError(data.error || "Something went wrong!");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Failed to upload the file or evaluate the assignment.");
    } finally {
      clearInterval(interval);
      setUploadProgress(100);
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedEvaluation(evaluation as Evaluation);
  };

  const handleSave = () => {
    setIsEditing(false);
    setEvaluation(editedEvaluation);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedEvaluation(null);
  };

  const handleInputChange = (field: keyof Evaluation, subField: "score" | "comment", value: string | number) => {
    setEditedEvaluation((prev) => {
      if (!prev) return null;
      if (
        field === "strengths" ||
        field === "areasForImprovement" ||
        field === "overallComment" ||
        field === "totalScore"
      ) {
        return { ...prev, [field]: value };
      } else {
        const updatedField = prev[field] as { score: number; comment: string };
        return {
          ...prev,
          [field]: {
            ...updatedField,
            [subField]: subField === "score" ? Number(value) : value,
          },
        };
      }
    });
  };

  const handleDownloadPDF = () => {
    if (!evaluation) return;
    const doc = new jsPDF();
    let yOffset = 10;
    doc.setFontSize(18);
    doc.text("Evaluation Results", 10, yOffset);
    yOffset += 10;
    doc.setFontSize(12);
    if (typeof evaluation === "string") {
      doc.text(evaluation, 10, yOffset, { maxWidth: 190 });
    } else {
      doc.text(`Total Score: ${evaluation.totalScore}/100`, 10, yOffset);
      yOffset += 10;
      const addSection = (title: string, content: string) => {
        doc.setFontSize(14);
        doc.text(title, 10, yOffset);
        yOffset += 7;
        doc.setFontSize(12);
        doc.text(content, 10, yOffset, { maxWidth: 190 });
        yOffset += doc.getTextDimensions(content, { maxWidth: 190 }).h + 5;
      };
      addSection(
        "Content Understanding",
        `Score: ${evaluation.contentUnderstanding.score}/25\n${evaluation.contentUnderstanding.comment}`,
      );
      addSection(
        "Critical Thinking",
        `Score: ${evaluation.criticalThinking.score}/25\n${evaluation.criticalThinking.comment}`,
      );
      addSection(
        "Structure and Organization",
        `Score: ${evaluation.structureAndOrganization.score}/20\n${evaluation.structureAndOrganization.comment}`,
      );
      addSection(
        "Language and Communication",
        `Score: ${evaluation.languageAndCommunication.score}/20\n${evaluation.languageAndCommunication.comment}`,
      );
      addSection(
        "Research and Citation",
        `Score: ${evaluation.researchAndCitation.score}/10\n${evaluation.researchAndCitation.comment}`,
      );
      addSection("Strengths", evaluation.strengths);
      addSection("Areas for Improvement", evaluation.areasForImprovement);
      addSection("Overall Comment", evaluation.overallComment);
    }
    doc.save("evaluation_results.pdf");
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="shadow-lg border-2">
          <CardContent className="p-6 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Render Grade and Section dropdowns */}
              {(teacherGrade || teacherSection) && (
                <div className="flex gap-4">
                  {teacherGrade && (
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="grade" className="text-base font-semibold">Grade</Label>
                      <Select value={teacherGrade} onValueChange={(val) => setTeacherGrade(val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={teacherGrade}>{teacherGrade}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {teacherSection && (
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="section" className="text-base font-semibold">Section</Label>
                      <Select value={teacherSection} onValueChange={(val) => setTeacherSection(val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Section" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={teacherSection}>{teacherSection}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {/* Always show the Question Paper Upload input */}
              <div className="space-y-2">
                <Label htmlFor="file" className="text-base font-semibold">Upload Question Paper</Label>
                <Input
                  id="file"
                  type="file"
                  accept="application/pdf,text/plain"
                  onChange={handleQuestionFileChange}
                  disabled={isLoading || inputMethod === "text"}
                  className={`h-11 bg-white cursor-${inputMethod === "text" ? "not-allowed" : "pointer"}`}
                />
              </div>

              {/* For students view only */}
              {!isTeacher && (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="file" className="text-base font-semibold">Upload Answer Sheet</Label>
                      <Input
                        id="file"
                        type="file"
                        accept="application/pdf,text/plain"
                        onChange={handleAssessmentFileChange}
                        disabled={isLoading || inputMethod === "text"}
                        className={`h-11 bg-white cursor-${inputMethod === "text" ? "not-allowed" : "pointer"}`}
                      />
                    </div>
                  </div>
                </>
              )}

              {isLoading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-center text-muted-foreground">
                    {uploadProgress < 100 ? "Evaluating assessment..." : "Finalizing evaluation..."}
                  </p>
                </div>
              )}

              {/* For students view only */}
              {!isTeacher && (
                <Button
                  type="submit"
                  disabled={(!questionPaperText || !answerSheetText) || isLoading}
                  className="w-fit h-10 text-base font-semibold bg-rose-500 hover:bg-rose-600"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    "Evaluate Assessment"
                  )}
                </Button>
              )}

              {/* Display spinner for Extracting Text or Evaluating Assessment */}
              {(isExtractingText || isEvaluating) && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Loader2 className="h-5 w-5 animate-spin text-rose-500" />
                  <p className="text-sm font-medium">
                    {isExtractingText ? "Extracting Text..." : "Evaluating Assessment..."}
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Display error messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Render evaluation results for student view */}
        {evaluation && !isTeacher && (
          <Card className="shadow-lg border-2">
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="flex items-center justify-between text-2xl font-bold">
                Evaluation Results
                {typeof evaluation !== "string" && (
                  <span className="text-lg font-normal">Score: {evaluation.totalScore}/100</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {typeof evaluation === "string" ? (
                <div className="prose max-w-none">
                  <div className="p-4 bg-muted rounded-lg">
                    <Markdown>{evaluation}</Markdown>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="flex justify-end space-x-2">
                        <Button onClick={handleSave}>Save</Button>
                        <Button onClick={handleCancel} variant="outline">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <Separator />
                    </div>
                  )}
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button onClick={handleEdit} disabled={isEditing}>
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button onClick={handleDownloadPDF}>
                      <Download className="w-4 h-4 mr-2" /> Download PDF
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Teacher view: Table of students */}
        {isTeacher && teacherGradeId && teacherSectionId && students.length > 0 && (
          <Card className="shadow-lg border-2">
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="text-2xl font-bold">Students List</CardTitle>
            </CardHeader>
            <CardContent className="p-6 overflow-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border px-4 py-2 text-left">Student Email</th>
                    <th className="border px-4 py-2 text-left">Upload Answer Sheet</th>
                    <th className="border px-4 py-2 text-left">Evaluation Details</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const upload = studentUploads[student.user_id];
                    return (
                      <tr key={student.user_id}>
                        <td className="border px-4 py-2">{student.email}</td>
                        <td className="border px-4 py-2">
                          <input
                            id={`upload-input-${student.user_id}`}
                            type="file"
                            style={{ display: "none" }}
                            accept="application/pdf,text/plain"
                            onChange={(e) => handleTeacherUploadChange(student.user_id, e)}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const fileInput = document.getElementById(`upload-input-${student.user_id}`) as HTMLInputElement;
                              fileInput?.click();
                            }}
                          >
                            Upload
                          </Button>
                        </td>
                        <td className="border px-4 py-2">
                          {typeof upload?.evaluation === "string" ? (
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                openEvaluationPage(upload.evaluation!);
                              }}
                            >
                              Result
                            </a>
                          ) : (
                            "--"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
