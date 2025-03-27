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
import {
  TrendingUp,
  TrendingDown,
  FileText,
  BarChart2,
  List,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [assessmentId1, setAssessmentId1] = useState<string>("367");
  const [assessmentId2, setAssessmentId2] = useState<string>("355");
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

    let chartData = [
      {
        name: "Overall Score",
        baseline: Math.round(data1.assignedData.score || 0),
        final: Math.round(data2.assignedData.score || 0),
      },
    ];

    getAllConceptTopics().forEach((topic) => {
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

    // Filter out any comparison where either value is 0
    chartData = chartData.filter(
      (item) => item.baseline !== 0 && item.final !== 0
    );
    return chartData;
  }, [data1, data2]);

  const topicSubtopicChartData = React.useMemo(() => {
    if (
      !data1 ||
      !data2 ||
      !data1.assignedData?.evaluation ||
      !data2.assignedData?.evaluation
    )
      return [];

    const eval1Topics =
      data1.assignedData.evaluation.TOPIC_ANALYSIS?.mainTopics || [];
    const eval2Topics =
      data2.assignedData.evaluation.TOPIC_ANALYSIS?.mainTopics || [];

    const getWords = (str: string) => new Set(str.toLowerCase().split(/\s+/));

    const baselineSubs: { name: string; score: number; words: Set<string> }[] =
      [];
    const finalSubs: { name: string; score: number; words: Set<string> }[] = [];

    eval1Topics.forEach((topic) => {
      topic.subtopicPerformance.forEach((sub) => {
        baselineSubs.push({
          name: sub.name,
          score: sub.score,
          words: getWords(sub.name),
        });
      });
    });
    eval2Topics.forEach((topic) => {
      topic.subtopicPerformance.forEach((sub) => {
        finalSubs.push({
          name: sub.name,
          score: sub.score,
          words: getWords(sub.name),
        });
      });
    });

    let matches: { name: string; baseline: number; final: number }[] = [];

    baselineSubs.forEach((bSub) => {
      const matchIndex = finalSubs.findIndex((fSub) => {
        for (const word of bSub.words) {
          if (fSub.words.has(word)) return true;
        }
        return false;
      });
      if (matchIndex !== -1) {
        const fSub = finalSubs.splice(matchIndex, 1)[0];
        matches.push({
          name: `${bSub.name} / ${fSub.name}`,
          baseline: bSub.score,
          final: fSub.score,
        });
      } else {
        matches.push({
          name: bSub.name,
          baseline: bSub.score,
          final: 0,
        });
      }
    });

    finalSubs.forEach((fSub) => {
      matches.push({
        name: fSub.name,
        baseline: 0,
        final: fSub.score,
      });
    });

    // Filter out any comparison where either value is 0
    matches = matches.filter(
      (match) => match.baseline !== 0 && match.final !== 0
    );
    return matches;
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

    const metadataFields = [
      { key: "subject", icon: <FileText className="h-4 w-4 mr-2" /> },
      { key: "topic", icon: <List className="h-4 w-4 mr-2" /> },
      { key: "class_level", icon: <BarChart2 className="h-4 w-4 mr-2" /> },
      { key: "difficulty", icon: null },
      { key: "assessment_type", icon: null },
      { key: "board", icon: null },
    ];

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          {metadataFields.map(({ key, icon }) => {
            const value = data.metadata[key as keyof typeof data.metadata];
            return (
              <TooltipProvider key={key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center capitalize">
                      {icon}
                      <strong className="mr-2">
                        {key.replace(/_/g, " ")}:
                      </strong>
                      <Badge
                        variant="secondary"
                        className="truncate max-w-[150px]"
                      >
                        {value || "N/A"}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{value || "No information available"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
        <div className="flex items-center space-x-2">
          <strong>Score:</strong>
          <Badge
            variant={
              (data.assignedData.score || 0) > 7
                ? "default"
                : (data.assignedData.score || 0) > 5
                  ? "secondary"
                  : "destructive"
            }
          >
            {data.assignedData.score?.toFixed(2) || "N/A"}
          </Badge>
        </div>
      </div>
    );
  };
  // Enhanced performance details with more visual hierarchy
  const renderPerformanceDetails = (data: AssessmentData | null) => {
    if (!data?.assignedData?.evaluation) return <div>No performance data</div>;

    const performanceMetrics = data.assignedData.evaluation.PERFORMANCE_METRICS;
    const conceptUnderstanding =
      data.assignedData.evaluation.CONCEPT_UNDERSTANDING;

    return (
      <ScrollArea className="h-[400px] w-full rounded-md border p-4">
        <div className="space-y-4">
          {[
            {
              title: "Performance Strengths",
              items: performanceMetrics?.strengths,
              emptyText: "No specific strengths noted",
              className: "text-green-600",
            },
            {
              title: "Performance Weaknesses",
              items: performanceMetrics?.weaknesses,
              emptyText: "No specific weaknesses noted",
              className: "text-red-600",
            },
            {
              title: "Knowledge Gaps",
              items: conceptUnderstanding?.knowledgeGaps,
              emptyText: "No knowledge gaps identified",
              className: "text-orange-600",
            },
          ].map(({ title, items, emptyText, className }) => (
            <div key={title}>
              <h4 className="font-semibold mb-2 border-b pb-1">{title}</h4>
              <ul className={`list-disc pl-5 space-y-1 ${className}`}>
                {items?.length ? (
                  items.map((item, index) => (
                    <li key={index} className="text-sm">
                      {item}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500">{emptyText}</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </ScrollArea>
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
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger
                    value="metadata"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" /> Metadata
                  </TabsTrigger>
                  <TabsTrigger
                    value="performance"
                    className="flex items-center gap-2"
                  >
                    <BarChart2 className="h-4 w-4" /> Performance
                  </TabsTrigger>
                  <TabsTrigger
                    value="topics"
                    className="flex items-center gap-2"
                  >
                    <List className="h-4 w-4" /> Topics
                  </TabsTrigger>
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
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger
                    value="metadata"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" /> Metadata
                  </TabsTrigger>
                  <TabsTrigger
                    value="performance"
                    className="flex items-center gap-2"
                  >
                    <BarChart2 className="h-4 w-4" /> Performance
                  </TabsTrigger>
                  <TabsTrigger
                    value="topics"
                    className="flex items-center gap-2"
                  >
                    <List className="h-4 w-4" /> Topics
                  </TabsTrigger>
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

          {/* Conditionally render Performance Comparison Card */}
          {performanceChartData.length > 0 && (
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
                <CardDescription>
                  Baseline vs Final Test Results
                </CardDescription>
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
                    >
                      <LabelList dataKey="baseline" position="top" />
                    </Bar>
                    <Bar dataKey="final" fill="var(--color-final)" radius={4}>
                      <LabelList dataKey="final" position="top" />
                    </Bar>
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
          )}

          {/* Topic Comparison Chart Card */}
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
                    >
                      <LabelList dataKey="baseline" position="top" />
                    </Bar>
                    <Bar dataKey="final" fill="var(--color-final)" radius={4}>
                      <LabelList dataKey="final" position="top" />
                    </Bar>
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
