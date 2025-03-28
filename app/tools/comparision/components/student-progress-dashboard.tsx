"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { OverviewMetrics } from "../components/overview-metrics";
import { TopicComparison } from "../components/topic-comparison";
import { AIAnalysisDashboard } from "../components/ai-analysis-dashboard";
import { ScoreOverview } from "../components/score-overview";
import type { StudentData } from "../lib/types";
import type { AIAnalysis } from "../lib/ai-schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Brain } from "lucide-react";
import { LoadingDashboard } from "../components/loading-dashboard";
interface StudentProgressDashboardProps {
  studentsData: StudentData[];
}

export function StudentProgressDashboard({
  studentsData,
}: StudentProgressDashboardProps) {
  const [selectedStudent, setSelectedStudent] = useState(
    studentsData[0]?.id || ""
  );
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentStudent = studentsData.find(
    (student) => student.id === selectedStudent
  );

  // Fetch AI analysis whenever the selected student changes
  useEffect(() => {
    if (!currentStudent) return;

    const fetchAnalysis = async () => {
      setIsLoadingAI(true);
      setError(null);

      try {
        const response = await fetch("/api/analyze-assessments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ studentEmail: currentStudent.email }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to analyze assessments");
        }

        const data = await response.json();
        setAiAnalysis(data.analysis);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error fetching AI analysis:", err);
      } finally {
        setIsLoadingAI(false);
      }
    };

    fetchAnalysis();
  }, [currentStudent]);

  const handleToggleAIInsights = () => {
    setShowAIInsights(!showAIInsights);
  };

  if (studentsData.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No data available</AlertTitle>
        <AlertDescription>
          No students with both baseline and final assessments found. Students
          need both a baseline and final assessment marked in the database to
          show progress.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Card className="w-full sm:w-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Student Selection</CardTitle>
            <CardDescription>
              View assessment progress by student
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select
                value={selectedStudent}
                onValueChange={(value) => {
                  setSelectedStudent(value);
                  setAiAnalysis(null);
                  setShowAIInsights(false);
                }}
                defaultValue={studentsData[0]?.id}
              >
                <SelectTrigger className="w-full sm:w-[240px]">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {studentsData.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleToggleAIInsights}
                disabled={isLoadingAI || !currentStudent || !aiAnalysis}
                className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700"
              >
                <Brain className="mr-2 h-4 w-4" />
                {showAIInsights ? "Show Standard View" : "Show AI Insights"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {currentStudent && (
        <>
          {currentStudent && aiAnalysis && (
            <ScoreOverview
              studentData={currentStudent}
              aiAnalysis={aiAnalysis}
            />
          )}

          {isLoadingAI ? (
            <div className="mt-8">
              <Card className="mb-4">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
                    <p className="text-lg font-medium">
                      Processing assessment data with AI...
                    </p>
                  </div>
                </CardContent>
              </Card>
              <LoadingDashboard />
            </div>
          ) : error ? (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error processing data</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : aiAnalysis ? (
            showAIInsights ? (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">AI-Powered Insights</h2>
                </div>
                <AIAnalysisDashboard aiAnalysis={aiAnalysis} />
              </div>
            ) : (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-rose-100">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="topics">Topics</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-6">
                  <OverviewMetrics
                    studentData={currentStudent}
                    aiAnalysis={aiAnalysis}
                  />
                </TabsContent>
                <TabsContent value="topics" className="mt-6">
                  <TopicComparison
                    studentData={currentStudent}
                    aiAnalysis={aiAnalysis}
                  />
                </TabsContent>
              </Tabs>
            )
          ) : null}
        </>
      )}
    </div>
  );
}
