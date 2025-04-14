"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/utils/supabase/client";
import {
  LessonPlan,
  UploadedFile,
  GeneratedNotes,
  Day,
  ScheduleItem,
} from "../types/index";
import { SessionNavigator } from "../components/session-navigator";
import { LessonContent } from "../components/lesson-content";
import { AssessmentPlanView } from "../components/assessment-plan";
import DocumentGenerator from "../../document-generator/DocumentGeneratorComponent";
import { X } from "lucide-react";

const supabase = createClient();

export default function StudentOutputContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("day-1");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{
    [key: string]: UploadedFile[];
  }>({});
  const [generatedNotes, setGeneratedNotes] = useState<GeneratedNotes>({});
  const [buddyInput, setBuddyInput] = useState("");
  const [showDocumentGenerator, setShowDocumentGenerator] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [documentSubmitted, setDocumentSubmitted] = useState(false);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuthentication = async () => {
      setIsAuthLoading(true);
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
        if (role !== "Student") {
          setIsAuthorized(false);
          router.push("/sign-in");
          return;
        }

        setUserRole(role || null);
        setUserEmail(user.email || null);
        setIsAuthorized(true);
      } catch (error) {
        console.error("Authentication check failed:", error);
        setIsAuthorized(false);
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuthentication();
  }, [router]);

  const fetchLessonPlan = useCallback(async () => {
    if (!id) {
      setError("No lesson plan ID provided");
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

      // Fetch generated notes
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

      // Fetch uploaded files
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
    } catch (error) {
      console.error("Error fetching lesson plan data:", error);
      setError("Failed to fetch lesson plan data. Please try again.");
    }
  }, [id]);

  useEffect(() => {
    if (isAuthorized && id) {
      fetchLessonPlan();
    }
  }, [isAuthorized, id, fetchLessonPlan]);

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
        .eq("user_email", userEmail)
        .single();

      if (error) {
        // If we can't find a student-specific assessment, try to get the original assessment
        const { data: originalData, error: originalError } = await supabase
          .from("assessments")
          .select("*")
          .eq("id", assessmentId)
          .single();

        if (originalError) throw originalError;

        setAssessmentData({
          ...originalData,
          completed: false,
        });
      } else {
        setAssessmentData({
          ...data,
          completed: !!data.submitted,
          student_answers: data.answers || [],
        });
      }
    } catch (error) {
      console.error("Error fetching assessment data:", error);
    }
  };

  const handleChatWithBuddy = (
    item: ScheduleItem,
    day: Day,
    notes?: string
  ) => {
    if (lessonPlan) {
      const encodedNotes = notes ? encodeURIComponent(notes) : "";
      // Gather materials for the current day based on section IDs starting with "material-{day.day}-"
      const materials = Object.entries(uploadedFiles)
        .filter(([sectionId]) => sectionId.startsWith(`material-${day.day}-`))
        .flatMap(([, files]) => files)
        .map((file) => ({ id: file.id, name: file.name, url: file.url }));
      const encodedMaterials = encodeURIComponent(JSON.stringify(materials));
      // Append both assistantMessage (notes) and materials parameters to the URL
      router.push(
        `/tools/gen-chat?thread=new&teachingMode=true&assistantMessage=${encodedNotes}&materials=${encodedMaterials}`
      );
    }
  };

  const handleRedirectToBuddy = (e: React.FormEvent) => {
    e.preventDefault();
    if (lessonPlan) {
      router.push(
        `/tools/gen-chat?thread=new&teachingMode=false&userInput=${encodeURIComponent(
          buddyInput
        )}`
      );
    }
  };

  const handleDocumentSave = async (newDocId: string) => {
    if (!lessonPlan || !activeTab.startsWith("day-")) return;

    const dayIndex = parseInt(activeTab.split("-")[1]) - 1;
    const updatedPlanData = { ...lessonPlan.plan_data };
    updatedPlanData.days[dayIndex].assignment.document_id = newDocId;

    try {
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

      toast({
        title: "Success",
        description: "Assignment progress saved",
        variant: "default",
      });
    } catch (error) {
      console.error("Error saving document reference:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save assignment progress",
      });
    }
  };

  const handleDocumentSubmit = async (docId: string) => {
    try {
      const { error } = await supabase
        .from("document_generator")
        .update({ submitted: true })
        .eq("id", docId);

      if (error) throw error;

      setDocumentSubmitted(true);
      toast({
        title: "Success",
        description: "Assignment submitted successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error submitting document:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit assignment",
      });
    }
  };

  if (isAuthLoading) {
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
            className="mb-6 hover:scale-105 transition-transform"
            onClick={() => router.push("/tools/lesson-planner")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Lessons
          </Button>

          <div className="mb-8 bg-white p-6 rounded-lg shadow-sm border">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {lessonPlan.chapter_topic}
            </h1>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="px-3 py-1 bg-blue-100 rounded-full">
                Grade {lessonPlan.grade}
              </span>
              <span className="px-3 py-1 bg-green-100 rounded-full">
                {lessonPlan.board}
              </span>
              <span className="px-3 py-1 bg-purple-100 rounded-full">
                {lessonPlan.number_of_days} Sessions (
                {lessonPlan.class_duration} mins each)
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">Your Progress</h3>
              <span className="text-sm text-gray-600">
                Session {activeTab.split("-")[1]} of {lessonPlan.number_of_days}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    (parseInt(activeTab.split("-")[1]) /
                      lessonPlan.number_of_days) *
                    100
                  }%`,
                }}
              ></div>
            </div>
          </div>

          <SessionNavigator
            days={lessonPlan.plan_data.days}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {activeTab.startsWith("day-") ? (
          <div
            className={`${
              showDocumentGenerator ? "flex gap-6 px-4" : "mx-auto max-w-7xl"
            }`}
          >
            <div
              className={`${
                showDocumentGenerator ? "flex-1 w-1/2" : "w-full"
              } bg-white rounded-lg border p-6 shadow-sm`}
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
                onEdit={() => {}}
                onGenerateNotes={() => {}}
                onFileUpload={async () => {}}
                onDeleteFile={async () => {}}
                onChatWithBuddy={handleChatWithBuddy}
                showDocumentGenerator={showDocumentGenerator}
                setShowDocumentGenerator={setShowDocumentGenerator}
                assessmentData={assessmentData}
              />
            </div>

            {showDocumentGenerator && userRole === "Student" && (
              <div className="flex-1 w-1/2 bg-white rounded-lg border p-6 relative shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => setShowDocumentGenerator(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <DocumentGenerator
                  initialContent={
                    lessonPlan.plan_data.days[
                      Number.parseInt(activeTab.split("-")[1]) - 1
                    ].assignment?.document_id
                      ? ""
                      : lessonPlan.plan_data.days[
                          Number.parseInt(activeTab.split("-")[1]) - 1
                        ].assignment?.description || ""
                  }
                  initialTitle={`${
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
                  onDocumentSave={handleDocumentSave}
                  onDocumentSubmit={handleDocumentSubmit}
                  submitted={documentSubmitted}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto max-w-7xl">
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <AssessmentPlanView
                assessmentPlan={lessonPlan.plan_data.assessmentPlan}
                userRole={userRole}
                uploadedFiles={uploadedFiles}
                onEdit={() => {}}
                onFileUpload={async () => {}}
                onDeleteFile={async () => {}}
              />
            </div>
          </div>
        )}

        {/* Improved Buddy Chat */}
        <div className="mx-auto max-w-7xl">
          <div className="mt-6 bg-white rounded-lg border p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span role="img" aria-label="robot">
                🤖
              </span>{" "}
              Ask Your Study Buddy
            </h3>
            <form onSubmit={handleRedirectToBuddy} className="flex gap-2">
              <input
                type="text"
                value={buddyInput}
                onChange={(e) => setBuddyInput(e.target.value)}
                placeholder="What would you like to learn more about?"
                className="flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Button
                type="submit"
                variant="default"
                className="hover:scale-105 transition-transform flex items-center gap-2"
              >
                <span role="img" aria-label="speech">
                  💭
                </span>
                Ask Buddy
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
