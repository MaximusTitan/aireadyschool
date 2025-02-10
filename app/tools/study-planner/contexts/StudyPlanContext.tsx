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

  useEffect(() => {
    fetchStudyPlans();

    const channel = supabase
      .channel("study_plans_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "study_plans" },
        (payload) => {
          setStudyPlans((currentPlans) => [
            payload.new as StudyPlan,
            ...currentPlans,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStudyPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("study_plans")
        .select("*")
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
