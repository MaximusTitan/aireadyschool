"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, X } from "lucide-react";
import jsPDF from "jspdf";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/utils/supabase/client";
import {
  LessonPlan,
  EditContentState,
  UploadedFile,
  TeacherAssignment,
  Student,
  GeneratedNotes,
  ScheduleItem,
  Day,
} from "../types/index";
import { AssessmentPlanView } from "../components/assessment-plan";
import { SessionNavigator } from "../components/session-navigator";
import { LessonModalDialogs } from "../components/lesson-modal-dialogs";
import { LessonContent } from "../components/lesson-content";
import DocumentGenerator from "../../document-generator/DocumentGeneratorComponent";

const supabase = createClient();

export default function TeacherOutputContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const assessmentId = searchParams.get("assessmentId");
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("day-1");
  const [editContent, setEditContent] = useState<EditContentState>({
    isOpen: false,
    type: "",
    data: null,
  });
  const [generateNotesDialog, setGenerateNotesDialog] = useState<{
    isOpen: boolean;
    activity: { title: string; content: string } | null;
  }>({
    isOpen: false,
    activity: null,
  });
  const [assignLessonModal, setAssignLessonModal] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false,
  });
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
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
  const [generatedNotes, setGeneratedNotes] = useState<GeneratedNotes>({});
  const [uploadedFiles, setUploadedFiles] = useState<{
    [key: string]: UploadedFile[];
  }>({});
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showDocumentGenerator, setShowDocumentGenerator] = useState(false);
  const [documentSubmitted, setDocumentSubmitted] = useState(false);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      setIsAuthChecking(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user;

        if (!user) {
          setIsAuthorized(false);
          return;
        }

        const role = user.user_metadata?.role;
        if (role !== "Teacher") {
          setIsAuthorized(false);
          return;
        }

        setUserRole(role || null);
        setUserEmail(user.email || null);
        setIsAuthorized(true);
      } catch (error) {
        console.error("Authentication check failed:", error);
        setIsAuthorized(false);
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkAuthentication();
  }, [router]);

  useEffect(() => {
    if (!isAuthorized || !userEmail) return;

    (async () => {
      try {
        const { data: teacherData } = await supabase
          .from("teachers")
          .select("id")
          .eq(
            "user_id",
            (await supabase.auth.getSession()).data.session?.user?.id
          )
          .single();

        if (teacherData) {
          setTeacherId(teacherData.id);
        }
      } catch (error) {
        console.error("Failed to fetch teacher ID:", error);
      }
    })();
  }, [isAuthorized, userEmail]);

  const fetchLessonPlan = useCallback(async () => {
    if (!id || !isAuthorized) {
      return;
    }

    try {
      const { data: lessonPlanData, error: lessonPlanError } = await supabase
        .from("lesson_plans")
        .select("*")
        .eq("id", id)
        .single();

      if (lessonPlanError) throw lessonPlanError;

      if (lessonPlanData) {
        setLessonPlan(lessonPlanData as LessonPlan);
      } else {
        setError("Lesson plan not found");
      }

      try {
        const { data: notesData, error: notesError } = await supabase
          .from("generated_notes")
          .select("*")
          .eq("lesson_plan_id", id);

        if (notesError) throw notesError;
        if (notesData) {
          const notesObj: GeneratedNotes = {};
          notesData.forEach((note) => {
            notesObj[note.activity_title] = note.content;
          });
          setGeneratedNotes(notesObj);
        }
      } catch (notesError) {
        console.warn("Error fetching generated notes:", notesError);
      }

      try {
        const { data: filesData, error: filesError } = await supabase
          .from("uploaded_files")
          .select("*")
          .eq("lesson_plan_id", id);

        if (filesError) throw filesError;
        if (filesData) {
          const filesObj: { [key: string]: UploadedFile[] } = {};
          filesData.forEach((file) => {
            if (!filesObj[file.section_id]) filesObj[file.section_id] = [];
            filesObj[file.section_id].push({
              id: file.id,
              name: file.file_name,
              type: file.file_type,
              url: file.file_url,
            });
          });
          setUploadedFiles(filesObj);
        }
      } catch (filesError) {
        console.warn("Error fetching uploaded files:", filesError);
      }
    } catch (error) {
      console.error("Error fetching lesson plan data:", error);
      setError("Failed to fetch lesson plan data. Please try again.");
    }
  }, [id, isAuthorized]);

  useEffect(() => {
    fetchLessonPlan();
  }, [fetchLessonPlan]);

  useEffect(() => {
    const checkSubmissionStatus = async (docId: string) => {
      if (!docId) return;

      const { data, error } = await supabase
        .from("document_generator")
        .select("submitted")
        .eq("id", docId)
        .single();

      if (error) {
        console.error("Error checking submission status:", error);
        return;
      }

      setDocumentSubmitted(!!data?.submitted);
    };

    if (lessonPlan && activeTab.startsWith("day-")) {
      const dayIndex = Number.parseInt(activeTab.split("-")[1]) - 1;
      const docId = lessonPlan.plan_data.days[dayIndex].assignment?.document_id;
      if (docId) {
        checkSubmissionStatus(docId);
      }
    }
  }, [lessonPlan, activeTab]);

  useEffect(() => {
    if (isAuthorized && id && activeTab.startsWith("day-") && lessonPlan) {
      const dayIndex = parseInt(activeTab.split("-")[1]) - 1;
      const day = lessonPlan.plan_data.days[dayIndex];

      if (day.assessment && day.assessment.assessmentId) {
        fetchAssessmentData(day.assessment.assessmentId);
      } else {
        setAssessmentData(null);
      }
    }
  }, [isAuthorized, id, activeTab, lessonPlan]);

  const fetchAssessmentData = async (assessmentId: string) => {
    try {
      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .eq("id", assessmentId)
        .single();

      if (error) throw error;
      setAssessmentData(data);
    } catch (error) {
      console.error("Error fetching assessment data:", error);
    }
  };

  const handleEdit = (type: string, data: any, dayIndex?: number) => {
    setEditContent({
      isOpen: true,
      type,
      data,
      dayIndex,
    });
  };

  const handleSave = async () => {
    await fetchLessonPlan();
  };

  const handleGenerateNotes = (
    activityTitle: string,
    activityContent: string
  ) => {
    setGenerateNotesDialog({
      isOpen: true,
      activity: {
        title: activityTitle,
        content: activityContent,
      },
    });
  };

  const handleNotesGenerated = async (notes: string): Promise<void> => {
    if (generateNotesDialog.activity && lessonPlan && userEmail) {
      try {
        const { data, error } = await supabase
          .from("generated_notes")
          .upsert({
            lesson_plan_id: lessonPlan.id,
            activity_title: generateNotesDialog.activity.title,
            content: notes,
          })
          .select();

        if (error) throw error;

        setGeneratedNotes((prev) => ({
          ...prev,
          [generateNotesDialog.activity!.title]: notes,
        }));

        toast({
          title: "Success",
          description: "Notes saved successfully",
        });
      } catch (error) {
        console.error("Error saving generated notes:", error);
        toast({
          title: "Error",
          description: "Failed to save notes. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleNotesEdit = async (activityTitle: string, notes: string) => {
    if (lessonPlan && userEmail) {
      try {
        const { error } = await supabase
          .from("generated_notes")
          .upsert({
            lesson_plan_id: lessonPlan.id,
            activity_title: activityTitle,
            content: notes,
          })
          .select();

        if (error) throw error;

        setGeneratedNotes((prev) => ({
          ...prev,
          [activityTitle]: notes,
        }));

        toast({
          title: "Success",
          description: "Notes updated successfully",
        });
      } catch (error) {
        console.error("Error updating notes:", error);
        toast({
          title: "Error",
          description: "Failed to update notes. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileUpload = async (
    file: File,
    type: string,
    sectionId: string
  ): Promise<void> => {
    if (!lessonPlan) {
      console.error("No lesson plan available");
      return;
    }

    try {
      if (!userEmail) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to upload files",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Uploading...",
        description: `Uploading ${file.name}`,
      });

      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const safeEmail = userEmail.replace(/[^a-zA-Z0-9]/g, "_");
      const filePath = `${safeEmail}/${lessonPlan.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("lesson-plan-materials")
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("lesson-plan-materials").getPublicUrl(filePath);

      const { data: fileData, error: dbError } = await supabase
        .from("uploaded_files")
        .insert({
          lesson_plan_id: lessonPlan.id,
          section_id: sectionId,
          file_name: file.name,
          file_type: type,
          file_url: publicUrl,
        })
        .select();

      if (dbError) {
        console.error("Database error:", dbError);
        throw dbError;
      }

      const newFile = {
        id: fileData[0].id,
        name: file.name,
        type,
        url: publicUrl,
      };

      setUploadedFiles((prev) => {
        const updatedFiles = {
          ...prev,
          [sectionId]: [...(prev[sectionId] || []), newFile],
        };
        return updatedFiles;
      });

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description:
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message: string }).message
            : "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFile = async (
    fileId: string,
    sectionId: string
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from("uploaded_files")
        .delete()
        .eq("id", fileId);

      if (error) throw error;

      setUploadedFiles((prev) => {
        const updatedFiles = { ...prev };
        updatedFiles[sectionId] = updatedFiles[sectionId].filter(
          (file) => file.id !== fileId
        );
        return updatedFiles;
      });

      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Error",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!lessonPlan) return;

    const doc = new jsPDF();
    let yOffset = 20;

    const addHeading = (text: string, size = 16) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(size);
      doc.text(text, 20, yOffset);
      yOffset += 10;
    };

    const addText = (text: string, size = 12) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, 170);
      doc.text(lines, 20, yOffset);
      yOffset += (lines.length * size) / 2 + 5;
    };

    const addBulletPoint = (text: string, indent = 20) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      const lines = doc.splitTextToSize(text, 160);
      doc.text("•", indent, yOffset);
      doc.text(lines, indent + 5, yOffset);
      yOffset += (lines.length * 12) / 2 + 5;
    };

    const checkNewPage = () => {
      if (yOffset > 270) {
        doc.addPage();
        yOffset = 20;
      }
    };

    addHeading(`${lessonPlan.subject ? `${lessonPlan.subject} - ` : ''}${lessonPlan.chapter_topic}`, 20);
    
    if (lessonPlan.grade) {
      addText(`Grade: ${lessonPlan.grade}`);
    }
    if (lessonPlan.board) {
      addText(`Board: ${lessonPlan.board}`);
    }
    
    addText(`Duration: ${lessonPlan.class_duration} minutes`);
    addText(`Number of Days: ${lessonPlan.number_of_days}`);

    if (lessonPlan.learning_objectives) {
      addText(`Learning Objectives: ${lessonPlan.learning_objectives}`);
    }
    yOffset += 10;

    lessonPlan.plan_data.days.forEach((day) => {
      checkNewPage();
      addHeading(`Day ${day.day}: ${day.topicHeading}`, 16);

      addHeading("Learning Outcomes:", 14);
      day.learningOutcomes.forEach((outcome) => {
        checkNewPage();
        addBulletPoint(outcome);
      });
      yOffset += 5;

      checkNewPage();
      addHeading("Schedule:", 14);
      day.schedule.forEach((item) => {
        checkNewPage();
        addText(`${item.title || item.type} (${item.timeAllocation} min):`);
        addText(item.content);
        yOffset += 2;
      });

      yOffset += 10;
    });

    checkNewPage();
    addHeading("Assessment Plan", 16);
    yOffset += 5;

    addHeading("Formative Assessments:", 14);
    lessonPlan.plan_data.assessmentPlan.formativeAssessments.forEach(
      (assessment) => {
        checkNewPage();
        addText(`${assessment.topic} (${assessment.type})`);
        addText(assessment.description);
        addText("Evaluation Criteria:");
        assessment.evaluationCriteria.forEach((criteria) => {
          checkNewPage();
          addBulletPoint(criteria);
        });
        yOffset += 5;
      }
    );

    checkNewPage();
    addHeading("Summative Assessments:", 14);
    lessonPlan.plan_data.assessmentPlan.summativeAssessments.forEach(
      (assessment) => {
        checkNewPage();
        addText(`${assessment.topic} (${assessment.type})`);
        addText(assessment.description);
        addText("Evaluation Criteria:");
        assessment.evaluationCriteria.forEach((criteria) => {
          checkNewPage();
          addBulletPoint(criteria);
        });
        yOffset += 5;
      }
    );

    checkNewPage();
    addHeading("Progress Tracking Suggestions:", 14);
    lessonPlan.plan_data.assessmentPlan.progressTrackingSuggestions.forEach(
      (suggestion) => {
        checkNewPage();
        addBulletPoint(suggestion);
      }
    );

    const fileName = `${lessonPlan.subject ? `${lessonPlan.subject}_` : ''}${lessonPlan.chapter_topic}${lessonPlan.grade ? `_Grade${lessonPlan.grade}` : ''}.pdf`
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();

    doc.save(fileName);
  };

  const handleAssignLesson = async () => {
    if (!lessonPlan) return;

    setIsAssigning(true);
    try {
      if (!assessmentId) {
        if (teacherId) {
          await fetchTeacherAssignments(teacherId);
          setAssignLessonModal({ isOpen: true });
        } else {
          toast({
            title: "Error",
            description: "Teacher information not found. Please try again.",
            variant: "destructive",
          });
        }
        setIsAssigning(false);
        return;
      }

      const { error } = await supabase
        .from("assigned_assessments")
        .update({
          lesson_plan: {
            id: lessonPlan.id,
            subject: lessonPlan.subject,
            chapter_topic: lessonPlan.chapter_topic,
            grade: lessonPlan.grade,
            board: lessonPlan.board,
            class_duration: lessonPlan.class_duration,
            number_of_days: lessonPlan.number_of_days,
            learning_objectives: lessonPlan.learning_objectives,
            plan_data: lessonPlan.plan_data,
            created_at: new Date().toISOString(),
          },
        })
        .eq("assessment_id", assessmentId);

      if (error) {
        console.error("Error assigning lesson plan:", error);
        toast({
          title: "Error",
          description: "Failed to assign lesson plan. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Lesson plan assigned successfully",
        });
      }
    } catch (error) {
      console.error("Error assigning lesson plan:", error);
      toast({
        title: "Error",
        description: "Failed to assign lesson plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
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
              } as TeacherAssignment,
            ])
          ).values()
        );
        setAssignments(unique as TeacherAssignment[]);

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

  const createStudentLessonPlan = async (studentEmail: string) => {
    if (!lessonPlan) return null;

    try {
      // Create a copy of the plan data to modify for the student
      const studentPlanData = JSON.parse(JSON.stringify(lessonPlan.plan_data));

      // Handle assessment duplication for each day that has an assessment
      for (let i = 0; i < studentPlanData.days.length; i++) {
        const day = studentPlanData.days[i];
        if (day.assessment && day.assessment.assessmentId) {
          // Get the original assessment
          const { data: originalAssessment } = await supabase
            .from("assessments")
            .select("*")
            .eq("id", day.assessment.assessmentId)
            .single();

          if (originalAssessment) {
            // Create a new assessment for the student
            const { data: newAssessment, error } = await supabase
              .from("assessments")
              .insert({
                class_level: lessonPlan.grade,
                subject: lessonPlan.subject,
                topic: originalAssessment.topic || day.assessment.topic,
                assessment_type: originalAssessment.assessment_type,
                difficulty: originalAssessment.difficulty,
                questions: originalAssessment.questions,
                board: lessonPlan.board,
                learning_outcomes: originalAssessment.learning_outcomes,
                user_email: studentEmail,
                submitted: false,
              })
              .select();

            if (!error && newAssessment) {
              // Update the assessment ID in the student's plan
              studentPlanData.days[i].assessment.assessmentId =
                newAssessment[0].id;
            }
          }
        }
      }

      // Create the student lesson plan with the modified plan data
      const { data, error } = await supabase
        .from("lesson_plans")
        .insert({
          subject: lessonPlan.subject,
          chapter_topic: lessonPlan.chapter_topic,
          grade: lessonPlan.grade,
          board: lessonPlan.board,
          class_duration: lessonPlan.class_duration,
          number_of_days: lessonPlan.number_of_days,
          learning_objectives: lessonPlan.learning_objectives,
          plan_data: studentPlanData, // Use the modified plan data with new assessment IDs
          user_email: studentEmail,
        })
        .select();

      if (error) throw error;

      const studentLessonPlanId = data[0].id;

      // Copy notes and files as before
      for (const [activityTitle, content] of Object.entries(generatedNotes)) {
        await supabase.from("generated_notes").insert({
          lesson_plan_id: studentLessonPlanId,
          activity_title: activityTitle,
          content: content,
        });
      }

      for (const [sectionId, files] of Object.entries(uploadedFiles)) {
        for (const file of files) {
          await supabase.from("uploaded_files").insert({
            lesson_plan_id: studentLessonPlanId,
            section_id: sectionId,
            file_name: file.name,
            file_type: file.type,
            file_url: file.url,
          });
        }
      }

      return data[0];
    } catch (error) {
      console.error("Error creating student lesson plan:", error);
      return null;
    }
  };

  const handleConfirmAssignment = async (
    assignType: string,
    selectedValue: string,
    assignDueDate: Date
  ) => {
    if (!lessonPlan || !teacherId) return;

    try {
      if (assignType === "class") {
        const assignmentObj = JSON.parse(selectedValue) as TeacherAssignment;
        const filteredStudents = students.filter(
          (student) =>
            student.grade_id === assignmentObj.grade_id &&
            student.section_id === assignmentObj.section_id
        );

        if (filteredStudents.length === 0) {
          toast({
            title: "No Students",
            description: "No students found for the selected class.",
            variant: "destructive",
          });
          return;
        }

        const results = await Promise.all(
          filteredStudents.map(async (student) => {
            const studentPlan = await createStudentLessonPlan(student.email);
            return studentPlan;
          })
        );

        const successCount = results.filter(Boolean).length;
        toast({
          title: "Success",
          description: `Lesson plan assigned to ${successCount} students.`,
        });
      } else {
        const studentEmail = students.find(
          (s) => s.id === selectedValue
        )?.email;

        if (!studentEmail) {
          toast({
            title: "Error",
            description: "Student email not found.",
            variant: "destructive",
          });
          return;
        }

        const studentPlan = await createStudentLessonPlan(studentEmail);

        if (studentPlan) {
          toast({
            title: "Success",
            description: "Lesson plan assigned to student successfully.",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to assign lesson plan.",
            variant: "destructive",
          });
        }
      }

      setAssignLessonModal({ isOpen: false });
    } catch (error) {
      console.error("Error confirming assignment:", error);
      toast({
        title: "Error",
        description: "Failed to assign lesson plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateAssessment = async (formData: any) => {
    if (!lessonPlan || !userEmail || !activeTab.startsWith("day-")) return;

    setIsCreatingAssessment(true);
    try {
      const dayIndex = parseInt(activeTab.split("-")[1]) - 1;

      // Call the assessment generation API
      const response = await fetch("/api/generate-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          board: formData.board || lessonPlan.board,
          classLevel: lessonPlan.grade,
          subject: formData.subject || lessonPlan.subject,
          topic: formData.topic,
          assessmentType: formData.type,
          difficulty: formData.difficulty,
          questionCount: formData.questionCount,
          learningOutcomes: formData.learningOutcomes,
          model:
            lessonPlan.board === "CAIE"
              ? "claude-3-7-sonnet-20250219"
              : "gpt-4o",
          user_email: userEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Assessment generation failed");
      }

      const assessmentResponse = await response.json();

      // Ensure topic is always a non-empty string
      const assessmentTopic =
        formData.topic ||
        lessonPlan.plan_data.days[dayIndex].assessment?.topic ||
        lessonPlan.chapter_topic ||
        "Assessment";

      // Update the lesson plan with the assessment ID
      const updatedPlanData = { ...lessonPlan.plan_data };
      updatedPlanData.days[dayIndex].assessment = {
        topic: assessmentTopic, // Always provide a string for topic
        learningObjectives:
          lessonPlan.plan_data.days[dayIndex].assessment?.learningObjectives ||
          formData.learningOutcomes ||
          [],
        assessmentId: assessmentResponse.id,
        assessmentType: formData.type,
        difficulty: formData.difficulty,
        board: formData.board || lessonPlan.board,
        subject: formData.subject || lessonPlan.subject,
      };

      const { error } = await supabase
        .from("lesson_plans")
        .update({
          plan_data: updatedPlanData,
        })
        .eq("id", lessonPlan.id);

      if (error) throw error;

      // Update local state
      setLessonPlan({
        ...lessonPlan,
        plan_data: updatedPlanData,
      });

      setAssessmentData(assessmentResponse);

      toast({
        title: "Success",
        description: "Assessment created successfully",
      });
    } catch (error) {
      console.error("Error creating assessment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create assessment: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setIsCreatingAssessment(false);
    }
  };

  const handleAssignAssessmentToStudent = async (
    studentEmail: string,
    assessmentId: string
  ) => {
    try {
      // First duplicate the assessment for this student
      const { data: assessmentData } = await supabase
        .from("assessments")
        .select("*")
        .eq("id", assessmentId)
        .single();

      if (!assessmentData) throw new Error("Assessment not found");

      // Create a copy of the assessment assigned to this student
      const { data: newAssessment, error } = await supabase
        .from("assessments")
        .insert({
          ...assessmentData,
          id: undefined, // Let Supabase generate a new ID
          user_email: studentEmail,
          original_assessment_id: assessmentId,
        })
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assessment assigned to student successfully",
      });

      return newAssessment[0];
    } catch (error) {
      console.error("Error assigning assessment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to assign assessment to student",
      });
      return null;
    }
  };

  const handleChatWithBuddy = (item: ScheduleItem, day: Day) => {
    if (lessonPlan) {
      const scheduleData = {
        day: day.day,
        topicHeading: day.topicHeading,
        schedule: item,
        learningOutcomes: day.learningOutcomes,
      };

      router.push(
        `/tools/gen-chat?thread=new&teachingMode=true&lessonPlanId=${lessonPlan.id}&scheduleData=${encodeURIComponent(JSON.stringify(scheduleData))}`
      );
    }
  };

  const handleChatWithBuddyNoArgs = () => {
    if (!lessonPlan) return;
    router.push(
      `/tools/gen-chat?thread=new&teachingMode=true&lessonPlanId=${lessonPlan.id}`
    );
  };

  const renderAssignButton = () => {
    if (!lessonPlan) return null;

    return (
      <Button
        onClick={handleAssignLesson}
        className="bg-rose-500 hover:bg-rose-600 text-white"
        disabled={isAssigning}
      >
        {isAssigning
          ? "Assigning..."
          : assessmentId
            ? "Assign to Student"
            : "Assign to Student"}
      </Button>
    );
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Error</h1>
        <p>{error}</p>
        <Button onClick={() => router.push("/")} className="mt-4">
          Back to Home
        </Button>
      </div>
    );
  }

  if (!lessonPlan) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-backgroundApp">
      <div className="px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <Button
            variant="outline"
            className="mb-6"
            onClick={() => router.push("/tools/lesson-planner")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {lessonPlan && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">
                  Lesson Plan: {lessonPlan.chapter_topic}
                </h1>
                <p className="text-gray-600 mt-2">
                  {lessonPlan.grade && `${lessonPlan.grade} Grade`}
                  {lessonPlan.grade && lessonPlan.board && " | "}
                  {lessonPlan.board}
                  {(lessonPlan.grade || lessonPlan.board) && " | "}
                  {lessonPlan.number_of_days} Sessions - {lessonPlan.class_duration} Minutes Each
                </p>
              </div>

              <div className="flex gap-4 mb-6">
                {/* <Button onClick={handleChatWithBuddyNoArgs} variant="default">
                  Chat with Buddy
                </Button> */}
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                {renderAssignButton()}
              </div>

              <SessionNavigator
                days={lessonPlan.plan_data.days}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </>
          )}
        </div>

        {activeTab.startsWith("day-") ? (
          <div
            className={`${showDocumentGenerator ? "flex gap-6 px-4" : "mx-auto max-w-7xl"}`}
          >
            <div
              className={`${showDocumentGenerator ? "flex-1 w-1/2" : "w-full"} bg-white rounded-lg border p-6`}
            >
              <LessonContent
                day={
                  lessonPlan.plan_data.days[
                    Number.parseInt(activeTab.split("-")[1]) - 1
                  ]
                }
                userRole={userRole}
                generatedNotes={generatedNotes}
                uploadedFiles={uploadedFiles}
                onEdit={handleEdit}
                onGenerateNotes={handleGenerateNotes}
                onFileUpload={handleFileUpload}
                onDeleteFile={handleDeleteFile}
                onChatWithBuddy={handleChatWithBuddy}
                showDocumentGenerator={showDocumentGenerator}
                setShowDocumentGenerator={setShowDocumentGenerator}
                onNotesEdit={handleNotesEdit}
                assessmentData={assessmentData}
                onCreateAssessment={handleCreateAssessment}
                isCreatingAssessment={isCreatingAssessment} // Pass loading state
              />
            </div>

            {showDocumentGenerator && userRole === "Teacher" && (
              <div className="flex-1 w-1/2 bg-white rounded-lg border p-6 relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => setShowDocumentGenerator(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <DocumentGenerator
                  initialContent=""
                  initialTitle={`${
                    lessonPlan.subject ? `${lessonPlan.subject} - ` : ''
                  }${
                    lessonPlan.plan_data.days[
                      Number.parseInt(activeTab.split("-")[1]) - 1
                    ].topicHeading
                  } - Assignment`}
                  embedded={true}
                  initialDocumentId={
                    lessonPlan.plan_data.days[
                      Number.parseInt(activeTab.split("-")[1]) - 1
                    ].assignment?.document_id
                  }
                  readOnly={true}
                  submitted={documentSubmitted}
                  hiddenUntilSubmitted={true}
                  isTeacherView={true}
                  showSubmissionStatus={true}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto max-w-7xl">
            <div className="bg-white rounded-lg border p-6">
              {activeTab === "assessment" && (
                <AssessmentPlanView
                  assessmentPlan={lessonPlan.plan_data.assessmentPlan}
                  userRole={userRole}
                  uploadedFiles={uploadedFiles}
                  onEdit={handleEdit}
                  onFileUpload={handleFileUpload}
                  onDeleteFile={handleDeleteFile}
                />
              )}
            </div>
          </div>
        )}

        <div className="mx-auto max-w-7xl">
          <LessonModalDialogs
            editContent={editContent}
            onEditClose={() =>
              setEditContent({ ...editContent, isOpen: false })
            }
            onEditSave={handleSave}
            generateNotesDialog={generateNotesDialog}
            onGenerateNotesClose={() =>
              setGenerateNotesDialog({ isOpen: false, activity: null })
            }
            onNotesGenerated={handleNotesGenerated}
            assignLessonModal={assignLessonModal}
            onAssignModalClose={() => setAssignLessonModal({ isOpen: false })}
            assignments={assignments}
            students={students}
            selectedGrade={selectedGrade}
            setSelectedGrade={setSelectedGrade}
            selectedSection={selectedSection}
            setSelectedSection={setSelectedSection}
            selectedStudent={selectedStudent}
            setSelectedStudent={setSelectedStudent}
            selectedClass={selectedClass}
            setSelectedClass={setSelectedClass}
            dueDate={dueDate}
            setDueDate={setDueDate}
            assignmentType={assignmentType}
            setAssignmentType={setAssignmentType}
            onConfirmAssignment={handleConfirmAssignment}
            lessonPlanId={lessonPlan.id}
          />
        </div>
      </div>
    </div>
  );
}
