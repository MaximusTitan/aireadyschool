"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight, BrainCircuit, CheckCircle2, Target } from "lucide-react";
import type { StudentData } from "../lib/types";
import type { AIAnalysis } from "../lib/ai-schema";
import { formatDate } from "../lib/utils";

interface OverviewMetricsProps {
  studentData: StudentData;
  aiAnalysis: AIAnalysis;
}

export function OverviewMetrics({
  studentData,
  aiAnalysis,
}: OverviewMetricsProps) {
  const { baseline, final } = studentData;

  // Calculate improvement metrics
  const scoreImprovement = final.overallScore - baseline.overallScore;
  const accuracyImprovement = final.accuracy - baseline.accuracy;
  const confidenceImprovement =
    aiAnalysis.learningPatterns.confidenceMetrics.confidenceGrowth / 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Assessment Dates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Baseline Assessment</p>
                <p className="text-lg">{formatDate(baseline.date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Final Assessment</p>
                <p className="text-lg">{formatDate(final.date)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {(final.overallScore * 100).toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Baseline: {(baseline.overallScore * 100).toFixed(0)}%
                </p>
              </div>
              <div className="flex items-center space-x-1 rounded-md bg-rose-100 px-2 py-1 text-xs font-medium text-rose-500">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>+{(scoreImprovement * 100).toFixed(0)}%</span>
              </div>
            </div>
            <Progress className="mt-3" value={final.overallScore * 100} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {(final.accuracy * 100).toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Baseline: {(baseline.accuracy * 100).toFixed(0)}%
                </p>
              </div>
              <div className="flex items-center space-x-1 rounded-md bg-rose-100 px-2 py-1 text-xs font-medium text-rose-500">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>+{(accuracyImprovement * 100).toFixed(0)}%</span>
              </div>
            </div>
            <Progress className="mt-3" value={final.accuracy * 100} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Confidence Level
            </CardTitle>
            <BrainCircuit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {aiAnalysis.learningPatterns.confidenceMetrics.finalConfidence.toFixed(
                    0
                  )}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  Baseline:{" "}
                  {aiAnalysis.learningPatterns.confidenceMetrics.baselineConfidence.toFixed(
                    0
                  )}
                  %
                </p>
              </div>
              <div className="flex items-center space-x-1 rounded-md bg-rose-100 px-2 py-1 text-xs font-medium text-rose-500">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>
                  +
                  {aiAnalysis.learningPatterns.confidenceMetrics.confidenceGrowth.toFixed(
                    1
                  )}
                  %
                </span>
              </div>
            </div>
            <Progress
              className="mt-3"
              value={
                aiAnalysis.learningPatterns.confidenceMetrics.finalConfidence
              }
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Knowledge Gaps</CardTitle>
            <CardDescription>Areas that need improvement</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1">
              {aiAnalysis.topicComparison.recommendedFocusAreas.map(
                (gap, index) => (
                  <li key={index} className="text-sm">
                    {gap}
                  </li>
                )
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Strength Areas</CardTitle>
            <CardDescription>Areas of strong understanding</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1">
              {aiAnalysis.topicComparison.strengthAreas.map(
                (strength, index) => (
                  <li key={index} className="text-sm">
                    {strength}
                  </li>
                )
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
