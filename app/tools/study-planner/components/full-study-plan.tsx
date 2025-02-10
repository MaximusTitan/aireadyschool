"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingSpinner } from "./loading-spinner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

interface StudyPlanDay {
  day: number;
  focusAreas: { topic: string; objective: string }[];
  activities: { action: string; suggestion: string }[];
}

interface FullStudyPlan {
  id: string;
  grade: string;
  board: string;
  subject: string;
  syllabus: string;
  learning_goal: string;
  areas_of_improvement: string;
  available_days: number;
  available_study_time: number;
  Day: string;
  "Focus Areas": string;
  Activities: string;
  created_at: string;
}

interface FullStudyPlanProps {
  planId: string;
  onClose: () => void;
}

export function FullStudyPlan({ planId, onClose }: FullStudyPlanProps) {
  const [studyPlan, setStudyPlan] = useState<FullStudyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudyPlan();
  }, []); // Removed planId from dependencies

  const fetchStudyPlan = async () => {
    try {
      const { data, error } = await supabase
        .from("study_plans")
        .select("*")
        .eq("id", planId)
        .single();
      if (error) throw error;

      setStudyPlan(data);
    } catch (err: any) {
      console.error("Error fetching study plan:", err);
      setError(
        `An error occurred while fetching the study plan: ${err.message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!studyPlan) {
    return (
      <Alert>
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>
          The requested study plan could not be found.
        </AlertDescription>
      </Alert>
    );
  }

  const days: StudyPlanDay[] = JSON.parse(studyPlan.Day).map(
    (day: number, index: number) => ({
      day,
      focusAreas: JSON.parse(studyPlan["Focus Areas"])[index],
      activities: JSON.parse(studyPlan.Activities)[index],
    })
  );

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Full Study Plan: {studyPlan.subject}</span>
          <Button onClick={onClose}>Close</Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold">Plan Overview</h3>
              <p>
                <strong>Subject:</strong> {studyPlan.subject}
              </p>
              <p>
                <strong>Grade:</strong> {studyPlan.grade}
              </p>
              <p>
                <strong>Board:</strong> {studyPlan.board}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Study Details</h3>
              <p>
                <strong>Duration:</strong> {studyPlan.available_days} days
              </p>
              <p>
                <strong>Daily Study Time:</strong>{" "}
                {studyPlan.available_study_time} hours
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Learning Goal</h3>
            <p>{studyPlan.learning_goal}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Areas of Improvement</h3>
            <p>{studyPlan.areas_of_improvement}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Syllabus</h3>
            <p>{studyPlan.syllabus}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2">Day</th>
                  <th className="border border-gray-300 px-4 py-2">
                    Focus Areas
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Activities
                  </th>
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <tr key={day.day}>
                    <td className="border border-gray-300 px-4 py-2 font-medium">
                      {day.day}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <ul className="list-disc pl-5">
                        {day.focusAreas.map((area, index) => (
                          <li key={index}>
                            <strong>{area.topic}:</strong> {area.objective}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <ul className="list-disc pl-5">
                        {day.activities.map((activity, index) => (
                          <li key={index}>
                            <strong>{activity.action}:</strong>{" "}
                            {activity.suggestion}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
