"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TopicComparison } from "../lib/ai-schema";
import {
  BarChart,
  Bar,
  Cell, // added Cell here
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface TopicInsightsChartProps {
  topicComparison: TopicComparison;
}

export function TopicInsightsChart({
  topicComparison,
}: TopicInsightsChartProps) {
  // Prepare data for the chart
  const chartData = topicComparison.topics.map((topic) => ({
    name: topic.name,
    baseline: topic.baselineScore,
    final: topic.finalScore,
    improvement: topic.improvement,
  }));

  return (
    <div className="space-y-6">
      <Card>
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
                  formatter={(value) => [`${value}%`, ""]}
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

      <Card>
        <CardHeader>
          <CardTitle>Topic Improvement Analysis</CardTitle>
          <CardDescription>
            Percentage improvement by topic from baseline to final assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" unit="%" domain={["dataMin", "dataMax"]} />
                <YAxis type="category" dataKey="name" width={150} />
                <Tooltip formatter={(value) => [`${value}%`, "Improvement"]} />
                <ReferenceLine x={0} stroke="#000" />
                <Bar dataKey="improvement" name="Improvement">
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.improvement >= 0 ? "#f43f5e" : "#ef4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
            <CardDescription>
              Important observations about topic performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {topicComparison.overallInsights.map((insight, index) => (
                <li key={index} className="text-sm">
                  {insight}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Topic Details</CardTitle>
            <CardDescription>Specific insights for each topic</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto">
            <div className="space-y-4">
              {topicComparison.topics.map((topic, index) => (
                <div
                  key={index}
                  className="border-b pb-3 last:border-b-0 last:pb-0"
                >
                  <h4 className="font-medium text-rose-500">{topic.name}</h4>
                  <p className="text-sm text-muted-foreground mb-1">
                    Improvement: {topic.improvement.toFixed(1)}%
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    {topic.keyInsights.map((insight, i) => (
                      <li key={i} className="text-xs">
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
