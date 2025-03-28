"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LearningPatterns } from "../lib/ai-schema";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface LearningPatternsChartProps {
  learningPatterns: LearningPatterns;
}

export function LearningPatternsChart({
  learningPatterns,
}: LearningPatternsChartProps) {
  // Prepare data for the confidence chart
  const confidenceData = [
    {
      name: "Baseline",
      confidence: learningPatterns.confidenceMetrics.baselineConfidence,
    },
    {
      name: "Final",
      confidence: learningPatterns.confidenceMetrics.finalConfidence,
    },
  ];

  // Prepare data for the learning style pie chart
  const learningStyleData = [
    { name: learningPatterns.learningStyle.dominantStyle, value: 100 },
  ];

  const COLORS = ["#f43f5e", "#0ea5e9", "#84cc16", "#f97316"];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Confidence Growth</CardTitle>
            <CardDescription>
              Change in confidence levels between assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={confidenceData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} unit="%" />
                  <Tooltip formatter={(value) => [`${value}%`, "Confidence"]} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="confidence"
                    stroke="#f43f5e"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm font-medium">Confidence Growth</p>
              <p className="text-2xl font-bold text-rose-500">
                +
                {learningPatterns.confidenceMetrics.confidenceGrowth.toFixed(1)}
                %
              </p>
              <p className="text-xs text-muted-foreground">
                Accuracy to Confidence Ratio:{" "}
                {learningPatterns.confidenceMetrics.accuracyToConfidenceRatio.toFixed(
                  2
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning Style Analysis</CardTitle>
            <CardDescription>
              Dominant learning style and characteristics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={learningStyleData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name }) => name}
                  >
                    {learningStyleData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <h4 className="font-medium mb-2">Recommended Approaches:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {learningPatterns.learningStyle.recommendedApproaches
                  .slice(0, 3)
                  .map((approach, index) => (
                    <li key={index} className="text-sm">
                      {approach}
                    </li>
                  ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Learning Strengths</CardTitle>
            <CardDescription>
              Areas where the student shows strong learning capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1">
              {learningPatterns.learningStyle.strengths.map(
                (strength, index) => (
                  <li key={index} className="text-sm">
                    {strength}
                  </li>
                )
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning Challenges</CardTitle>
            <CardDescription>
              Areas where the student faces learning difficulties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1">
              {learningPatterns.learningStyle.challengeAreas.map(
                (challenge, index) => (
                  <li key={index} className="text-sm">
                    {challenge}
                  </li>
                )
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progression Insights</CardTitle>
          <CardDescription>
            Observations about the student's learning progression
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            {learningPatterns.progressionInsights.map((insight, index) => (
              <li key={index} className="text-sm">
                {insight}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
