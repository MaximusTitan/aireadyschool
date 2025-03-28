"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AIAnalysis } from "../lib/ai-schema";
import { TopicInsightsChart } from "../components/topic-insights-chart";
import { SkillDevelopmentChart } from "../components/skill-development-chart";
import { LearningPatternsChart } from "../components/learning-patterns-chart";
import { RecommendationsPanel } from "../components/recommendations-panel";

interface AIAnalysisDashboardProps {
  aiAnalysis: AIAnalysis;
}

export function AIAnalysisDashboard({ aiAnalysis }: AIAnalysisDashboardProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Key Takeaways</CardTitle>
          <CardDescription>
            AI-generated insights from assessment comparison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            {aiAnalysis.keyTakeaways.map((takeaway, index) => (
              <li key={index} className="text-sm">
                {takeaway}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Tabs defaultValue="topics" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-rose-100">
          <TabsTrigger value="topics">Topic Insights</TabsTrigger>
          <TabsTrigger value="skills">Skill Development</TabsTrigger>
          <TabsTrigger value="learning">Learning Patterns</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="topics" className="mt-6">
          <TopicInsightsChart topicComparison={aiAnalysis.topicComparison} />
        </TabsContent>

        <TabsContent value="skills" className="mt-6">
          <SkillDevelopmentChart
            skillDevelopment={aiAnalysis.skillDevelopment}
          />
        </TabsContent>

        <TabsContent value="learning" className="mt-6">
          <LearningPatternsChart
            learningPatterns={aiAnalysis.learningPatterns}
          />
        </TabsContent>

        <TabsContent value="recommendations" className="mt-6">
          <RecommendationsPanel
            recommendations={aiAnalysis.recommendedInterventions}
            focusAreas={aiAnalysis.topicComparison.recommendedFocusAreas}
            strengthAreas={aiAnalysis.topicComparison.strengthAreas}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
