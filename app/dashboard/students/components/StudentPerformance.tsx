import React from "react";
import DashboardCard from "../../components/DashboardCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface PerformanceMetrics {
  knowledge_index: {
    overall_score: number;
    subject_scores: {
      [subject: string]: number;
    };
    topic_scores: {
      [topic: string]: number;
    };
    strong_areas: string[];
    weak_areas: string[];
  };
  learning_style_index: {
    current: {
      visual: number;
      auditory: number;
      reading_writing: number;
      kinesthetic: number;
    };
    history: {
      date: string;
      visual: number;
      auditory: number;
      reading_writing: number;
      kinesthetic: number;
    }[];
  };
  cognitive_behavioral_index: {
    current: {
      attention: number;
      memory: number;
      problem_solving: number;
      critical_thinking: number;
      creativity: number;
    };
    history: {
      date: string;
      attention: number;
      memory: number;
      problem_solving: number;
      critical_thinking: number;
      creativity: number;
    }[];
  };
  employability_index: {
    overall: number;
    skills: {
      technical: number;
      communication: number;
      teamwork: number;
      leadership: number;
      adaptability: number;
    };
  };
}

interface StudentPerformanceProps {
  metrics?: PerformanceMetrics;
  loading: boolean;
  error: string | null;
}

const StudentPerformance: React.FC<StudentPerformanceProps> = ({
  metrics,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-gray-200 h-40 rounded-md"></div>
        <div className="animate-pulse bg-gray-200 h-60 rounded-md"></div>
        <div className="animate-pulse bg-gray-200 h-60 rounded-md"></div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="text-red-500 text-center py-8">
        {error || "Performance metrics not available"}
      </div>
    );
  }

  const {
    knowledge_index,
    learning_style_index,
    cognitive_behavioral_index,
    employability_index,
  } = metrics;

  const subjectData = Object.entries(knowledge_index.subject_scores)
    .map(([subject, score]) => ({ subject, score }))
    .sort((a, b) => b.score - a.score);

  const topicData = Object.entries(knowledge_index.topic_scores)
    .map(([topic, score]) => ({ topic, score }))
    .sort((a, b) => b.score - a.score);

  const learning_styles = [
    {
      name: "Visual",
      value: learning_style_index.current.visual,
      color: "bg-blue-500",
    },
    {
      name: "Auditory",
      value: learning_style_index.current.auditory,
      color: "bg-green-500",
    },
    {
      name: "Reading/Writing",
      value: learning_style_index.current.reading_writing,
      color: "bg-yellow-500",
    },
    {
      name: "Kinesthetic",
      value: learning_style_index.current.kinesthetic,
      color: "bg-purple-500",
    },
  ].sort((a, b) => b.value - a.value);

  const cognitive_skills = [
    {
      name: "Attention",
      value: cognitive_behavioral_index.current.attention,
      color: "bg-red-500",
    },
    {
      name: "Memory",
      value: cognitive_behavioral_index.current.memory,
      color: "bg-orange-500",
    },
    {
      name: "Problem Solving",
      value: cognitive_behavioral_index.current.problem_solving,
      color: "bg-cyan-500",
    },
    {
      name: "Critical Thinking",
      value: cognitive_behavioral_index.current.critical_thinking,
      color: "bg-indigo-500",
    },
    {
      name: "Creativity",
      value: cognitive_behavioral_index.current.creativity,
      color: "bg-pink-500",
    },
  ].sort((a, b) => b.value - a.value);

  const employability_skills = [
    {
      name: "Technical",
      value: employability_index.skills.technical,
      color: "bg-teal-500",
    },
    {
      name: "Communication",
      value: employability_index.skills.communication,
      color: "bg-amber-500",
    },
    {
      name: "Teamwork",
      value: employability_index.skills.teamwork,
      color: "bg-lime-500",
    },
    {
      name: "Leadership",
      value: employability_index.skills.leadership,
      color: "bg-violet-500",
    },
    {
      name: "Adaptability",
      value: employability_index.skills.adaptability,
      color: "bg-fuchsia-500",
    },
  ].sort((a, b) => b.value - a.value);

  // Helper to add suffixes to numbers (1st, 2nd, 3rd, etc.)
  const getOrdinalSuffix = (i: number) => {
    const j = i % 10,
      k = i % 100;
    if (j === 1 && k !== 11) {
      return i + "st";
    }
    if (j === 2 && k !== 12) {
      return i + "nd";
    }
    if (j === 3 && k !== 13) {
      return i + "rd";
    }
    return i + "th";
  };

  return (
    <div className="space-y-6">
      <DashboardCard title="Performance Overview">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Knowledge Index
              </h3>
              <div className="flex items-end">
                <span className="text-2xl font-bold">
                  {knowledge_index.overall_score}%
                </span>
                <div className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                  {knowledge_index.overall_score >= 80
                    ? "Excellent"
                    : knowledge_index.overall_score >= 70
                      ? "Good"
                      : knowledge_index.overall_score >= 60
                        ? "Average"
                        : "Needs Improvement"}
                </div>
              </div>
              <Progress
                value={knowledge_index.overall_score}
                className="mt-2 h-2"
              />
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Learning Style
              </h3>
              <div className="flex items-end">
                <span className="text-2xl font-bold">
                  {learning_styles[0].name}
                </span>
                <span className="ml-2 text-sm text-gray-500 pt-1">
                  ({learning_styles[0].value}%)
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1">
                {learning_styles.map((style, idx) => (
                  <div key={style.name} className="flex-1 text-center">
                    <div className={`${style.color} h-1.5 rounded-full`}></div>
                    <span className="text-xs mt-1">{style.name.charAt(0)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Cognitive Index
              </h3>
              <div className="flex items-end">
                <span className="text-2xl font-bold">
                  {Math.round(
                    Object.values(cognitive_behavioral_index.current).reduce(
                      (sum, value) => sum + value,
                      0
                    ) / Object.values(cognitive_behavioral_index.current).length
                  )}
                  %
                </span>
                <span className="ml-2 text-sm text-gray-500 pt-1">Average</span>
              </div>
              <Progress
                value={
                  Object.values(cognitive_behavioral_index.current).reduce(
                    (sum, value) => sum + value,
                    0
                  ) / Object.values(cognitive_behavioral_index.current).length
                }
                className="mt-2 h-2"
              />
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Employability Index
              </h3>
              <div className="flex items-end">
                <span className="text-2xl font-bold">
                  {employability_index.overall}%
                </span>
                <div className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                  {getOrdinalSuffix(
                    Math.ceil((100 - employability_index.overall) / 10)
                  )}{" "}
                  decile
                </div>
              </div>
              <Progress
                value={employability_index.overall}
                className="mt-2 h-2"
              />
            </div>
          </div>
        </div>
      </DashboardCard>

      <Tabs defaultValue="knowledge" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="knowledge">Knowledge Index</TabsTrigger>
          <TabsTrigger value="learning">Learning Style</TabsTrigger>
          <TabsTrigger value="cognitive">Cognitive & Behavioral</TabsTrigger>
          <TabsTrigger value="employability">Employability</TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge">
          <DashboardCard title="Knowledge Index">
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">
                  Overall Score: {knowledge_index.overall_score}%
                </h3>
                <Progress
                  value={knowledge_index.overall_score}
                  className="h-2.5"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-medium mb-4">
                    Subject-wise Scores
                  </h3>
                  <div className="space-y-4">
                    {subjectData.map(({ subject, score }) => (
                      <div key={subject}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{subject}</span>
                          <span className="text-sm font-medium">{score}%</span>
                        </div>
                        <Progress value={score} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium mb-4">
                    Topic-wise Scores
                  </h3>
                  <div className="space-y-4">
                    {topicData.slice(0, 5).map(({ topic, score }) => (
                      <div key={topic}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{topic}</span>
                          <span className="text-sm font-medium">{score}%</span>
                        </div>
                        <Progress value={score} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-green-700 mb-2">
                    Strong Areas
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {knowledge_index.strong_areas.map((area) => (
                      <li key={area} className="text-green-700">
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-red-700 mb-2">
                    Weak Areas
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {knowledge_index.weak_areas.map((area) => (
                      <li key={area} className="text-red-700">
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </DashboardCard>
        </TabsContent>

        <TabsContent value="learning">
          <DashboardCard title="Learning Style Index">
            <div className="p-6">
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-6">
                  Current Learning Style Preferences
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {learning_styles.map((style) => (
                    <div key={style.name} className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${style.color} mr-2`}
                      ></div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{style.name}</span>
                          <span>{style.value}%</span>
                        </div>
                        <Progress
                          value={style.value}
                          className={`h-2.5 ${style.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center mt-4">
                  <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-full text-sm">
                    <span className="font-medium mr-1">VARK Profile:</span>
                    <span>V ({learning_style_index.current.visual}%)</span>
                    <span className="mx-1">•</span>
                    <span>A ({learning_style_index.current.auditory}%)</span>
                    <span className="mx-1">•</span>
                    <span>
                      R ({learning_style_index.current.reading_writing}%)
                    </span>
                    <span className="mx-1">•</span>
                    <span>K ({learning_style_index.current.kinesthetic}%)</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-6">
                  Learning Style Evolution
                </h3>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <div className="space-y-6">
                    {learning_style_index.history.map((entry, index) => (
                      <div key={index}>
                        <div className="mb-2">
                          <span className="font-medium">
                            {new Date(entry.date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <div className="text-xs text-center mb-1">
                              Visual
                            </div>
                            <div className="h-24 bg-gray-100 rounded-md relative">
                              <div
                                className="absolute bottom-0 w-full bg-blue-500 rounded-b-md"
                                style={{ height: `${entry.visual}%` }}
                              ></div>
                              <div className="absolute w-full text-center bottom-1 text-xs font-medium text-white">
                                {entry.visual}%
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-center mb-1">
                              Auditory
                            </div>
                            <div className="h-24 bg-gray-100 rounded-md relative">
                              <div
                                className="absolute bottom-0 w-full bg-green-500 rounded-b-md"
                                style={{ height: `${entry.auditory}%` }}
                              ></div>
                              <div className="absolute w-full text-center bottom-1 text-xs font-medium text-white">
                                {entry.auditory}%
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-center mb-1">
                              Reading/Writing
                            </div>
                            <div className="h-24 bg-gray-100 rounded-md relative">
                              <div
                                className="absolute bottom-0 w-full bg-yellow-500 rounded-b-md"
                                style={{ height: `${entry.reading_writing}%` }}
                              ></div>
                              <div className="absolute w-full text-center bottom-1 text-xs font-medium text-white">
                                {entry.reading_writing}%
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-center mb-1">
                              Kinesthetic
                            </div>
                            <div className="h-24 bg-gray-100 rounded-md relative">
                              <div
                                className="absolute bottom-0 w-full bg-purple-500 rounded-b-md"
                                style={{ height: `${entry.kinesthetic}%` }}
                              ></div>
                              <div className="absolute w-full text-center bottom-1 text-xs font-medium text-white">
                                {entry.kinesthetic}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </DashboardCard>
        </TabsContent>

        <TabsContent value="cognitive">
          <DashboardCard title="Cognitive & Behavioral Index">
            <div className="p-6">
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-6">
                  Current Cognitive Profile
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cognitive_skills.map((skill) => (
                    <div
                      key={skill.name}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
                    >
                      <div className="mb-2 flex justify-between">
                        <span className="font-medium">{skill.name}</span>
                        <span className="text-gray-500">{skill.value}%</span>
                      </div>
                      <Progress
                        value={skill.value}
                        className={`h-2 ${skill.color}`}
                      />
                      <div className="mt-3 text-sm text-gray-500">
                        {skill.value >= 80
                          ? "Exceptional"
                          : skill.value >= 70
                            ? "Strong"
                            : skill.value >= 60
                              ? "Developing"
                              : "Needs attention"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-6">
                  Cognitive Development Over Time
                </h3>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left font-medium text-gray-500 pb-2">
                          Date
                        </th>
                        <th className="text-left font-medium text-gray-500 pb-2">
                          Attention
                        </th>
                        <th className="text-left font-medium text-gray-500 pb-2">
                          Memory
                        </th>
                        <th className="text-left font-medium text-gray-500 pb-2">
                          Problem Solving
                        </th>
                        <th className="text-left font-medium text-gray-500 pb-2">
                          Critical Thinking
                        </th>
                        <th className="text-left font-medium text-gray-500 pb-2">
                          Creativity
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cognitive_behavioral_index.history.map(
                        (entry, index) => (
                          <tr
                            key={index}
                            className={index % 2 === 0 ? "bg-gray-50" : ""}
                          >
                            <td className="py-3 px-2">
                              {new Date(entry.date).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </td>
                            <td className="py-3 px-2">{entry.attention}%</td>
                            <td className="py-3 px-2">{entry.memory}%</td>
                            <td className="py-3 px-2">
                              {entry.problem_solving}%
                            </td>
                            <td className="py-3 px-2">
                              {entry.critical_thinking}%
                            </td>
                            <td className="py-3 px-2">{entry.creativity}%</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </DashboardCard>
        </TabsContent>

        <TabsContent value="employability">
          <DashboardCard title="Employability Index">
            <div className="p-6">
              <div className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex flex-col items-center">
                  <div className="text-2xl font-bold mb-2">
                    Overall Employability Score
                  </div>
                  <div className="w-48 h-48 rounded-full border-8 border-gray-100 flex items-center justify-center mb-4 relative">
                    <div className="absolute inset-0">
                      <svg viewBox="0 0 36 36" className="w-full h-full">
                        <path
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#E5E7EB"
                          strokeWidth="3"
                          strokeDasharray="100, 100"
                        />
                        <path
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="3"
                          strokeDasharray={`${employability_index.overall}, 100`}
                        />
                      </svg>
                    </div>
                    <div className="text-4xl font-bold">
                      {employability_index.overall}%
                    </div>
                  </div>
                  <div className="text-gray-500">
                    This student is in the top{" "}
                    {100 -
                      Math.ceil((100 - employability_index.overall) / 10) * 10}
                    % of employable students in their cohort
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-6">
                  Employability Skills Breakdown
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {employability_skills.map((skill) => (
                    <div key={skill.name} className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${skill.color} mr-3`}
                      ></div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{skill.name}</span>
                          <span>{skill.value}%</span>
                        </div>
                        <Progress
                          value={skill.value}
                          className={`h-2.5 ${skill.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <div className="flex">
                    <div className="mr-3 mt-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5 text-yellow-600"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-yellow-700 mb-1">
                        Recommendations for Improvement
                      </h4>
                      <p className="text-yellow-700 text-sm">
                        Focus on developing{" "}
                        {employability_skills.slice(-2)[0].name.toLowerCase()}{" "}
                        and{" "}
                        {employability_skills.slice(-1)[0].name.toLowerCase()}{" "}
                        skills through targeted activities and exercises.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DashboardCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentPerformance;
