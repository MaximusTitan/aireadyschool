"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import { supabase } from "@/app/dat/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// Add Rating interface
interface Rating {
  presentation_skills: number;
  usefulness: number;
  process_explanation?: number;
  functionality?: number;
  ai_utilization: number;
  total_score: number;
  round: string;
}

interface Idea {
  id: string;
  title: string;
  brief_description: string;
  why_this_idea: string;
  how_get_this_idea: string;
  created_at: string;
}

interface Submission {
  presentation_link?: string;
  prototype_link?: string;
}

function StudentSubmissionView({ studentId }: { studentId: string }) {
  const [idea, setIdea] = useState<Idea | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [presentationVisible, setPresentationVisible] = useState(false);
  const [judgeId, setJudgeId] = useState<string | null>(null);
  const [selectedRound] = useState<string>(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("selectedRound") || "Round 1"
      : "Round 1"
  );
  const [ratings, setRatings] = useState<{ [key: string]: Rating }>({});
  const router = useRouter();

  useEffect(() => {
    localStorage.setItem("selectedRound", selectedRound);
  }, [selectedRound]);

  const fetchData = useCallback(async () => {
    try {
      // Get judge details first
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: judgeData } = await supabase
        .from("dat_judge_details")
        .select("id, round")
        .eq("email", user.email)
        .single();

      if (judgeData) {
        setJudgeId(judgeData.id);
        // Get existing rating
        const { data: ratingData } = await supabase
          .from("dat_student_ratings")
          .select("*")
          .eq("student_id", studentId)
          .eq("judge_id", judgeData.id)
          .eq("round", selectedRound)
          .single();

        if (ratingData) {
          setRatings({
            [studentId]: {
              presentation_skills: ratingData.presentation_skills,
              usefulness: ratingData.usefulness,
              process_explanation: ratingData.process_explanation,
              functionality: ratingData.functionality,
              ai_utilization: ratingData.ai_utilization,
              total_score: ratingData.total_score,
              round: ratingData.round,
            },
          });
        } else {
          setRatings({});
        }
      }

      // Fetch idea details and submissions
      const [ideaRes, presentationRes, prototypeRes] = await Promise.all([
        supabase
          .from("dat_ideas")
          .select("*")
          .eq("student_id", studentId)
          .single(),
        supabase
          .from("dat_presentation_links")
          .select("presentation_link")
          .eq("student_id", studentId)
          .single(),
        supabase
          .from("dat_prototype_links")
          .select("prototype_link")
          .eq("student_id", studentId)
          .single(),
      ]);

      if (ideaRes.data) {
        setIdea(ideaRes.data);
      }

      setSubmission({
        presentation_link: presentationRes.data?.presentation_link,
        prototype_link: prototypeRes.data?.prototype_link,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [studentId, selectedRound, router]);

  useEffect(() => {
    fetchData();
  }, [studentId, selectedRound, router, fetchData]);

  const calculateTotalScore = (ratingFields: Partial<Rating>) => {
    const fields = [
      "presentation_skills",
      "usefulness",
      "process_explanation",
      "functionality",
      "ai_utilization",
    ];
    const scores = fields
      .map((field) => ratingFields[field as keyof Rating])
      .filter((score) => typeof score === "number") as number[];
    const total = scores.reduce((sum, score) => sum + score, 0);
    const count = scores.length;
    return count > 0 ? total / count : 0;
  };

  const handleRatingChange = (field: keyof Rating, value: string) => {
    const numValue =
      value === "" ? 0 : Math.min(Math.max(parseInt(value) || 0, 0), 10);

    const newRatings = {
      ...ratings,
      [studentId]: {
        ...ratings[studentId],
        [field]: numValue,
        round: selectedRound,
      },
    };

    if (numValue > 0) {
      newRatings[studentId].total_score = calculateTotalScore(
        newRatings[studentId]
      );
    }
    setRatings(newRatings);
  };

  const handleRatingSubmit = async () => {
    try {
      const rating = ratings[studentId];
      if (!rating || !judgeId) return;

      const newRating = {
        student_id: studentId,
        judge_id: judgeId,
        round: selectedRound,
        presentation_skills: rating.presentation_skills ?? 0,
        usefulness: rating.usefulness ?? 0,
        ai_utilization: rating.ai_utilization ?? 0,
        total_score: rating.total_score ?? 0,
        ...(selectedRound === "Round 1"
          ? { process_explanation: rating.process_explanation ?? 0 }
          : { functionality: rating.functionality ?? 0 }),
      };

      const { error } = await supabase
        .from("dat_student_ratings")
        .upsert(newRating, {
          onConflict: "student_id,judge_id,round",
        });

      if (error) throw error;

      // Refresh data after successful submission
      await fetchData();
      alert("Rating submitted successfully!");
    } catch (error) {
      console.error("Error saving rating:", error);
      alert("Failed to save rating");
    }
  };

  // Add Rating Form Component
  const renderRatingForm = () => {
    const existingRating = ratings[studentId] || {};
    const isRound1 = selectedRound === "Round 1";

    return (
      <Card className="mt-6 border-rose-200">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-rose-600 mb-4">
            Rate Submission
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Presentation Skills (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                onKeyDown={(e) => {
                  if (
                    e.key === "e" ||
                    e.key === "+" ||
                    e.key === "-" ||
                    e.key === "."
                  ) {
                    e.preventDefault();
                  }
                }}
                value={existingRating.presentation_skills || ""}
                onChange={(e) =>
                  handleRatingChange("presentation_skills", e.target.value)
                }
              />
            </div>
            <div>
              <Label>Usefulness (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={existingRating.usefulness || ""}
                onChange={(e) =>
                  handleRatingChange("usefulness", e.target.value)
                }
              />
            </div>
            {isRound1 ? (
              <div>
                <Label>Process Explanation (1-10)</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={existingRating.process_explanation || ""}
                  onChange={(e) =>
                    handleRatingChange("process_explanation", e.target.value)
                  }
                />
              </div>
            ) : (
              <div>
                <Label>Functionality (1-10)</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={existingRating.functionality || ""}
                  onChange={(e) =>
                    handleRatingChange("functionality", e.target.value)
                  }
                />
              </div>
            )}
            <div>
              <Label>AI Utilization (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={existingRating.ai_utilization || ""}
                onChange={(e) =>
                  handleRatingChange("ai_utilization", e.target.value)
                }
              />
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div className="text-lg font-semibold">
              Total Score:{" "}
              {ratings[studentId]?.total_score?.toFixed(2) || "0.00"}
            </div>
            <Button
              onClick={handleRatingSubmit}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {ratings[studentId] ? "Update Rating" : "Submit Rating"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Add this helper function to get embed URL
  const formatPresentationLink = (url: string) => {
    if (url.includes("docs.google.com/presentation")) {
      const baseUrl = url
        .split("/edit")[0]
        .split("/preview")[0]
        .split("/embed")[0];
      return `${baseUrl}/embed`;
    }
    return url;
  };

  if (loading) {
    return <div>Loading submission details...</div>;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
      <div className="container mx-auto p-6">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-rose-600">
              Student Submission
            </h1>
            <p className="text-gray-600">
              Review the student&apos;s idea and materials
            </p>
          </div>
        </div>

        {/* Move Rating Form to top */}
        {renderRatingForm()}

        {/* Idea Section */}
        {idea && (
          <Card className="mt-6 border-rose-200">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-rose-600 mb-4">
                {idea.title}
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">
                    Brief Description
                  </h3>
                  <p className="text-gray-600">{idea.brief_description}</p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900">Why This Idea?</h3>
                  <p className="text-gray-600">{idea.why_this_idea}</p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900">
                    How Did You Get This Idea?
                  </h3>
                  <p className="text-gray-600">{idea.how_get_this_idea}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Presentation Section */}
        {submission?.presentation_link && (
          <Card className="mt-6 border-rose-200">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-rose-600">
                  Presentation
                </h2>
                <Button
                  variant="outline"
                  onClick={() => setPresentationVisible(!presentationVisible)}
                  className="w-fit"
                >
                  {presentationVisible
                    ? "Hide Presentation"
                    : "View Presentation"}
                </Button>
              </div>

              {presentationVisible && (
                <div className="aspect-video w-full max-w-3xl mx-auto bg-gray-100 rounded-lg overflow-hidden mt-4">
                  <iframe
                    src={formatPresentationLink(submission.presentation_link)}
                    title="Presentation"
                    width="100%"
                    height="100%"
                    style={{ border: "none" }}
                    allowFullScreen
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Prototype Section */}
        {submission?.prototype_link && (
          <Card className="mt-6 border-rose-200">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-rose-600">
                  Prototype
                </h2>
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(submission.prototype_link, "_blank")
                  }
                  className="w-fit"
                >
                  View Prototype
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Page component
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params using React.use()
  const resolvedParams = React.use(params);
  const studentId = resolvedParams.id;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudentSubmissionView studentId={studentId} />
    </Suspense>
  );
}
