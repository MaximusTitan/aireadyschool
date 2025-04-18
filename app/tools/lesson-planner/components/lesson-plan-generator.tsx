"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

interface LessonPlan {
  id: string;
  subject?: string | null;  // Make optional and nullable
  chapter_topic: string;
  grade?: string | null;    // Make optional and nullable
  board?: string | null;    // Make optional and nullable
  created_at: string;
}

const subjectIcons: { [key: string]: string } = {
  Mathematics: "📐",
  Science: "🔬",
  English: "📚",
  History: "🏛️",
  Geography: "🌍",
  Physics: "⚡",
  Chemistry: "🧪",
  Biology: "🧬",
  Social: "👥",
  default: "📖",
};

export default function LessonPlanGenerator() {
  const router = useRouter();
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Main function to get user and fetch plans
    async function initializeData() {
      try {
        setIsLoading(true);

        // Get the current session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session?.user) {
          // Set email and role
          setUserEmail(session.user.email || null);
          setUserRole(session.user.user_metadata?.role || null);

          // Then fetch plans
          await fetchLessonPlans(session.user.email || null);
        } else {
          console.log("No authenticated user found");
          setLessonPlans([]);
        }
      } catch (error) {
        console.error("Error during initialization:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    // Initialize immediately on component mount
    initializeData();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      const email = session?.user?.email || null;

      // Only update if email has changed
      if (email !== userEmail) {
        setUserEmail(email);

        if (email) {
          fetchLessonPlans(email);
        } else {
          setLessonPlans([]);
        }
      }
    });

    // Clean up all subscriptions
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Removed userEmail from the dependency array

  const fetchLessonPlans = async (email: string | null) => {
    if (!email) {
      console.warn("Cannot fetch lesson plans: No email provided");
      return;
    }

    try {
      console.log("Fetching lesson plans for:", email);

      const { data, error } = await supabase
        .from("lesson_plans")
        .select("*")
        .eq("user_email", email)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching lesson plans:", error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log(`Successfully fetched ${data.length} lesson plans`);
        setLessonPlans(data);
      } else {
        console.log("No lesson plans found for this user");
        setLessonPlans([]);
      }
    } catch (error) {
      console.error("Error fetching lesson plans:", error);
      // Don't change state on error, keep previous data
    }
  };

  const handleDelete = async (id: string) => {
    if (!userEmail) return;

    try {
      // First verify the lesson plan belongs to the current user
      const { data: lessonPlan } = await supabase
        .from("lesson_plans")
        .select("user_email")
        .eq("id", id)
        .single();

      if (!lessonPlan || lessonPlan.user_email !== userEmail) {
        throw new Error("You don't have permission to delete this lesson plan");
      }

      const { error } = await supabase
        .from("lesson_plans")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await fetchLessonPlans(userEmail);
    } catch (error) {
      console.error("Error deleting lesson plan:", error);
    }
  };

  const handleViewPlan = (planId: string) => {
    const route =
      userRole === "Student"
        ? `/tools/lesson-planner/student-output?id=${planId}`
        : `/tools/lesson-planner/output?id=${planId}`;
    router.push(route);
  };

  const getSubjectIcon = (subject: string | null) => {
    if (!subject) return subjectIcons["default"];
    
    const normalizedSubject = Object.keys(subjectIcons).find((key) =>
      subject.toLowerCase().includes(key.toLowerCase())
    );
    return subjectIcons[normalizedSubject || "default"];
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-backgroundApp">
      <div className="mb-8 max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Lesson Plan Generator
        </h1>
        <p className="text-gray-600 mb-4">
          Generates structured lesson content to aid educators in preparing
          teaching materials.
        </p>
        <Button
          onClick={() => router.push("/tools/lesson-planner/create")}
          className="bg-rose-600 hover:bg-rose-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> New Lesson Plan
        </Button>
      </div>

      <div className="mb-6 max-w-6xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Your Lesson Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessonPlans.map((plan) => (
            <Card
              key={plan.id}
              className="hover:shadow-md transition-shadow border border-gray-200"
            >
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <span className="text-2xl">
                        {getSubjectIcon(plan.subject || null)}
                      </span>
                      {plan.subject && <span className="font-medium">{plan.subject}</span>}
                    </div>
                    <h3 className="font-semibold text-base mb-1 text-gray-900 line-clamp-1">
                      {plan.chapter_topic}
                    </h3>
                    <div className="flex justify-between items-center">
                      {plan.grade && (
                        <span className="text-gray-600 text-sm font-medium">
                          Grade {plan.grade}
                        </span>
                      )}
                      <span className="text-gray-500 text-xs">
                        {format(new Date(plan.created_at), "dd-MMM-yy")}
                      </span>
                    </div>
                    {plan.board && (
                      <div className="text-gray-500 text-xs mt-1">
                        {plan.board}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3 justify-end border-t pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-gray-600 hover:text-gray-700 border-gray-200 hover:border-gray-300"
                    onClick={() => handleViewPlan(plan.id)}
                  >
                    <BookOpen className="h-3 w-3 mr-1" />
                    View Plan
                  </Button>
                  {userRole !== "Student" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      onClick={() => handleDelete(plan.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-rose-500 rounded-full animate-spin"></div>
          </div>
        )}

        {!isLoading && lessonPlans.length === 0 && (
          <Card className="p-6 text-center text-gray-500">
            <p>No lesson plans found. Create your first lesson plan!</p>
          </Card>
        )}
      </div>
    </div>
  );
}
