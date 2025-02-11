"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

interface StudyPlan {
  id: string;
  grade: string;
  board: string;
  subject: string;
  learning_goal: string;
  created_at: string;
}

interface StudyPlanContextType {
  studyPlans: StudyPlan[];
  addStudyPlan: (plan: StudyPlan) => void;
  isLoading: boolean;
  error: string | null;
}

const StudyPlanContext = createContext<StudyPlanContextType | undefined>(
  undefined
);

export function StudyPlanProvider({ children }: { children: React.ReactNode }) {
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        setUserEmail(user.email);
        await fetchStudyPlans(user.email);
        // Subscribe to new inserts and update only if user_email matches
        const channel = supabase
          .channel("study_plans_changes")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "study_plans" },
            (payload) => {
              if (payload.new.user_email === user.email) {
                setStudyPlans((currentPlans) => [payload.new as StudyPlan, ...currentPlans]);
              }
            }
          )
          .subscribe();
        return () => {
          supabase.removeChannel(channel);
        };
      } else {
        setError("User not authenticated");
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const fetchStudyPlans = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from("study_plans")
        .select("*")
        .eq("user_email", email)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setStudyPlans(data);
    } catch (err: any) {
      console.error("Error fetching study plans:", err);
      setError(`An error occurred while fetching study plans: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addStudyPlan = (plan: StudyPlan) => {
    setStudyPlans((currentPlans) => [plan, ...currentPlans]);
  };

  return (
    <StudyPlanContext.Provider
      value={{ studyPlans, addStudyPlan, isLoading, error }}
    >
      {children}
    </StudyPlanContext.Provider>
  );
}

export function useStudyPlans() {
  const context = useContext(StudyPlanContext);
  if (context === undefined) {
    throw new Error("useStudyPlans must be used within a StudyPlanProvider");
  }
  return context;
}
