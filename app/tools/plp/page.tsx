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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface GoalCategory {
  label: string;
  examples: string[];
}

const StepIndicator: React.FC<{ steps: Step[]; currentStep: number }> = ({
  steps,
  currentStep,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between relative">
        {/* Add connecting lines */}
        <div className="absolute top-5 left-0 right-0 h-[2px] bg-gray-200">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${(currentStep / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {steps.map((step, idx) => (
          <div
            key={step.id}
            className="relative flex flex-col items-center z-10 bg-background"
          >
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                ${
                  idx < currentStep
                    ? "border-primary bg-primary text-white shadow-md"
                    : idx === currentStep
                      ? "border-primary text-primary animate-pulse"
                      : "border-gray-300 text-gray-300"
                }`}
            >
              {idx < currentStep ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <div className="w-6 h-6 flex items-center justify-center font-semibold">
                  {idx + 1}
                </div>
              )}
            </div>
            <div className="mt-3 text-center">
              <div
                className={`text-sm font-semibold mb-1 transition-colors duration-300 ${
                  idx <= currentStep ? "text-primary" : "text-gray-400"
                }`}
              >
                {step.title}
              </div>
              <div
                className={`text-xs transition-colors duration-300 max-w-[120px] ${
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

const ParameterCard: React.FC<{
  param: string;
  selected: boolean;
  rating: string;
  onSelect: () => void;
  onRatingChange: (value: string) => void;
}> = ({ param, selected, rating, onSelect, onRatingChange }) => {
  return (
    <div
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-4 h-4 border rounded flex items-center justify-center ${
              selected ? "border-primary" : "border-gray-300"
            }`}
          >
            {selected && <Check className="h-3 w-3 text-primary" />}
          </div>
          <span className="font-medium">{param}</span>
        </div>
        {selected && (
          <Select value={rating} onValueChange={onRatingChange}>
            <SelectTrigger
              className="w-20 h-8"
              onClick={(e) => e.stopPropagation()}
            >
              <SelectValue placeholder="Rate" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n}/5
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {selected && rating && (
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className={`h-1 flex-1 rounded-full ${
                n <= parseInt(rating) ? "bg-primary" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CategorySection: React.FC<{
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, children, isOpen, onToggle }) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={onToggle}
      >
        <h4 className="font-semibold text-gray-700">{title}</h4>
        <ChevronDown
          className={`h-5 w-5 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && <div className="p-4 grid grid-cols-2 gap-4">{children}</div>}
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
  const [customTimeline, setCustomTimeline] = useState("");
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
  const [gender, setGender] = useState("");
  const [nationality, setNationality] = useState("");
  const [topic, setTopic] = useState("");
  const [otherInfo, setOtherInfo] = useState("");
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    {
      "Learning Ability": true,
      "Attention & Focus": false,
      "Engagement & Interaction": false,
    }
  );

  const goalCategories: GoalCategory[] = [
    {
      label: "Academic Goals",
      examples: [
        "Improve test scores",
        "Master specific topics",
        "Complete assignments on time",
      ],
    },
    {
      label: "Skill Development",
      examples: [
        "Enhance problem-solving",
        "Improve critical thinking",
        "Develop study habits",
      ],
    },
    {
      label: "Personal Growth",
      examples: [
        "Build confidence",
        "Increase participation",
        "Better time management",
      ],
    },
  ];

  const timelineOptions = [
    { value: "2_weeks", label: "2 Weeks", duration: "2 weeks" },
    { value: "1_month", label: "1 Month", duration: "1 month" },
    { value: "3_months", label: "3 Months", duration: "3 months" },
    { value: "6_months", label: "6 Months", duration: "6 months" },
    { value: "custom", label: "Custom Timeline", duration: "" },
  ];

  type SubjectKeys =
    | "Mathematics"
    | "Science"
    | "Languages"
    | "Social Studies"
    | "Art & Creative Skills";

  const cognitiveParamsCategories = {
    "Learning Ability": [
      "Comprehension",
      "Understands instructions",
      "Grasps new concepts",
      "Retains information",
    ],
    "Attention & Focus": [
      "Attention",
      "Focus duration",
      "Task completion",
      "Follows routines",
    ],
    "Engagement & Interaction": [
      "Participation",
      "Class engagement",
      "Asks questions",
      "Group work",
    ],
  };

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
    {
      id: 4,
      title: "Results",
      description: "Learning Plan",
    },
  ];

  const handleRatingChange = (param: string, value: string): void => {
    setRatings((prev) => ({ ...prev, [param]: value }));
  };

  const getEffectiveTimeline = () => {
    if (timeline === "custom") {
      return customTimeline;
    }
    return (
      timelineOptions.find((opt) => opt.value === timeline)?.duration || ""
    );
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
    if (!timeline) {
      newErrors.timeline = "Timeline is required";
    } else if (timeline === "custom" && !customTimeline) {
      newErrors.timeline = "Please enter a custom timeline";
    }

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
    const effectiveTimeline = getEffectiveTimeline();
    try {
      const response = await fetch("/api/generate-plp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          age,
          gender,
          nationality,
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
          timeline: effectiveTimeline,
          topic,
          otherInfo,
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
    if (currentStep === 2 && learningPlan) {
      setCurrentStep(3);
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, 2));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Add print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content,
          .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>

      {/* Existing header */}
      <div className="flex items-center gap-4 mb-6 no-print">
        <Link href="/tools" className="hover:opacity-75">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-bold">Personalized Learning Planner</h1>
      </div>

      {/* Step indicator */}
      <div className="no-print">
        <StepIndicator steps={steps} currentStep={currentStep} />
      </div>

      {/* Loading skeleton */}
      {isLoading && <LoadingSkeleton />}

      {!isLoading && (
        <>
          {/* Steps 0-2 with no-print class */}
          <div className="no-print">
            {currentStep === 0 && (
              <Card className="w-full max-w-6xl mx-auto shadow-lg">
                <CardHeader>
                  <CardTitle>Student Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-1">
                        Full Name
                        <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-400">
                          (as per records)
                        </span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="Enter student's full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`${errors.name ? "border-red-500" : ""} transition-colors`}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="grade"
                        className="flex items-center gap-1"
                      >
                        Grade/Class
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={grade}
                        onValueChange={(value) => setGrade(value)}
                      >
                        <SelectTrigger
                          id="grade"
                          className={`${errors.grade ? "border-red-500" : ""} transition-colors`}
                        >
                          <SelectValue placeholder="Select current grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(12)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              Grade {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.grade && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.grade}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age" className="flex items-center gap-1">
                        Age
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        min="3"
                        max="20"
                        placeholder="Enter age in years"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className={`${errors.age ? "border-red-500" : ""} transition-colors`}
                      />
                      {errors.age && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.age}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer-not-to-say">
                            Prefer not to say
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="board"
                        className="flex items-center gap-1"
                      >
                        Education Board
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select value={board} onValueChange={setBoard}>
                        <SelectTrigger
                          id="board"
                          className={`${errors.board ? "border-red-500" : ""} transition-colors`}
                        >
                          <SelectValue placeholder="Select education board" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CBSE">CBSE</SelectItem>
                          <SelectItem value="ICSE">ICSE</SelectItem>
                          <SelectItem value="State">State Board</SelectItem>
                          <SelectItem value="IB">IB</SelectItem>
                          <SelectItem value="IGCSE">IGCSE</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.board && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.board}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nationality">Nationality</Label>
                      <Input
                        id="nationality"
                        placeholder="Enter nationality"
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 mt-4">
                    <span className="text-red-500">*</span> Required fields
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 1 && (
              <Card className="w-full max-w-6xl mx-auto shadow-lg">
                <CardContent className="space-y-8 pt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Cognitive Parameters
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(cognitiveParamsCategories).map(
                        ([category, params]) => (
                          <CategorySection
                            key={category}
                            title={category}
                            isOpen={openCategories[category]}
                            onToggle={() =>
                              setOpenCategories((prev) => ({
                                ...prev,
                                [category]: !prev[category],
                              }))
                            }
                          >
                            {params.map((param) => (
                              <ParameterCard
                                key={param}
                                param={param}
                                selected={selectedCognitiveParams.includes(
                                  param
                                )}
                                rating={ratings[param] || ""}
                                onSelect={() => {
                                  setSelectedCognitiveParams((prev) =>
                                    prev.includes(param)
                                      ? prev.filter((p) => p !== param)
                                      : [...prev, param]
                                  );
                                }}
                                onRatingChange={(value) =>
                                  handleRatingChange(param, value)
                                }
                              />
                            ))}
                          </CategorySection>
                        )
                      )}
                    </div>
                    {errors.cognitive && (
                      <p className="text-red-500 text-sm">{errors.cognitive}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Knowledge Parameters
                    </h3>
                    <Select
                      value={selectedSubject}
                      onValueChange={(value) => {
                        setSelectedSubject(value as SubjectKeys);
                        setSelectedKnowledgeParams([]);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(subjects).map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedSubject && (
                      <div className="grid grid-cols-2 gap-4">
                        {subjects[selectedSubject].map((param) => (
                          <ParameterCard
                            key={param}
                            param={param}
                            selected={selectedKnowledgeParams.includes(param)}
                            rating={ratings[param] || ""}
                            onSelect={() => {
                              setSelectedKnowledgeParams((prev) =>
                                prev.includes(param)
                                  ? prev.filter((p) => p !== param)
                                  : [...prev, param]
                              );
                            }}
                            onRatingChange={(value) =>
                              handleRatingChange(param, value)
                            }
                          />
                        ))}
                      </div>
                    )}
                    {errors.knowledge && (
                      <p className="text-red-500 text-sm">{errors.knowledge}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="w-full max-w-6xl mx-auto shadow-lg">
                <CardContent className="space-y-8 pt-6">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="goals"
                          className="text-lg font-semibold"
                        >
                          Learning Goals
                        </Label>
                        <span className="text-red-500">*</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Define specific, measurable, and achievable goals for
                        the learning period. Consider including goals from
                        different categories below:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {goalCategories.map((category) => (
                          <div
                            key={category.label}
                            className="p-4 bg-muted rounded-lg"
                          >
                            <h4 className="font-medium mb-2">
                              {category.label}
                            </h4>
                            <ul className="text-sm text-muted-foreground list-disc pl-4">
                              {category.examples.map((example, i) => (
                                <li key={i}>{example}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      <textarea
                        className={`w-full p-3 border rounded-lg h-32 ${
                          errors.goals ? "border-red-500" : "border-input"
                        }`}
                        placeholder="Enter your learning goals, considering the categories above..."
                        value={goals}
                        onChange={(e) => setGoals(e.target.value)}
                      />
                      {errors.goals && (
                        <p className="text-red-500 text-sm">{errors.goals}</p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="timeline"
                          className="text-lg font-semibold"
                        >
                          Timeline
                        </Label>
                        <span className="text-red-500">*</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Select the duration for achieving these learning goals
                      </p>
                      <Select
                        value={timeline}
                        onValueChange={(value) => {
                          setTimeline(value);
                          if (value !== "custom") {
                            setCustomTimeline("");
                          }
                        }}
                      >
                        <SelectTrigger
                          className={`w-full ${errors.timeline ? "border-red-500" : ""}`}
                        >
                          <SelectValue placeholder="Select timeline duration">
                            {timeline === "custom"
                              ? customTimeline || "Enter custom timeline"
                              : timelineOptions.find(
                                  (opt) => opt.value === timeline
                                )?.label}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {timelineOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {timeline === "custom" && (
                        <div className="space-y-2">
                          <Input
                            placeholder="e.g., 6 weeks, 2.5 months"
                            value={customTimeline}
                            onChange={(e) => setCustomTimeline(e.target.value)}
                            className={`mt-2 ${errors.timeline ? "border-red-500" : ""}`}
                          />
                          <p className="text-xs text-muted-foreground">
                            Please specify the duration in weeks or months
                          </p>
                        </div>
                      )}
                      {errors.timeline && (
                        <p className="text-red-500 text-sm">
                          {errors.timeline}
                        </p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="topic" className="text-lg font-semibold">
                        Specific Topic Focus
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Specify any particular topics or subjects that need
                        special attention
                      </p>
                      <Input
                        id="topic"
                        placeholder="E.g., Algebra fundamentals, Reading comprehension, Scientific method"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                      />
                    </div>

                    <div className="space-y-4">
                      <Label
                        htmlFor="otherInfo"
                        className="text-lg font-semibold"
                      >
                        Additional Information
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Include any learning preferences, challenges, or
                        specific requirements that should be considered
                      </p>
                      <textarea
                        className="w-full p-3 border rounded-lg h-32 border-input"
                        placeholder="E.g., Preferred learning style, specific challenges, accommodations needed..."
                        value={otherInfo}
                        onChange={(e) => setOtherInfo(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Step 3 - Learning Plan with print-content class */}
          {currentStep === 3 && learningPlan && (
            <Card className="w-full max-w-6xl mx-auto shadow-lg animate-fade-in print-content">
              <CardHeader>
                <CardTitle>Learning Plan for {name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Learning plan content */}
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
        </>
      )}

      {/* Navigation buttons with no-print class */}
      <div className="flex justify-end gap-4 mt-6 mr-14 no-print">
        {currentStep > 0 && (
          <Button variant="outline" onClick={prevStep}>
            Previous
          </Button>
        )}
        {currentStep < 2 && <Button onClick={nextStep}>Next</Button>}
        {currentStep === 2 && (
          <Button
            onClick={async () => {
              await handleSubmit();
              if (learningPlan) {
                nextStep();
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? "Generating Plan..." : "Generate Learning Plan"}
          </Button>
        )}
        {currentStep === 3 && learningPlan && (
          <Button onClick={() => window.print()} variant="outline">
            Print Plan
          </Button>
        )}
      </div>
    </div>
  );
};

export default StudentAssessmentForm;
