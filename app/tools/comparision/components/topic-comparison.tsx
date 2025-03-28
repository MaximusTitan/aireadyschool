"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StudentData } from "../lib/types";
import type { AIAnalysis } from "../lib/ai-schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TopicComparisonProps {
  studentData: StudentData;
  aiAnalysis: AIAnalysis;
}

export function TopicComparison({
  studentData,
  aiAnalysis,
}: TopicComparisonProps) {
  // Use AI-processed topic data instead of raw data
  const topics = aiAnalysis.topicComparison.topics;

  // Prepare data for the chart
  const chartData = topics.map((topic) => ({
    name: topic.name,
    baseline: topic.baselineScore,
    final: topic.finalScore,
    improvement: topic.improvement,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Topic Performance Comparison</CardTitle>
          <CardDescription>
            Comparing baseline and final assessment scores across all topics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis unit="%" />
                <Tooltip
                  formatter={(value: number | string) => {
                    const num =
                      typeof value === "number"
                        ? value
                        : parseFloat(String(value));
                    return [`${isNaN(num) ? value : num.toFixed(1)}%`, ""];
                  }}
                  labelFormatter={(label) => `Topic: ${label}`}
                />
                <Legend />
                <Bar dataKey="baseline" name="Baseline Score" fill="#94a3b8" />
                <Bar dataKey="final" name="Final Score" fill="#f43f5e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {topics.map((topic, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>{topic.name}</CardTitle>
            <CardDescription>Topic improvement analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Baseline Score</span>
                  <span className="text-sm text-muted-foreground">
                    {topic.baselineScore.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-muted-foreground"
                    style={{ width: `${topic.baselineScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Final Score</span>
                  <span className="text-sm text-muted-foreground">
                    {topic.finalScore.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-rose-500"
                    style={{ width: `${topic.finalScore}%` }}
                  />
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Improvement</span>
                  <span className="text-sm font-medium text-rose-500">
                    {topic.improvement > 0 ? "+" : ""}
                    {topic.improvement.toFixed(1)}%
                  </span>
                </div>
              </div>

              {topic.keyInsights && topic.keyInsights.length > 0 && (
                <div className="pt-2 mt-2 border-t">
                  <span className="text-sm font-medium">Key Insights:</span>
                  <ul className="mt-1 text-xs text-muted-foreground space-y-1 list-disc pl-4">
                    {topic.keyInsights.slice(0, 2).map((insight, i) => (
                      <li key={i}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
