"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingSpinner } from "./loading-spinner";
import { SavedStudyPlans } from "./saved-study-plans";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStudyPlans } from "../contexts/StudyPlanContext";
import { PdfDownloadButton } from "./pdf-download-button";
import { createClient } from "@/utils/supabase/client";

interface StudyPlanInput {
  grade: string;
  board: string;
  subject: string;
  syllabus: string;
  learningGoal: string;
  areasOfImprovement: string;
  availableDays: string;
  availableStudyTimePerDay: string;
}

interface StudyPlanDay {
  day: number;
  focusAreas: { topic: string; objective: string }[];
  activities: { action: string; suggestion: string }[];
}

interface StudyPlanResponse {
  metadata: {
    grade: string;
    board: string;
    subject: string;
    learningGoal: string;
    availableDays: string;
    availableStudyTimePerDay: string;
  };
  studyPlan: StudyPlanDay[];
}

export function AIStudyPlanner() {
  const [input, setInput] = useState<StudyPlanInput>({
    grade: "",
    board: "",
    subject: "",
    syllabus: "",
    learningGoal: "",
    areasOfImprovement: "",
    availableDays: "",
    availableStudyTimePerDay: "",
  });
  const [studyPlan, setStudyPlan] = useState<StudyPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addStudyPlan } = useStudyPlans();

  // Auto-scroll to generated plan when available
  useEffect(() => {
    if (studyPlan) {
      setTimeout(() => {
        document.getElementById("generatedPlan")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [studyPlan]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setInput((prev) => ({ ...prev, [name]: value }));
  };

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setStudyPlan(null);

    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        const response = await fetch("/api/generate-study-plan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });

        const data = await response.json();

        if (response.ok) {
          setStudyPlan(data);

          // Get the current user email from Supabase
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          const userEmail = user?.email || "";

          // Save study plan to Supabase with user_email
          const saveResponse = await fetch("/api/save-study-plan", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              grade: input.grade,
              board: input.board,
              subject: input.subject,
              syllabus: input.syllabus,
              learning_goal: input.learningGoal,
              areas_of_improvement: input.areasOfImprovement,
              available_days: Number.parseInt(input.availableDays),
              available_study_time: Number.parseFloat(
                input.availableStudyTimePerDay
              ),
              studyPlan: data.studyPlan,
              user_email: userEmail  // include the user email
            }),
          });

          const saveData = await saveResponse.json();

          if (!saveResponse.ok) {
            throw new Error(saveData.error || "Failed to save study plan");
          }

          // Add the new study plan to the list of saved plans
          addStudyPlan({
            id: saveData.data[0].id,
            grade: input.grade,
            board: input.board,
            subject: input.subject,
            learning_goal: input.learningGoal,
            created_at: new Date().toISOString(),
          });

          setIsLoading(false);
          return; // Success, exit the retry loop
        } else {
          throw new Error(data.error || "Failed to generate study plan");
        }
      } catch (err: any) {
        console.error(
          `Error generating study plan (attempt ${retries + 1}):`,
          err
        );
        retries++;
        if (retries >= MAX_RETRIES) {
          setError(
            `An error occurred: ${err.message}. Please try again or contact support if the issue persists.`
          );
          setIsLoading(false);
          return; // Max retries reached, exit the retry loop
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Tabs defaultValue="create">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create New Plan</TabsTrigger>
          <TabsTrigger value="saved">Saved Plans</TabsTrigger>
        </TabsList>
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Study Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="grade">Grade</Label>
                    <Select
                      value={input.grade}
                      onValueChange={handleSelectChange("grade")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(12)].map((_, i) => (
                          <SelectItem key={i} value={`${i + 1}`}>
                            Grade {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="board">Board</Label>
                    <Input
                      id="board"
                      name="board"
                      value={input.board}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={input.subject}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="syllabus">Syllabus/Topics</Label>
                  <Textarea
                    id="syllabus"
                    name="syllabus"
                    value={input.syllabus}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="learningGoal">Learning Goal</Label>
                  <Textarea
                    id="learningGoal"
                    name="learningGoal"
                    value={input.learningGoal}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="areasOfImprovement">
                    Areas of Improvement
                  </Label>
                  <Textarea
                    id="areasOfImprovement"
                    name="areasOfImprovement"
                    value={input.areasOfImprovement}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="availableDays">
                      Number of Days Available
                    </Label>
                    <Input
                      id="availableDays"
                      name="availableDays"
                      type="number"
                      min="1"
                      max="30"
                      value={input.availableDays}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="availableStudyTimePerDay">
                      Available Study Time per Day (hours)
                    </Label>
                    <Input
                      id="availableStudyTimePerDay"
                      name="availableStudyTimePerDay"
                      type="number"
                      min="0.5"
                      max="12"
                      step="0.5"
                      value={input.availableStudyTimePerDay}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <LoadingSpinner />
                      Generating Plan...
                    </span>
                  ) : (
                    "Generate Study Plan"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {studyPlan && (
            <div id="generatedPlan">
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Your Personalized Study Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">Plan Overview</h3>
                        <p>
                          <strong>Subject:</strong> {studyPlan.metadata.subject}
                        </p>
                        <p>
                          <strong>Grade:</strong> {studyPlan.metadata.grade}
                        </p>
                        <p>
                          <strong>Board:</strong> {studyPlan.metadata.board}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Study Details</h3>
                        <p>
                          <strong>Duration:</strong>{" "}
                          {studyPlan.metadata.availableDays} days
                        </p>
                        <p>
                          <strong>Daily Study Time:</strong>{" "}
                          {studyPlan.metadata.availableStudyTimePerDay} hours
                        </p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Learning Goal</h3>
                      <p>{studyPlan.metadata.learningGoal}</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2">
                              Day
                            </th>
                            <th className="border border-gray-300 px-4 py-2">
                              Focus Areas
                            </th>
                            <th className="border border-gray-300 px-4 py-2">
                              Activities
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {studyPlan.studyPlan.map((day) => (
                            <tr key={day.day}>
                              <td className="border border-gray-300 px-4 py-2 font-medium">
                                {day.day}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {day.focusAreas.length === 1 ? (
                                  <p>
                                    <strong>{day.focusAreas[0].topic}:</strong>{" "}
                                    {day.focusAreas[0].objective}
                                  </p>
                                ) : (
                                  <ul className="list-disc pl-5">
                                    {day.focusAreas.map((area, index) => (
                                      <li key={index}>
                                        <strong>{area.topic}:</strong>{" "}
                                        {area.objective}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {day.activities.length === 1 ? (
                                  <p>
                                    <strong>{day.activities[0].action}:</strong>{" "}
                                    {day.activities[0].suggestion}
                                  </p>
                                ) : (
                                  <ul className="list-disc pl-5">
                                    {day.activities.map((activity, index) => (
                                      <li key={index}>
                                        <strong>{activity.action}:</strong>{" "}
                                        {activity.suggestion}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <PdfDownloadButton plan={studyPlan} />
            </div>
          )}
        </TabsContent>
        <TabsContent value="saved">
          <SavedStudyPlans />
        </TabsContent>
      </Tabs>
    </div>
  );
}
