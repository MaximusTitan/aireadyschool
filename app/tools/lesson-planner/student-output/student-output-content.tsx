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
} from "../types";
import { SessionNavigator } from "../components/session-navigator";
import { LessonContent } from "../components/lesson-content";
import { AssessmentPlanView } from "../components/assessment-plan";
import DocumentGenerator from "../../document-generator/DocumentGeneratorComponent";

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

  const handleChatWithBuddy = (item: ScheduleItem, day: Day) => {
    if (lessonPlan) {
      const scheduleData = {
        day: day.day,
        topicHeading: day.topicHeading,
        schedule: item,
        learningOutcomes: day.learningOutcomes,
      };

      router.push(
        `/tools/gen-chat?thread=new&teachingMode=true&lessonPlanId=${lessonPlan.id}&scheduleData=${encodeURIComponent(
          JSON.stringify(scheduleData)
        )}`
      );
    }
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
      <div className=" mx-auto px-4 py-8">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => router.push("/tools/lesson-planner")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Lesson Plan: {lessonPlan.chapter_topic}
          </h1>
          <p className="text-gray-600 mt-2">
            {lessonPlan.grade} Grade | {lessonPlan.board} |{" "}
            {lessonPlan.number_of_days} Sessions - {lessonPlan.class_duration}{" "}
            Minutes Each
          </p>
        </div>

        <SessionNavigator
          days={lessonPlan.plan_data.days}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {activeTab.startsWith("day-") ? (
          <div className="flex gap-6">
            <div className="flex-1 bg-white rounded-lg border p-6">
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
              />
            </div>

            {showDocumentGenerator && userRole === "Student" && (
              <div className="flex-1 bg-white rounded-lg border p-6">
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
                />
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border p-6">
            <AssessmentPlanView
              assessmentPlan={lessonPlan.plan_data.assessmentPlan}
              userRole={userRole}
              uploadedFiles={uploadedFiles}
              onEdit={() => {}}
              onFileUpload={async () => {}}
              onDeleteFile={async () => {}}
            />
          </div>
        )}

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
      </div>
    </div>
  );
}
