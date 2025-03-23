"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import { EditLessonContent } from "../components/edit-lesson-content";
import { GenerateNotesDialog } from "../components/generate-notes-dialog";
import { AddContentDropdown } from "../components/add-content-dropdown";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/utils/supabase/client";

const supabaseClient = createClient();

interface ScheduleItem {
  type: string;
  title: string;
  content: string;
  timeAllocation: number;
}

interface Assignment {
  description: string;
  tasks: string[];
}

interface Day {
  day: number;
  topicHeading: string;
  learningOutcomes: string[];
  schedule: ScheduleItem[];
  teachingAids: string[];
  assignment: Assignment;
}

interface Assessment {
  topic: string;
  type: string;
  description: string;
  evaluationCriteria: string[];
}

interface AssessmentPlan {
  formativeAssessments: Assessment[];
  summativeAssessments: Assessment[];
  progressTrackingSuggestions: string[];
}

interface LessonPlan {
  id: string;
  subject: string;
  chapter_topic: string;
  grade: string;
  board: string;
  class_duration: number;
  number_of_days: number;
  learning_objectives: string;
  plan_data: {
    days: Day[];
    assessmentPlan: AssessmentPlan;
  };
}

interface EditContentState {
  isOpen: boolean;
  type: string;
  data: any;
  dayIndex?: number;
}

interface GeneratedNotes {
  [key: string]: string;
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  url: string;
}

interface AssignLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonPlan: LessonPlan;
  assessmentId: string | null;
}

export default function OutputContent() {
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
  const [generatedNotes, setGeneratedNotes] = useState<GeneratedNotes>({});
  const [uploadedFiles, setUploadedFiles] = useState<{
    [key: string]: UploadedFile[];
  }>({});
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [buddyInput, setBuddyInput] = useState("");

  // Check authentication state directly in component
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        const email = data.session?.user?.email || null;
        setUserEmail(email);
        setUserRole(data.session?.user?.user_metadata?.role || null);
        setIsAuthChecking(false);
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthChecking(false);
      }
    }

    checkAuth();

    // Set up listener for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUserEmail(session?.user?.email || null);
      setUserRole(session?.user?.user_metadata?.role || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const sessionCheck = await supabaseClient.auth.getSession();
        // For example, fetch user metadata or role here
        if (sessionCheck.data?.session?.user) {
          setUserRole(
            sessionCheck.data.session.user.user_metadata?.role || null
          );
        }
      } catch (error) {
        console.error("Page load role check error:", error);
      }
    })();
  }, []);

  const fetchLessonPlan = useCallback(async () => {
    if (!id) {
      setError("No lesson plan ID provided");
      return;
    }

    try {
      // First verify the lesson plan exists
      const { data: lessonPlanData, error: lessonPlanError } = await supabase
        .from("lesson_plans")
        .select("*")
        .eq("id", id)
        .single();

      if (lessonPlanError) throw lessonPlanError;

      // Set the lesson plan data immediately
      if (lessonPlanData) {
        setLessonPlan(lessonPlanData as LessonPlan);

        // Check ownership only for informational purposes, don't prevent viewing
        if (
          userEmail &&
          lessonPlanData.user_email &&
          lessonPlanData.user_email !== userEmail
        ) {
          console.warn("User viewing a lesson plan they don't own");
        }
      } else {
        setError("Lesson plan not found");
      }

      // Rest of your fetch logic for notes and files remains the same
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
  }, [id, userEmail]);

  // Fetch lesson plan when we have an ID, regardless of auth state
  useEffect(() => {
    if (id) {
      fetchLessonPlan();
    }
  }, [id, fetchLessonPlan]);

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

  const handleNotesGenerated = async (notes: string) => {
    if (generateNotesDialog.activity && lessonPlan && userEmail) {
      try {
        const { data, error } = await supabase
          .from("generated_notes")
          .upsert({
            lesson_plan_id: lessonPlan.id,
            activity_title: generateNotesDialog.activity.title,
            content: notes,
            // User association is maintained through lesson_plan_id foreign key
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

  const handleFileUpload = async (
    file: File,
    type: string,
    sectionId: string
  ) => {
    if (!lessonPlan) {
      console.error("No lesson plan available");
      return;
    }

    try {
      // Debug logging
      console.log("Upload attempt:", {
        file,
        type,
        sectionId,
        userEmail,
        lessonPlanId: lessonPlan.id,
      });

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

      // Create unique filename with timestamp
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const safeEmail = userEmail.replace(/[^a-zA-Z0-9]/g, "_");
      const filePath = `${safeEmail}/${lessonPlan.id}/${fileName}`;

      console.log("Uploading to path:", filePath);

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("lesson-plan-materials")
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false, // Ensure we're not overwriting
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }

      console.log("Upload successful:", uploadData);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("lesson-plan-materials").getPublicUrl(filePath);

      console.log("Public URL generated:", publicUrl);

      // Save to database
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

      console.log("Database entry created:", fileData);

      // Update UI state
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
        console.log("Updated files state:", updatedFiles);
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

  const handleDeleteFile = async (fileId: string, sectionId: string) => {
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

    // Helper functions for PDF generation
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

    // Title and Basic Information
    addHeading(`${lessonPlan.subject} - ${lessonPlan.chapter_topic}`, 20);
    addText(`Grade: ${lessonPlan.grade}`);
    addText(`Board: ${lessonPlan.board}`);
    addText(`Duration: ${lessonPlan.class_duration} minutes`);
    addText(`Number of Days: ${lessonPlan.number_of_days}`);
    if (lessonPlan.learning_objectives) {
      addText(`Learning Objectives: ${lessonPlan.learning_objectives}`);
    }
    yOffset += 10;

    // Daily Plans
    lessonPlan.plan_data.days.forEach((day, index) => {
      checkNewPage();
      addHeading(`Day ${day.day}: ${day.topicHeading}`, 16);

      // Learning Outcomes
      addHeading("Learning Outcomes:", 14);
      day.learningOutcomes.forEach((outcome) => {
        checkNewPage();
        addBulletPoint(outcome);
      });
      yOffset += 5;

      // Schedule
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

    // Assessment Plan
    checkNewPage();
    addHeading("Assessment Plan", 16);
    yOffset += 5;

    // Formative Assessments
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

    // Summative Assessments
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

    // Progress Tracking
    checkNewPage();
    addHeading("Progress Tracking Suggestions:", 14);
    lessonPlan.plan_data.assessmentPlan.progressTrackingSuggestions.forEach(
      (suggestion) => {
        checkNewPage();
        addBulletPoint(suggestion);
      }
    );

    // Save the PDF
    const fileName =
      `${lessonPlan.subject}_${lessonPlan.chapter_topic}_Grade${lessonPlan.grade}.pdf`
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();

    doc.save(fileName);
  };

  const handleAssignLesson = async () => {
    if (!lessonPlan) return;

    setIsAssigning(true);
    try {
      if (!assessmentId) {
        // If no assessmentId, open assign modal
        setAssignLessonModal({ isOpen: true });
        return;
      }

      // If we have an assessmentId, update the assigned_assessment record directly
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

  const handleRedirectToBuddy = (e: React.FormEvent) => {
    e.preventDefault();
    if (lessonPlan) {
      router.push(
        `/tools/gen-chat?thread=new&teachingMode=false&lessonPlanId=${
          lessonPlan.id
        }&userInput=${encodeURIComponent(buddyInput)}`
      );
    }
  };

  const renderAssignButton = () => {
    if (!lessonPlan) return null;

    return (
      <Button
        onClick={handleAssignLesson}
        className="bg-rose-400 hover:bg-rose-500 text-black"
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
        <div className="text-center"></div>
        <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin mx-auto mb-4">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
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

  const renderDayContent = (day: Day) => (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">
          Session {day.day}: {day.topicHeading}
        </h2>
        <p className="text-gray-600 mt-4">
          {day.schedule.find((item) => item.type === "introduction")?.content ||
            "This session focuses on key concepts related to the topic."}
        </p>
      </div>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Learning Outcomes</h3>
        <ul className="space-y-2">
          {day.learningOutcomes.map((outcome, index) => (
            <li key={index} className="flex items-start">
              <span className="inline-flex items-center justify-center rounded-full border border-gray-300 p-1 mr-3 mt-1">
                <span className="h-2 w-2 rounded-full bg-gray-500"></span>
              </span>
              <span>{outcome}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Lesson Objectives</h3>
        <ul className="space-y-2">
          {day.schedule
            .filter(
              (item) => item.type === "mainContent" || item.type === "activity"
            )
            .slice(0, 2)
            .map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-flex items-center justify-center rounded-full border border-gray-300 p-1 mr-3 mt-1">
                  <span className="h-2 w-2 rounded-full bg-gray-500"></span>
                </span>
                <span>{item.title}</span>
              </li>
            ))}
        </ul>
      </div>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Lesson Plan</h3>
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 w-24">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  Activities
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 w-64">
                  Materials
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {day.schedule.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {String(item.timeAllocation).padStart(2, "0")}:
                    {String(0).padStart(2, "0")}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">
                      {item.title || item.type}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {item.content}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">Lesson Content</div>
                        {userRole !== "Student" && (
                          <AddContentDropdown
                            onUpload={(file, type) =>
                              handleFileUpload(
                                file,
                                type,
                                `material-${day.day}-${index}`
                              )
                            }
                          />
                        )}
                      </div>
                      <div className="text-gray-500">{item.title}</div>
                      {userRole === "Student" ? (
                        <button
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.preventDefault();
                            handleChatWithBuddy(item, day);
                          }}
                          className="text-blue-500 hover:text-blue-600 text-sm mt-1 flex items-center gap-1"
                        >
                          Chat with Buddy
                        </button>
                      ) : (
                        <button
                          className="text-rose-500 hover:text-rose-600 text-sm mt-1 flex items-center gap-1"
                          onClick={() =>
                            handleGenerateNotes(item.title, item.content)
                          }
                        >
                          {generatedNotes[item.title]
                            ? "See the content"
                            : "Generate"}
                        </button>
                      )}
                      {uploadedFiles[`material-${day.day}-${index}`]?.map(
                        (file, fileIndex) => {
                          // Generate standardized file name based on type and count
                          const displayName = `${file.type}_${fileIndex + 1}`;

                          return (
                            <div key={file.id} className="mt-2 text-sm">
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1"
                                title={file.name} // Show original filename on hover
                              >
                                {displayName}
                              </a>
                              <button
                                className="text-red-500 hover:text-red-600 text-sm ml-2"
                                onClick={() =>
                                  handleDeleteFile(
                                    file.id,
                                    `material-${day.day}-${index}`
                                  )
                                }
                              >
                                Delete
                              </button>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAssessmentPlan = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Assessment Plan</h2>
        {userRole !== "Student" && (
          <AddContentDropdown
            onUpload={(file, type) =>
              handleFileUpload(file, type, "assessment-plan")
            }
          />
        )}
      </div>

      {uploadedFiles["assessment-plan"]?.length > 0 && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="font-semibold mb-2">Uploaded Materials</h3>
          <div className="space-y-2">
            {uploadedFiles["assessment-plan"].map((file) => (
              <div key={file.id} className="flex items-center gap-2">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {file.type}: {file.name}
                </a>
                <button
                  className="text-red-500 hover:text-red-600 text-sm ml-2"
                  onClick={() => handleDeleteFile(file.id, "assessment-plan")}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-4">Formative Assessments</h3>
          <div className="space-y-4">
            {lessonPlan.plan_data.assessmentPlan.formativeAssessments.map(
              (assessment, index) => (
                <div key={index} className="border-b pb-4">
                  <div className="font-medium mb-2">{assessment.topic}</div>
                  <p className="text-gray-600 mb-2">{assessment.description}</p>
                  <div className="text-sm text-gray-500">
                    Type: {assessment.type}
                  </div>
                  <div className="mt-2">
                    <div className="font-medium text-sm mb-1">
                      Evaluation Criteria:
                    </div>
                    <ul className="list-disc pl-5 space-y-1">
                      {assessment.evaluationCriteria.map((criteria, idx) => (
                        <li key={idx} className="text-gray-600">
                          {criteria}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Summative Assessments</h3>
          <div className="space-y-4">
            {lessonPlan.plan_data.assessmentPlan.summativeAssessments.map(
              (assessment, index) => (
                <div key={index} className="border-b pb-4">
                  <div className="font-medium mb-2">{assessment.topic}</div>
                  <p className="text-gray-600 mb-2">{assessment.description}</p>
                  <div className="text-sm text-gray-500">
                    Type: {assessment.type}
                  </div>
                  <div className="mt-2">
                    <div className="font-medium text-sm mb-1">
                      Evaluation Criteria:
                    </div>
                    <ul className="list-disc pl-5 space-y-1">
                      {assessment.evaluationCriteria.map((criteria, idx) => (
                        <li key={idx} className="text-gray-600">
                          {criteria}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Progress Tracking Suggestions</h3>
          <ul className="list-disc pl-5 space-y-1">
            {lessonPlan.plan_data.assessmentPlan.progressTrackingSuggestions.map(
              (suggestion, index) => (
                <li key={index} className="text-gray-600">
                  {suggestion}
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-backgroundApp">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
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
                {lessonPlan.grade} Grade | {lessonPlan.board} |{" "}
                {lessonPlan.number_of_days} Sessions -{" "}
                {lessonPlan.class_duration} Minutes Each
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Sessions</h2>
              <div className="space-y-2">
                {lessonPlan.plan_data.days.map((day) => (
                  <div
                    key={`session-${day.day}`}
                    className="border rounded-md p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setActiveTab(`day-${day.day}`)}
                  >
                    <div className="flex">
                      <div className="w-1 bg-rose-500 mr-4"></div>
                      <div>
                        <span className="font-medium">Session {day.day}</span>:{" "}
                        {day.topicHeading}
                      </div>
                    </div>
                  </div>
                ))}
                <div
                  className="border rounded-md p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setActiveTab("assessment")}
                >
                  <div className="flex">
                    <div className="w-1 bg-rose-500 mr-4"></div>
                    <div>
                      <span className="font-medium">Assessment Plan</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              {activeTab.startsWith("day-") &&
                renderDayContent(
                  lessonPlan.plan_data.days[
                    Number.parseInt(activeTab.split("-")[1]) - 1
                  ]
                )}
              {activeTab === "assessment" && renderAssessmentPlan()}
            </div>

            <div className="mt-6 flex gap-4">
              {userRole !== "Student" && (
                <Button onClick={handleChatWithBuddyNoArgs} variant="default">
                  Chat with Buddy
                </Button>
              )}
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              {userRole !== "Student" && renderAssignButton()}
            </div>

            {/* Add the new form here */}
            <form onSubmit={handleRedirectToBuddy} className="mt-4 flex gap-2">
              <input
                type="text"
                value={buddyInput}
                onChange={(e) => setBuddyInput(e.target.value)}
                placeholder="Enter your question for buddy..."
                className="flex-1 px-4 py-2 border rounded-md"
              />
              <Button type="submit" variant="default">
                Ask Buddy
              </Button>
            </form>
          </>
        )}

        {generateNotesDialog.activity && (
          <GenerateNotesDialog
            isOpen={generateNotesDialog.isOpen}
            onClose={() =>
              setGenerateNotesDialog({ isOpen: false, activity: null })
            }
            activity={generateNotesDialog.activity}
            storedNotes={
              generatedNotes[generateNotesDialog.activity.title] || null
            }
            onNotesGenerated={handleNotesGenerated}
          />
        )}
        {editContent.isOpen && (
          <EditLessonContent
            isOpen={editContent.isOpen}
            onClose={() => setEditContent({ ...editContent, isOpen: false })}
            onSave={handleSave}
            content={editContent}
            lessonPlanId={lessonPlan.id}
          />
        )}
      </div>
    </div>
  );
}
