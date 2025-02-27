"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  ChevronLeft,
  AlertTriangle,
  Clock,
  BookOpen,
  ClipboardList,
  BarChart,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

const supabase = createClient();

interface ScheduleItem {
  type: "introduction" | "mainContent" | "activity" | "conclusion";
  title: string;
  content: string;
  timeAllocation: number;
}

interface Assignment {
  description: string;
  tasks: string[];
}

interface Day {
  day: number;
  topicHeading: string;
  learningOutcomes: string[];
  schedule: ScheduleItem[];
  teachingAids: string[];
  assignment: Assignment;
}

interface Assessment {
  topic: string;
  type: string;
  description: string;
  evaluationCriteria: string[];
}

interface AssessmentPlan {
  formativeAssessments: Assessment[];
  summativeAssessments: Assessment[];
  progressTrackingSuggestions: string[];
}

interface RemedialStrategy {
  targetGroup: string;
  strategy: string;
  description: string;
}

interface LessonPlan {
  id: string;
  subject: string;
  chapter_topic: string;
  grade: string;
  board: string;
  class_duration: number;
  number_of_days: number;
  learning_objectives: string;
  plan_data: {
    days: Day[];
    assessmentPlan: AssessmentPlan;
    remedialStrategies: RemedialStrategy[];
  };
}

export default function OutputContent() {
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState<string>("");

  useEffect(() => {
    const fetchLessonPlan = async () => {
      if (!id) {
        setError("No lesson plan ID provided");
        return;
      }

      const { data, error } = await supabase
        .from("lesson_plans")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching lesson plan:", error);
        setError("Failed to fetch lesson plan. Please try again.");
      } else if (data) {
        setLessonPlan(data as LessonPlan);
      } else {
        setError("Lesson plan not found");
      }
    };

    fetchLessonPlan();
  }, [id]);

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Error</h1>
        <p>{error}</p>
        <Button onClick={() => router.push("/")} className="mt-4">
          Create New Lesson Plan
        </Button>
      </div>
    );
  }

  if (!lessonPlan) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Loading...</h1>
      </div>
    );
  }

  const handleDayClick = (day: Day) => {
    setSelectedDay(day);
  };

  const handleBackClick = () => {
    setSelectedDay(null);
  };

  const handleEditClick = (index: number, content: string) => {
    setEditingIndex(index);
    setEditedContent(content);
  };

  const updateLessonPlan = async (lessonPlanId: string, updatedLessonPlan: any) => {
    const { error } = await supabase
      .from("lesson_plans")
      .update({ plan_data: updatedLessonPlan.plan_data }) // Ensure this matches your DB schema
      .eq("id", lessonPlanId);

    if (error) {
      console.error("Error updating lesson plan:", error);
      toast.error("Failed to update lesson plan. Please try again.");
    } else {
      toast.success("Lesson plan updated successfully.");
    }
  };

  const handleSaveClick = async (lessonPlanId: string, lessonPlan: any, editingIndex: number | null, editedContent: string) => {
    if (editingIndex === null || !lessonPlan) return;

    const updatedLessonPlan = { ...lessonPlan };
    updatedLessonPlan.plan_data.days.forEach((day: Day) => {
      day.schedule.forEach((item: ScheduleItem, idx: number) => {
        if (idx === editingIndex) {
          item.content = editedContent;
        }
      });
    });

    // Update local state
    setLessonPlan(updatedLessonPlan);
    setEditingIndex(null);

    // Update database
    await updateLessonPlan(lessonPlanId, updatedLessonPlan);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedContent(e.target.value);
  };
  const renderSchedule = (schedule: ScheduleItem[]) => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Lesson Content</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Options</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule
                .filter((item) => ["introduction", "mainContent"].includes(item.type))
                .map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {editingIndex === index ? (
                        <input
                          type="text"
                          value={editedContent}
                          onChange={handleInputChange}
                          className="border p-1"
                        />
                      ) : (
                        item.content
                      )}
                    </TableCell>
                    <TableCell>{item.timeAllocation} min</TableCell>
                    <TableCell>
                      {editingIndex === index ? (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSaveClick(lessonPlan.id, lessonPlan, editingIndex, editedContent)}
                        >
                          Save
                        </Button>

                      ) : (
                        <Button variant="default" size="sm" onClick={() => handleEditClick(index, item.content)}>
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}