"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Trash2, ChevronLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { generateLessonPlan } from "../actions/generateLessonPlan";
import { useToast } from "@/hooks/use-toast";
import {
  countries,
  boardsByCountry,
  subjects,
} from "@/app/constants/education-data";
import { LessonPlanFormData, LessonPlanResponse } from "../types";

const supabase = createClient();

export default function DynamicLessonPlanner() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  const [country, setCountry] = useState("");
  const [board, setBoard] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");

  useEffect(() => {
    fetchLessonPlans();
  }, []);

  const fetchLessonPlans = async () => {
    const { data, error } = await supabase
      .from("lesson_plans")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching lesson plans:", error);
      toast({
        title: "Error",
        description: "Failed to fetch lesson plans. Please try again.",
        variant: "destructive",
      });
    } else {
      setLessonPlans(data || []);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      const formValues = Object.fromEntries(
        formData
      ) as unknown as LessonPlanFormData;

      // Validate required fields
      const requiredFields: (keyof LessonPlanFormData)[] = [
        "country",
        "board",
        "subject",
        "grade",
        "chapterTopic",
        "classDuration",
        "numberOfDays",
      ];

      for (const field of requiredFields) {
        if (!formValues[field]) {
          throw new Error(
            `${field.replace(/([A-Z])/g, " $1").toLowerCase()} is required`
          );
        }
      }

      const lessonPlan = await generateLessonPlan(formData);

      if (!lessonPlan || !lessonPlan.plan_data) {
        throw new Error("Received empty or invalid lesson plan");
      }

      console.log("Lesson plan generated and stored successfully");
      router.push(`/tools/lesson-planner/output?id=${lessonPlan.id}`);
    } catch (error) {
      console.error("Error generating lesson plan:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setError(`Failed to generate lesson plan: ${errorMessage}`);
      toast({
        title: "Error",
        description: `Failed to generate lesson plan: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("lesson_plans")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Lesson plan deleted successfully.",
      });

      // Refresh the lesson plans list
      await fetchLessonPlans();
    } catch (error) {
      console.error("Error deleting lesson plan:", error);
      toast({
        title: "Error",
        description: "Failed to delete lesson plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
      <Link href="/tools">
        <Button variant="outline" className="mb-2 border-neutral-500">
          ← Back
        </Button>
      </Link>

      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold text-rose-500">
          Lesson Plan Generator
        </h1>
        <p className="text-muted-foreground text-lg">
          Creates structured and optimized lesson plans for educators based on
          the subject, topic, grade, lesson objectives and duration provided.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg border-2">
          <CardContent className="p-6 space-y-8">
            {/* Top Section - Dropdowns */}
            <div className="space-y-6">
              {/* First Row - Country and Board */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label
                    htmlFor="countrySelect"
                    className="text-base font-semibold"
                  >
                    Country
                  </Label>
                  <Select
                    name="country"
                    value={country}
                    onValueChange={(value) => {
                      setCountry(value);
                      setBoard("");
                    }}
                  >
                    <SelectTrigger className="w-full h-11 bg-white">
                      <SelectValue placeholder="Select country..." />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="boardSelect"
                    className="text-base font-semibold"
                  >
                    Educational Board
                  </Label>
                  <Select name="board" value={board} onValueChange={setBoard}>
                    <SelectTrigger className="w-full h-11 bg-white">
                      <SelectValue placeholder="Select board..." />
                    </SelectTrigger>
                    <SelectContent>
                      {country &&
                        boardsByCountry[country]?.map((board) => (
                          <SelectItem key={board.value} value={board.value}>
                            {board.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Second Row - Subject and Grade */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label
                    htmlFor="subjectSelect"
                    className="text-base font-semibold"
                  >
                    Subject
                  </Label>
                  <Select
                    name="subject"
                    value={subject}
                    onValueChange={setSubject}
                  >
                    <SelectTrigger className="w-full h-11 bg-white">
                      <SelectValue placeholder="Select subject..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.value} value={subject.value}>
                          {subject.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="gradeSelect"
                    className="text-base font-semibold"
                  >
                    Grade
                  </Label>
                  <Select name="grade" value={grade} onValueChange={setGrade}>
                    <SelectTrigger className="w-full h-11 bg-white">
                      <SelectValue placeholder="Select grade..." />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(12)].map((_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          Grade {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bottom Section - Inputs */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="chapterTopic"
                    className="text-base font-semibold"
                  >
                    Lesson
                  </Label>
                  <Input
                    id="chapterTopic"
                    name="chapterTopic"
                    className="h-11 bg-white"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label
                      htmlFor="classDuration"
                      className="text-base font-semibold"
                    >
                      Class Duration (Minutes)
                    </Label>
                    <Input
                      id="classDuration"
                      name="classDuration"
                      type="number"
                      className="h-11 bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="numberOfDays"
                      className="text-base font-semibold"
                    >
                      Number of Days
                    </Label>
                    <Select name="numberOfDays">
                      <SelectTrigger className="h-11 bg-white">
                        <SelectValue placeholder="Select days..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 30 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="learningObjectives"
                    className="text-base font-semibold"
                  >
                    Learning Objectives (Optional)
                  </Label>
                  <Textarea
                    id="learningObjectives"
                    name="learningObjectives"
                    placeholder="Enter learning objectives..."
                    className="bg-white"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-fit h-10 text-base font-semibold bg-rose-500 hover:bg-rose-600"
            >
              {isLoading ? "Generating Plan..." : "Generate Lesson Plan"}
            </Button>
          </CardContent>
        </Card>
      </form>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Existing Lesson Plans</CardTitle>
        </CardHeader>
        <CardContent>
          {lessonPlans.length === 0 ? (
            <p>No lesson plans found.</p>
          ) : (
            <ul className="space-y-4">
              {lessonPlans.map((plan) => (
                <li key={plan.id} className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(`/tools/lesson-planner/output?id=${plan.id}`)
                    }
                  >
                    {plan.subject} - {plan.chapter_topic} (Grade {plan.grade})
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(plan.id)}
                    title="Delete Lesson Plan"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
