"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight } from "lucide-react";
import type { StudentData } from "../lib/types";
import type { AIAnalysis } from "../lib/ai-schema";
import { formatDate } from "../lib/utils";

interface ScoreOverviewProps {
  studentData: StudentData;
  aiAnalysis: AIAnalysis;
}

export function ScoreOverview({ studentData, aiAnalysis }: ScoreOverviewProps) {
  const { baseline, final } = studentData;
  const improvement = aiAnalysis.overallImprovement;

  return (
    <Card className="bg-white border-0 shadow-md overflow-hidden">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3">
          <div className="p-6 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-gray-100">
            <h3 className="text-lg font-medium text-gray-500 mb-1">
              Baseline Score
            </h3>
            <div className="text-4xl font-bold">
              {(baseline.overallScore * 100).toFixed(0)}%
            </div>
            <div className="mt-3 w-full max-w-[180px]">
              <Progress
                value={baseline.overallScore * 100}
                className="h-3 bg-gray-100"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Assessed on {formatDate(baseline.date)}
            </p>
          </div>

          <div
            className={`p-6 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-gray-100 ${
              improvement >= 0 ? "bg-green-50" : "bg-rose-50"
            }`}
          >
            <h3
              className={`text-lg font-medium mb-1 ${
                improvement >= 0 ? "text-green-700" : "text-rose-700"
              }`}
            >
              Improvement
            </h3>
            <div className="flex items-center">
              <ArrowUpRight
                className={`h-8 w-8 mr-1 ${
                  improvement >= 0 ? "text-green-500" : "text-rose-500"
                }`}
              />
              <div
                className={`text-5xl font-bold ${
                  improvement >= 0 ? "text-green-500" : "text-rose-500"
                }`}
              >
                {improvement.toFixed(1)}%
              </div>
            </div>
            <div className="flex flex-col items-center mt-2">
              <p
                className={`text-sm font-medium ${
                  improvement >= 0 ? "text-green-700" : "text-rose-700"
                }`}
              >
                Student: {studentData.name}
              </p>
              <p
                className={`text-xs ${
                  improvement >= 0 ? "text-green-600" : "text-rose-600"
                }`}
              >
                {studentData.email}
              </p>
            </div>
          </div>

          <div className="p-6 flex flex-col justify-center items-center">
            <h3 className="text-lg font-medium text-gray-500 mb-1">
              Final Score
            </h3>
            <div className="text-4xl font-bold">
              {(final.overallScore * 100).toFixed(0)}%
            </div>
            <div className="mt-3 w-full max-w-[180px]">
              <Progress value={final.overallScore * 100} className="h-3" />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Assessed on {formatDate(final.date)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
