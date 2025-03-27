"use client";

import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Comprehensive interfaces
interface AssessmentData {
  id: string;
  metadata: {
    subject: string | null;
    topic: string | null;
    class_level: string | null;
    difficulty: string | null;
    assessment_type: string | null;
    board: string | null;
    learning_outcomes: string | null;
  };
  assignedData: {
    score: number | null;
    evaluation: {
      STUDENT_METADATA: {
        studentId: string;
        dateOfAssessment: string;
        grade: string;
        board: string;
      };
      PERFORMANCE_METRICS: {
        overallScore: number;
        strengths: string[];
        weaknesses: string[];
      };
      CONCEPT_UNDERSTANDING: {
        conceptUnderstandingLevels: Record<string, number>;
        knowledgeGaps: string[];
        conceptHierarchy: Array<{
          primaryConcept: string;
          understandingScore: number;
        }>;
      };
      TOPIC_ANALYSIS: {
        mainTopics: Array<{
          name: string;
          strongUnderstandingTopics: string[];
          weakUnderstandingTopics: string[];
          topicScore: number;
          masteryLevel: string;
          confidenceLevel: string;
          subtopics: string[];
          subtopicPerformance: Array<{
            name: string;
            score: number;
            questionsCorrect: number;
            questionsAttempted: number;
            averageResponseTime: number;
          }>;
        }>;
      };
    } | null;
  };
}

const EvaluationComparisonPage: React.FC = () => {
  const [assessmentId1, setAssessmentId1] = useState<string>("355");
  const [assessmentId2, setAssessmentId2] = useState<string>("367");
  const [data1, setData1] = useState<AssessmentData | null>(null);
  const [data2, setData2] = useState<AssessmentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const supabase = createClient();

  const fetchAssessmentData = async (
    assessmentId: string
  ): Promise<AssessmentData | null> => {
    try {
      // Fetch assessment metadata
      const { data: metadataResult, error: metadataError } = await supabase
        .from("assessments")
        .select("*")
        .eq("id", assessmentId)
        .single();

      // Fetch assigned assessment data
      const { data: assignedResult, error: assignedError } = await supabase
        .from("assigned_assessments")
        .select("score, evaluation")
        .eq("assessment_id", assessmentId)
        .single();

      if (metadataError || assignedError) {
        console.error("Fetch error", { metadataError, assignedError });
        return null;
      }

      return {
        id: assessmentId,
        metadata: {
          subject: metadataResult.subject,
          topic: metadataResult.topic,
          class_level: metadataResult.class_level,
          difficulty: metadataResult.difficulty,
          assessment_type: metadataResult.assessment_type,
          board: metadataResult.board,
          learning_outcomes: metadataResult.learning_outcomes,
        },
        assignedData: {
          score: assignedResult.score,
          evaluation: assignedResult.evaluation,
        },
      };
    } catch (err) {
      console.error("Unexpected error", err);
      return null;
    }
  };

  const handleCompare = async () => {
    setLoading(true);
    setError(null);
    try {
      const result1 = await fetchAssessmentData(assessmentId1);
      const result2 = await fetchAssessmentData(assessmentId2);

      if (!result1 || !result2) {
        setError(
          "Could not fetch assessment data. Please check the assessment IDs."
        );
        return;
      }

      setData1(result1);
      setData2(result2);
    } catch (err) {
      setError("An error occurred while comparing assessments.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get all unique primary concepts from conceptHierarchy
  const getAllConceptTopics = (): string[] => {
    if (!data1?.assignedData?.evaluation || !data2?.assignedData?.evaluation) {
      return [];
    }
    const eval1 = data1.assignedData.evaluation; // safe to use non-null
    const eval2 = data2.assignedData.evaluation;
    const hierarchy1 = eval1.CONCEPT_UNDERSTANDING?.conceptHierarchy || [];
    const hierarchy2 = eval2.CONCEPT_UNDERSTANDING?.conceptHierarchy || [];
    const topics = new Set<string>();
    hierarchy1.forEach((item) => topics.add(item.primaryConcept));
    hierarchy2.forEach((item) => topics.add(item.primaryConcept));
    return Array.from(topics);
  };

  // Prepare comprehensive chart data dynamically
  const performanceChartData = React.useMemo(() => {
    if (
      !data1 ||
      !data2 ||
      !data1.assignedData.evaluation ||
      !data2.assignedData.evaluation
    )
      return [];

    const eval1 = data1.assignedData.evaluation;
    const eval2 = data2.assignedData.evaluation;

    // Start with overall score
    const chartData = [
      {
        name: "Overall Score",
        baseline: Math.round(data1.assignedData.score || 0),
        final: Math.round(data2.assignedData.score || 0),
      },
    ];

    // Add concept understanding levels dynamically
    getAllConceptTopics().forEach((topic) => {
      // Find the matching concept from the hierarchy arrays
      const baselineConcept =
        eval1.CONCEPT_UNDERSTANDING?.conceptHierarchy?.find(
          (item) => item.primaryConcept === topic
        );
      const finalConcept = eval2.CONCEPT_UNDERSTANDING?.conceptHierarchy?.find(
        (item) => item.primaryConcept === topic
      );
      const baselineValue = baselineConcept
        ? baselineConcept.understandingScore
        : 0;
      const finalValue = finalConcept ? finalConcept.understandingScore : 0;

      chartData.push({
        name: `${topic} Understanding`,
        baseline: baselineValue,
        final: finalValue,
      });
    });

    return chartData;
  }, [data1, data2]);

  // New computed variable for subtopic performance chart data using fetched Topic parameters
  const topicSubtopicChartData = React.useMemo(() => {
    if (
      !data1 ||
      !data2 ||
      !data1.assignedData.evaluation ||
      !data2.assignedData.evaluation
    )
      return [];
    // Assume the fetched new parameters are in the first main topic of TOPIC_ANALYSIS
    const topic1 =
      data1.assignedData.evaluation.TOPIC_ANALYSIS?.mainTopics?.[0];
    const topic2 =
      data2.assignedData.evaluation.TOPIC_ANALYSIS?.mainTopics?.[0];
    if (!topic1 || !topic2) return [];
    const subtopicsSet = new Set([
      ...topic1.subtopicPerformance.map((sp) => sp.name),
      ...topic2.subtopicPerformance.map((sp) => sp.name),
    ]);
    const data: { name: string; baseline: number; final: number }[] = [];
    subtopicsSet.forEach((sub) => {
      const baselineSub = topic1.subtopicPerformance.find(
        (sp) => sp.name === sub
      );
      const finalSub = topic2.subtopicPerformance.find((sp) => sp.name === sub);
      data.push({
        name: sub,
        baseline: baselineSub ? baselineSub.score : 0,
        final: finalSub ? finalSub.score : 0,
      });
    });
    return data;
  }, [data1, data2]);

  // Chart configuration
  const chartConfig = {
    baseline: {
      label: "Baseline Test",
      color: "hsl(var(--chart-1))",
    },
    final: {
      label: "Final Test",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  // Calculate improvement percentage if data is available
  const calculateImprovement = () => {
    if (
      data1 &&
      data2 &&
      data1.assignedData.score &&
      data2.assignedData.score
    ) {
      const baseline = Math.round(data1.assignedData.score * 10);
      const final = Math.round(data2.assignedData.score * 10);
      const improvement = ((final - baseline) / baseline) * 10;
      return improvement.toFixed(1);
    }
    return null;
  };

  const improvementPercentage = calculateImprovement();

  const renderMetadataSection = (data: AssessmentData | null) => {
    if (!data) return <div>No data available</div>;

    return (
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(data.metadata).map(([key, value]) => (
          <div key={key} className="capitalize">
            <strong>{key.replace(/_/g, " ")}:</strong> {value || "N/A"}
          </div>
        ))}
        <div>
          <strong>Score:</strong> {data.assignedData.score?.toFixed(2) || "N/A"}
        </div>
      </div>
    );
  };

  const renderPerformanceDetails = (data: AssessmentData | null) => {
    if (!data?.assignedData?.evaluation) return <div>No performance data</div>;

    const performanceMetrics = data.assignedData.evaluation.PERFORMANCE_METRICS;
    const conceptUnderstanding =
      data.assignedData.evaluation.CONCEPT_UNDERSTANDING;

    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold">Performance Strengths</h4>
          <ul className="list-disc pl-5">
            {performanceMetrics?.strengths?.map((strength, index) => (
              <li key={index} className="text-green-600">
                {strength}
              </li>
            )) || <li>No specific strengths noted</li>}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Performance Weaknesses</h4>
          <ul className="list-disc pl-5">
            {performanceMetrics?.weaknesses?.map((weakness, index) => (
              <li key={index} className="text-red-600">
                {weakness}
              </li>
            )) || <li>No specific weaknesses noted</li>}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Knowledge Gaps</h4>
          <ul className="list-disc pl-5">
            {conceptUnderstanding?.knowledgeGaps?.map((gap, index) => (
              <li key={index} className="text-orange-600">
                {gap}
              </li>
            )) || <li>No knowledge gaps identified</li>}
          </ul>
        </div>
      </div>
    );
  };

  const renderTopicAnalysis = (data: AssessmentData | null) => {
    const topicAnalysis = data?.assignedData?.evaluation?.TOPIC_ANALYSIS;
    if (!topicAnalysis || !topicAnalysis.mainTopics)
      return <div>No topic analysis available</div>;

    return (
      <div className="space-y-4">
        {topicAnalysis.mainTopics.map((topic, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-lg mb-2">{topic.name}</h4>
            <div>
              {/* Display additional topic details */}
              <span>Score: {topic.topicScore}</span> |{" "}
              <span>Mastery: {topic.masteryLevel}</span> |{" "}
              <span>Confidence: {topic.confidenceLevel}</span>
            </div>
            <div>
              <strong>Subtopics:</strong> {topic.subtopics.join(", ")}
            </div>
            <div>
              <strong>Subtopic Performance:</strong>
              <ul className="list-disc pl-5">
                {topic.subtopicPerformance.map((sub, i) => (
                  <li key={i}>
                    {sub.name} - Score: {sub.score}, Correct:{" "}
                    {sub.questionsCorrect}/{sub.questionsAttempted}, Avg
                    Response: {sub.averageResponseTime}s
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <h5 className="font-medium text-green-600">Strong Topics</h5>
                <ul className="list-disc pl-5">
                  {topic.strongUnderstandingTopics.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-red-600">Weak Topics</h5>
                <ul className="list-disc pl-5">
                  {topic.weakUnderstandingTopics.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Assessment ID 1"
          value={assessmentId1}
          onChange={(e) => setAssessmentId1(e.target.value)}
        />
        <Input
          placeholder="Assessment ID 2"
          value={assessmentId2}
          onChange={(e) => setAssessmentId2(e.target.value)}
        />
        <Button
          onClick={handleCompare}
          disabled={loading}
          className="bg-rose-500 hover:bg-rose-600"
        >
          {loading ? "Comparing..." : "Compare"}
        </Button>
      </div>

      {data1 && data2 && (
        <div className="grid grid-cols-2 gap-6">
          {/* Assessment 1 Details */}
          <Card>
            <CardHeader>
              <CardTitle>Baseline Test Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="metadata">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="metadata">Metadata</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="topics">Topics</TabsTrigger>
                </TabsList>
                <TabsContent value="metadata">
                  {renderMetadataSection(data1)}
                </TabsContent>
                <TabsContent value="performance">
                  {renderPerformanceDetails(data1)}
                </TabsContent>
                <TabsContent value="topics">
                  {renderTopicAnalysis(data1)}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Assessment 2 Details */}
          <Card>
            <CardHeader>
              <CardTitle>Final Test Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="metadata">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="metadata">Metadata</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="topics">Topics</TabsTrigger>
                </TabsList>
                <TabsContent value="metadata">
                  {renderMetadataSection(data2)}
                </TabsContent>
                <TabsContent value="performance">
                  {renderPerformanceDetails(data2)}
                </TabsContent>
                <TabsContent value="topics">
                  {renderTopicAnalysis(data2)}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Existing Performance Comparison Card */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Performance Comparison</CardTitle>
              <CardDescription>Baseline vs Final Test Results</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <BarChart data={performanceChartData} height={400}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="baseline"
                    fill="var(--color-baseline)"
                    radius={4}
                  />
                  <Bar dataKey="final" fill="var(--color-final)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
              {improvementPercentage && (
                <div className="flex gap-2 font-medium leading-none">
                  {parseFloat(improvementPercentage) >= 0 ? (
                    <>
                      Performance improved by {improvementPercentage}%{" "}
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </>
                  ) : (
                    <>
                      Performance decreased by{" "}
                      {Math.abs(parseFloat(improvementPercentage))}%
                    </>
                  )}
                </div>
              )}
              <div className="leading-none text-muted-foreground">
                Comparing key performance metrics between baseline and final
                assessments
              </div>
            </CardFooter>
          </Card>

          {/* New Topic Comparison Chart Card for the fetched Topic parameters */}
          {topicSubtopicChartData.length > 0 && (
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Topic Comparison</CardTitle>
                <CardDescription>
                  Subtopic Performance Comparison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <BarChart data={topicSubtopicChartData} height={400}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <YAxis />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />
                    <Bar
                      dataKey="baseline"
                      fill="var(--color-baseline)"
                      radius={4}
                    />
                    <Bar dataKey="final" fill="var(--color-final)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="leading-none text-muted-foreground">
                  Comparing subtopic scores between baseline and final
                  assessments
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default EvaluationComparisonPage;
