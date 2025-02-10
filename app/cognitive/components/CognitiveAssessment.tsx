"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface AssessmentField {
  category: string;
  name: string;
  label: string;
  description: string;
}

const assessmentFields: AssessmentField[] = [
  // Comprehension
  {
    category: "Comprehension",
    name: "comprehension_instructions",
    label: "Understanding Instructions",
    description: "Ability to understand and follow instructions",
  },
  {
    category: "Comprehension",
    name: "comprehension_concepts",
    label: "Grasping New Concepts",
    description: "Ability to understand and apply new concepts",
  },
  {
    category: "Comprehension",
    name: "comprehension_retention",
    label: "Information Retention",
    description: "Ability to retain and recall information",
  },
  // Attention
  {
    category: "Attention",
    name: "attention_focus",
    label: "Focus Duration",
    description: "Ability to maintain focus on tasks",
  },
  {
    category: "Attention",
    name: "attention_completion",
    label: "Task Completion",
    description: "Ability to complete assigned tasks",
  },
  {
    category: "Attention",
    name: "attention_routines",
    label: "Following Routines",
    description: "Ability to follow established routines",
  },
  // Participation
  {
    category: "Participation",
    name: "participation_engagement",
    label: "Class Engagement",
    description: "Level of engagement in class activities",
  },
  {
    category: "Participation",
    name: "participation_questions",
    label: "Asking Questions",
    description: "Frequency and quality of questions asked",
  },
  {
    category: "Participation",
    name: "participation_groupwork",
    label: "Group Work",
    description: "Participation and contribution in group activities",
  },
];

export function CognitiveAssessment({
  studentEmail,
}: {
  studentEmail: string;
}) {
  const router = useRouter();
  const [isComplete, setIsComplete] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchExistingAssessment();
  }, [studentEmail]);

  const checkAssessmentCompleteness = (
    assessmentScores: Record<string, number>
  ) => {
    return assessmentFields.every((field) => assessmentScores[field.name]);
  };

  const fetchExistingAssessment = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("cognitive_assessments")
      .select("*")
      .eq("student_email", studentEmail)
      .order("assessment_date", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // Handle "no rows" case differently than other errors
      if (error.code === "PGRST116") {
        setLoading(false);
        return;
      }

      console.error("Error fetching assessment:", error);
      setMessage({ type: "error", text: "Failed to load existing assessment" });
    } else if (data) {
      const assessmentScores: Record<string, number> = {};
      // Extract only the score fields
      assessmentFields.forEach((field) => {
        if (data[field.name]) {
          assessmentScores[field.name] = data[field.name];
        }
      });
      setScores(assessmentScores);
      setLastUpdated(new Date(data.assessment_date).toLocaleDateString());
      // Check if existing assessment is complete
      setIsComplete(checkAssessmentCompleteness(assessmentScores));
    }
    setLoading(false);
  };

  const handleScoreChange = (fieldName: string, value: number) => {
    setScores((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    // Use upsert with student_email as the key
    const { error } = await supabase.from("cognitive_assessments").upsert(
      {
        student_email: studentEmail,
        ...scores,
        assessment_date: new Date().toISOString(),
      },
      {
        onConflict: "student_email",
      }
    );

    setSaving(false);
    if (error) {
      setMessage({ type: "error", text: "Failed to save assessment" });
    } else {
      setMessage({ type: "success", text: "Assessment saved successfully" });
      setLastUpdated(new Date().toLocaleDateString());
      // Check if assessment is complete after saving
      setIsComplete(checkAssessmentCompleteness(scores));
    }
  };

  const calculateProgress = () => {
    const totalFields = assessmentFields.length;
    const completedFields = Object.keys(scores).length;
    return Math.round((completedFields / totalFields) * 100);
  };

  if (loading) {
    return (
      <div className="mt-4 animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <Card className="mt-4">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Cognitive Assessment</h2>
            {lastUpdated && (
              <p className="text-sm text-gray-600">
                Last updated: {lastUpdated}
              </p>
            )}
          </div>
          <Progress value={calculateProgress()} className="w-[120px]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {["Comprehension", "Attention", "Participation"].map((category) => (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">{category}</h3>
              {assessmentFields
                .filter((field) => field.category === category)
                .map((field) => (
                  <div key={field.name} className="space-y-2">
                    <div>
                      <Label className="font-medium">{field.label}</Label>
                      <p className="text-sm text-gray-600">
                        {field.description}
                      </p>
                    </div>
                    <RadioGroup
                      defaultValue={scores[field.name]?.toString()}
                      onValueChange={(value) =>
                        handleScoreChange(field.name, parseInt(value))
                      }
                      className="flex gap-4"
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <div
                          key={value}
                          className="flex items-center space-x-1"
                        >
                          <RadioGroupItem
                            value={value.toString()}
                            id={`${field.name}-${value}`}
                          />
                          <Label htmlFor={`${field.name}-${value}`}>
                            {value}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
            </div>
          ))}

          {message && (
            <div
              className={`p-3 rounded text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 
                       disabled:bg-blue-300 transition-colors"
            >
              {saving ? "Saving..." : "Save Assessment"}
            </button>
          </div>
        </form>
      </div>
      {isComplete && (
        <div className="fixed bottom-8 right-8">
          <button
            onClick={() => router.push("/profile")}
            className="bg-green-600 text-white px-6 py-3 rounded-full 
                     shadow-lg hover:bg-green-700 transition-colors
                     flex items-center space-x-2"
          >
            <span>Go to App</span>
            <svg
              className="w-5 h-5"
              fill="none"
              strokeWidth="2"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      )}
    </Card>
  );
}
