"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { generateLessonPlan } from "../actions/generateLessonPlan";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Trash2, ChevronLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

const supabase = createClient();

export default function DynamicLessonPlanner() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lessonPlans, setLessonPlans] = useState<any[]>([]);

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

  const fields = [
    { label: "Subject", name: "subject" },
    { label: "Chapter/Topic", name: "chapterTopic" },
    {
      label: "Grade",
      name: "grade",
      type: "select",
      options: Array.from({ length: 12 }, (_, i) => ({
        value: String(i + 1),
        label: String(i + 1),
      })),
    },
    { label: "Board", name: "board" },
    { label: "Class Duration (minutes)", name: "classDuration" },
    {
      label: "No. of Days",
      name: "numberOfDays",
      type: "select",
      options: Array.from({ length: 30 }, (_, i) => ({
        value: String(i + 1),
        label: String(i + 1),
      })),
    },
  ];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      console.log("Submitting form data:", Object.fromEntries(formData));
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
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-4 mb-6 ml-4 w-full max-w-6xl">
        <Link
          href="/tools/lesson-planner"
          className="hover:opacity-75 transition-opacity"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-3xl font-semibold">Lesson Plan Generator</h1>
      </div>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Lesson Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                {field.type === "select" ? (
                  <Select name={field.name} required>
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder={`Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={field.name}
                    name={field.name}
                    type={field.type || "text"}
                    required
                  />
                )}
              </div>
            ))}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="learningObjectives">
                Learning Objectives (Optional)
              </Label>
              <Textarea
                id="learningObjectives"
                name="learningObjectives"
                placeholder="Enter learning objectives (optional)"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Generating Lesson Plan..." : "Generate Lesson Plan"}
        </Button>
      </form>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Existing Lesson Plans</CardTitle>
        </CardHeader>
        <CardContent>
          {lessonPlans.length === 0 ? (
            <p>No lesson plans found.</p>
          ) : (
            <ul className="space-y-2">
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
