"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SkillDevelopment } from "../lib/ai-schema";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

interface SkillDevelopmentChartProps {
  skillDevelopment: SkillDevelopment;
}

export function SkillDevelopmentChart({
  skillDevelopment,
}: SkillDevelopmentChartProps) {
  // Prepare data for the radar chart
  const radarData = skillDevelopment.skills.map((skill) => ({
    subject: skill.name,
    baseline: skill.baselineLevel,
    final: skill.finalLevel,
    fullMark: 100,
  }));

  // Prepare data for the scatter chart
  const scatterData = skillDevelopment.skills.map((skill) => ({
    name: skill.name,
    baselineLevel: skill.baselineLevel,
    finalLevel: skill.finalLevel,
    growth: skill.growthPercentage,
    category: skill.category,
  }));

  // Group skills by category for the category breakdown
  const categoryData = skillDevelopment.skillCategories.map((category) => ({
    name: category.name,
    growth: category.averageGrowth,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Skill Proficiency Comparison</CardTitle>
            <CardDescription>
              Baseline vs. final proficiency levels across key skills
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  data={radarData}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Baseline"
                    dataKey="baseline"
                    stroke="#94a3b8"
                    fill="#94a3b8"
                    fillOpacity={0.5}
                  />
                  <Radar
                    name="Final"
                    dataKey="final"
                    stroke="#f43f5e"
                    fill="#f43f5e"
                    fillOpacity={0.5}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skill Growth Analysis</CardTitle>
            <CardDescription>
              Growth percentage by skill category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20,
                  }}
                >
                  <CartesianGrid />
                  <XAxis
                    type="number"
                    dataKey="baselineLevel"
                    name="Baseline Level"
                    unit="%"
                    domain={[0, 100]}
                  />
                  <YAxis
                    type="number"
                    dataKey="finalLevel"
                    name="Final Level"
                    unit="%"
                    domain={[0, 100]}
                  />
                  <ZAxis
                    type="number"
                    dataKey="growth"
                    range={[50, 400]}
                    name="Growth"
                    unit="%"
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    formatter={(value, name) => [
                      `${value}${name === "Growth" ? "%" : "%"}`,
                      name,
                    ]}
                    labelFormatter={(value) => `Skill: ${value}`}
                  />
                  <Scatter
                    name="Skills"
                    data={scatterData}
                    fill="#f43f5e"
                    shape="circle"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Skill Category Growth</CardTitle>
            <CardDescription>
              Average growth percentage by skill category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
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
                    formatter={(value) => [`${value}%`, "Average Growth"]}
                  />
                  <Bar dataKey="growth" name="Average Growth" fill="#f43f5e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skill Development Insights</CardTitle>
            <CardDescription>
              Key observations about skill development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {skillDevelopment.insights.map((insight, index) => (
                <li key={index} className="text-sm">
                  {insight}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
