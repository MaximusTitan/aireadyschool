"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Check, ChevronDown, ChevronLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle } from "lucide-react";

interface MultiSelectProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
}

interface LearningPlan {
  weeklyPlans: {
    week: number;
    focus: string;
    activities: string[];
    targets: string[];
  }[];
  recommendations: string[];
  assessmentStrategy: string[];
}

interface Step {
  id: number;
  title: string;
  description: string;
}

const StepIndicator: React.FC<{ steps: Step[]; currentStep: number }> = ({
  steps,
  currentStep,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex justify-between">
        {steps.map((step, idx) => (
          <div key={step.id} className="relative flex flex-col items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
                ${
                  idx < currentStep
                    ? "border-primary bg-primary text-white"
                    : idx === currentStep
                      ? "border-primary text-primary"
                      : "border-gray-300 text-gray-300"
                }`}
            >
              {idx < currentStep ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <Circle className="w-6 h-6" />
              )}
            </div>
            <div className="mt-2 text-center">
              <div
                className={`text-sm font-medium ${
                  idx <= currentStep ? "text-primary" : "text-gray-400"
                }`}
              >
                {step.title}
              </div>
              <div
                className={`text-xs ${
                  idx <= currentStep ? "text-gray-600" : "text-gray-400"
                }`}
              >
                {step.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <div
        className="p-2 border rounded-md cursor-pointer flex items-center justify-between hover:border-gray-400 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm">
          {value.length ? `${value.length} selected` : placeholder}
        </span>
        <ChevronDown className="h-4 w-4" />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <div
              key={option}
              className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
              onClick={() => {
                onChange(
                  value.includes(option)
                    ? value.filter((v) => v !== option)
                    : [...value, option]
                );
              }}
            >
              <div className="w-4 h-4 border rounded mr-2 flex items-center justify-center">
                {value.includes(option) && <Check className="h-3 w-3" />}
              </div>
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const LoadingSkeleton = () => (
  <Card className="w-full max-w-3xl mx-auto">
    <CardContent className="space-y-4 pt-6">
      {Array(4)
        .fill(0)
        .map((_, i) => (
          <Skeleton key={i} className="h-[60px] w-full" />
        ))}
    </CardContent>
  </Card>
);

const StudentAssessmentForm = () => {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [grade, setGrade] = useState("");
  const [board, setBoard] = useState("");
  const [goals, setGoals] = useState("");
  const [timeline, setTimeline] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<SubjectKeys | "">("");
  const [selectedCognitiveParams, setSelectedCognitiveParams] = useState<
    string[]
  >([]);
  const [selectedKnowledgeParams, setSelectedKnowledgeParams] = useState<
    string[]
  >([]);
  const [ratings, setRatings] = useState<{ [key: string]: string }>({});
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);

  type SubjectKeys =
    | "Mathematics"
    | "Science"
    | "Languages"
    | "Social Studies"
    | "Art & Creative Skills";

  const cognitiveParams = [
    "Comprehension",
    "Understands instructions",
    "Grasps new concepts",
    "Retains information",
    "Attention",
    "Focus duration",
    "Task completion",
    "Follows routines",
    "Participation",
    "Class engagement",
    "Asks questions",
    "Group work",
  ];

  const subjects: Record<SubjectKeys, string[]> = {
    Mathematics: [
      "Number sense",
      "Problem-solving",
      "Mathematical reasoning",
      "Calculation accuracy",
      "Geometry skills",
    ],
    Science: [
      "Scientific inquiry",
      "Experimental skills",
      "Data interpretation",
      "Scientific concepts",
      "Lab work",
    ],
    Languages: [
      "Reading comprehension",
      "Writing skills",
      "Grammar usage",
      "Vocabulary",
      "Verbal expression",
    ],
    "Social Studies": [
      "Historical understanding",
      "Geographic awareness",
      "Cultural comprehension",
      "Current events knowledge",
      "Analysis of social issues",
    ],
    "Art & Creative Skills": [
      "Creative expression",
      "Technical skills",
      "Visual understanding",
      "Design thinking",
    ],
  };

  const steps: Step[] = [
    {
      id: 1,
      title: "Personal Info",
      description: "Basic student details",
    },
    {
      id: 2,
      title: "Assessment",
      description: "Cognitive & Knowledge",
    },
    {
      id: 3,
      title: "Planning",
      description: "Goals & Timeline",
    },
  ];

  const handleRatingChange = (param: string, value: string): void => {
    setRatings((prev) => ({ ...prev, [param]: value }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name) newErrors.name = "Name is required";
    if (!age) newErrors.age = "Age is required";
    if (!grade) newErrors.grade = "Grade is required";
    if (!board) newErrors.board = "Board is required";
    if (selectedCognitiveParams.length === 0)
      newErrors.cognitive = "Select at least one cognitive parameter";
    if (!selectedSubject) newErrors.subject = "Subject is required";
    if (selectedKnowledgeParams.length === 0)
      newErrors.knowledge = "Select at least one knowledge parameter";
    if (!goals) newErrors.goals = "Goals are required";
    if (!timeline) newErrors.timeline = "Timeline is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-plp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          age,
          grade,
          board,
          cognitiveParams: selectedCognitiveParams.reduce(
            (acc, param) => ({
              ...acc,
              [param]: ratings[param],
            }),
            {}
          ),
          selectedSubject,
          knowledgeParams: selectedKnowledgeParams.reduce(
            (acc, param) => ({
              ...acc,
              [param]: ratings[param],
            }),
            {}
          ),
          goals,
          timeline,
        }),
      });

      const plan = await response.json();
      setLearningPlan(plan);
      toast({
        title: "Success",
        description: "Learning plan generated successfully",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate learning plan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 2));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/tools" className="hover:opacity-75">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-bold">Personalized Learning Planner</h1>
      </div>

      <StepIndicator steps={steps} currentStep={currentStep} />

      {currentStep === 0 && (
        <Card className="w-full max-w-6xl mx-auto shadow-lg">
          <CardContent className="space-y-8 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="required">
                  Name
                </Label>
                <Input
                  id="name"
                  placeholder="Student name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="age" className="required">
                  Age
                </Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className={errors.age ? "border-red-500" : ""}
                />
                {errors.age && (
                  <p className="text-red-500 text-sm mt-1">{errors.age}</p>
                )}
              </div>
              <div>
                <Label htmlFor="grade" className="required">
                  Grade
                </Label>
                <Input
                  id="grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className={errors.grade ? "border-red-500" : ""}
                />
                {errors.grade && (
                  <p className="text-red-500 text-sm mt-1">{errors.grade}</p>
                )}
              </div>
              <div>
                <Label htmlFor="board" className="required">
                  Board
                </Label>
                <Input
                  id="board"
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  className={errors.board ? "border-red-500" : ""}
                />
                {errors.board && (
                  <p className="text-red-500 text-sm mt-1">{errors.board}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {currentStep === 1 && (
        <Card className="w-full max-w-6xl mx-auto shadow-lg">
          <CardContent className="space-y-8 pt-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Cognitive Parameters</h3>
              <MultiSelect
                options={cognitiveParams}
                value={selectedCognitiveParams}
                onChange={setSelectedCognitiveParams}
                placeholder="Select parameters"
              />
              {errors.cognitive && (
                <p className="text-red-500 text-sm mt-1">{errors.cognitive}</p>
              )}

              {selectedCognitiveParams.length > 0 && (
                <div className="grid grid-cols-1 gap-3 mt-2">
                  {selectedCognitiveParams.map((param) => (
                    <div
                      key={param}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded"
                    >
                      <span>{param}</span>
                      <select
                        className="w-20 p-1 border rounded"
                        value={ratings[param] || ""}
                        onChange={(e) =>
                          handleRatingChange(param, e.target.value)
                        }
                      >
                        <option value="">Rate</option>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n}/5
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Knowledge Parameters</h3>
              <select
                className="w-full p-2 border rounded"
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value as SubjectKeys | "");
                  setSelectedKnowledgeParams([]);
                }}
              >
                <option value="">Select subject</option>
                {Object.keys(subjects).map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
              {errors.subject && (
                <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
              )}

              {selectedSubject && (
                <MultiSelect
                  options={subjects[selectedSubject]}
                  value={selectedKnowledgeParams}
                  onChange={setSelectedKnowledgeParams}
                  placeholder="Select parameters"
                />
              )}
              {errors.knowledge && (
                <p className="text-red-500 text-sm mt-1">{errors.knowledge}</p>
              )}

              {selectedKnowledgeParams.length > 0 && (
                <div className="grid grid-cols-1 gap-3 mt-2">
                  {selectedKnowledgeParams.map((param) => (
                    <div
                      key={param}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded"
                    >
                      <span>{param}</span>
                      <select
                        className="w-20 p-1 border rounded"
                        value={ratings[param] || ""}
                        onChange={(e) =>
                          handleRatingChange(param, e.target.value)
                        }
                      >
                        <option value="">Rate</option>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n}/5
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {currentStep === 2 && (
        <Card className="w-full max-w-6xl mx-auto shadow-lg">
          <CardContent className="space-y-8 pt-6">
            <div className="space-y-2">
              <div>
                <Label htmlFor="goals" className="required">
                  Goals
                </Label>
                <textarea
                  className={`w-full p-2 border rounded h-24 ${
                    errors.goals ? "border-red-500" : ""
                  }`}
                  placeholder="Enter learning goals..."
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                />
                {errors.goals && (
                  <p className="text-red-500 text-sm mt-1">{errors.goals}</p>
                )}
              </div>
              <div>
                <Label htmlFor="timeline" className="required">
                  Timeline
                </Label>
                <Input
                  placeholder="e.g., 1 month"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  className={errors.timeline ? "border-red-500" : ""}
                />
                {errors.timeline && (
                  <p className="text-red-500 text-sm mt-1">{errors.timeline}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Navigation Buttons */}
      <div className="flex justify-end gap-4 mt-6 mr-14">
        {currentStep > 0 && (
          <Button variant="outline" onClick={prevStep}>
            Previous
          </Button>
        )}
        {currentStep < 2 && <Button onClick={nextStep}>Next</Button>}
        {currentStep === 2 && (
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Generating Plan..." : "Generate Learning Plan"}
          </Button>
        )}
      </div>

      {isLoading && <LoadingSkeleton />}

      {learningPlan && !isLoading && (
        <Card className="w-full max-w-6xl mx-auto shadow-lg animate-fade-in">
          <CardHeader>
            <CardTitle>Learning Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {learningPlan.weeklyPlans.map((week) => (
              <div key={week.week} className="space-y-2">
                <h3 className="font-semibold">Week {week.week}</h3>
                <p className="font-medium">Focus: {week.focus}</p>
                <div className="pl-4">
                  <h4 className="font-medium">Activities:</h4>
                  <ul className="list-disc pl-4">
                    {week.activities.map((activity, i) => (
                      <li key={i}>{activity}</li>
                    ))}
                  </ul>
                  <h4 className="font-medium mt-2">Targets:</h4>
                  <ul className="list-disc pl-4">
                    {week.targets.map((target, i) => (
                      <li key={i}>{target}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

            <div>
              <h3 className="font-semibold">Recommendations</h3>
              <ul className="list-disc pl-4">
                {learningPlan.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold">Assessment Strategy</h3>
              <ul className="list-disc pl-4">
                {learningPlan.assessmentStrategy.map((strategy, i) => (
                  <li key={i}>{strategy}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentAssessmentForm;
