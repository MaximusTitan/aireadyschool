"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/app/dat/utils/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { User, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Removed unused interfaces

interface Rating {
  presentation_skills: number;
  usefulness: number;
  process_explanation?: number;
  functionality?: number;
  ai_utilization: number;
  total_score: number;
  round: string; // Add round to Rating interface
}

type PresentationStatus =
  | "not_submitted"
  | "review_pending"
  | "update_needed"
  | "review_updated"
  | "rejected"
  | "qualified_for_round1"
  | "submit_presentation"
  | "round1_winner"
  | "round1_runner_up"
  | "qualified_for_round2"
  | "round2_winner"
  | "round2_runner_up";

interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
  school_name: string;
  idea_title: string;
  group: string;
  rating?: Rating;
  isExpanded?: boolean;
  presentation_status?: PresentationStatus;
}

const getGradeGroup = (grade: string): string => {
  const gradeNum = parseInt(grade);
  if (gradeNum === 5 || gradeNum === 6) return "A";
  if (gradeNum === 7 || gradeNum === 8) return "B";
  if (gradeNum === 9 || gradeNum === 10) return "C";
  if (gradeNum === 11 || gradeNum === 12) return "D";
  return "";
};

export default function JudgeDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [judgeId, setJudgeId] = useState<string | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(
    null
  );
  const [ratings, setRatings] = useState<{ [key: string]: Rating }>({});
  const [selectedRound, setSelectedRound] = useState<string>(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("selectedRound") || "Round 1"
      : "Round 1"
  );
  const [selectedGroup, setSelectedGroup] = useState<string>(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("selectedGroup") || ""
      : ""
  );
  const [judgeGroups, setJudgeGroups] = useState<string[]>([]);
  const [assignedRounds, setAssignedRounds] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    localStorage.setItem("selectedRound", selectedRound);
  }, [selectedRound]);

  useEffect(() => {
    localStorage.setItem("selectedGroup", selectedGroup);
  }, [selectedGroup]);

  const fetchJudgeDetailsAndStudents = useCallback(async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError)
        throw new Error(`Authentication error: ${userError.message}`);
      if (!user) {
        router.push("/sign-in");
        return;
      }

      const { data: judgeData, error: judgeError } = await supabase
        .from("dat_judge_details")
        .select("*")
        .eq("email", user.email)
        .single();

      if (judgeError)
        throw new Error(`Failed to fetch judge details: ${judgeError.message}`);
      if (!judgeData) throw new Error("Judge not found in database");

      setJudgeId(judgeData.id);
      setJudgeGroups(judgeData.groups || []);
      setAssignedRounds(judgeData.round || []); // Store assigned rounds

      // Set initial selected round to first assigned round if current selection is invalid
      if (!judgeData.round?.includes(selectedRound)) {
        const savedRound = localStorage.getItem("selectedRound");
        if (savedRound && judgeData.round?.includes(savedRound)) {
          setSelectedRound(savedRound);
        } else {
          setSelectedRound(judgeData.round?.[0] || "Round 1");
        }
      }

      // Set initial selected group if not set or invalid
      if (!selectedGroup || !judgeData.groups?.includes(selectedGroup)) {
        const savedGroup = localStorage.getItem("selectedGroup");
        if (savedGroup && judgeData.groups?.includes(savedGroup)) {
          setSelectedGroup(savedGroup);
        } else {
          setSelectedGroup(judgeData.groups?.[0] || "");
        }
      }

      if (judgeData.schools?.length > 0) {
        console.log("Judge Data:", {
          schools: judgeData.schools,
          groups: judgeData.groups,
          selectedGroup,
        });

        // Get all students from assigned schools
        const { data: studentsData, error: studentsError } = await supabase
          .from("dat_student_details")
          .select(
            `
            id,
            name,
            email,
            grade,
            school_name,
            group,
            school_id
          `
          )
          .in("school_id", judgeData.schools);

        if (studentsError)
          throw new Error(`Failed to fetch students: ${studentsError.message}`);

        console.log(
          "Raw students data:",
          studentsData?.map((s) => ({
            name: s.name,
            group: s.group,
            school: s.school_name,
          }))
        );

        // Get all presentations without status filtering
        const { data: presentationData } = await supabase
          .from("dat_presentation_links")
          .select("student_id, status, presentation_link")
          .in("student_id", studentsData?.map((s) => s.id) || []);

        // Get all prototypes without status filtering
        const { data: prototypeData } = await supabase
          .from("dat_prototype_links")
          .select("student_id, status, prototype_link")
          .in("student_id", studentsData?.map((s) => s.id) || []);

        // Get all ideas
        const { data: ideasData } = await supabase
          .from("dat_ideas")
          .select("student_id, title, status")
          .in("student_id", studentsData?.map((s) => s.id) || []);

        // Combine all data without filtering by status
        const processedStudents =
          studentsData
            ?.map((student) => {
              const presentation = presentationData?.find(
                (p) => p.student_id === student.id
              );
              const prototype = prototypeData?.find(
                (p) => p.student_id === student.id
              );
              const idea = ideasData?.find((i) => i.student_id === student.id);

              let relevantStatus: PresentationStatus = "not_submitted";

              // Determine status based on selected round
              if (selectedRound === "Round 1") {
                relevantStatus =
                  (presentation?.status as PresentationStatus) ||
                  "not_submitted";
              } else if (selectedRound === "Round 2") {
                // For Round 2, specifically look at prototype status
                relevantStatus =
                  (prototype?.status as PresentationStatus) || "not_submitted";
              } else if (selectedRound === "Finals") {
                relevantStatus =
                  (prototype?.status as PresentationStatus) || "not_submitted";
              }

              // Calculate the group based on grade
              const gradeGroup = getGradeGroup(student.grade);

              return {
                ...student,
                idea_title: idea?.title || "No title provided",
                presentation_status: relevantStatus,
                group: gradeGroup, // Override the group based on grade
              };
            })
            .filter((student) => {
              // First filter by round
              const roundFilter = (() => {
                switch (selectedRound) {
                  case "Round 1":
                    return (
                      student.presentation_status === "qualified_for_round1"
                    );
                  case "Round 2":
                    return (
                      student.presentation_status === "qualified_for_round2"
                    );
                  case "Finals":
                    return ["round2_winner", "round2_runner_up"].includes(
                      student.presentation_status
                    );
                  default:
                    return false;
                }
              })();

              // Updated group filtering - match based on grade groups
              const groupFilter = student.group === selectedGroup;

              // Debug log for troubleshooting
              console.log("Filtering student:", {
                name: student.name,
                studentGroup: student.group,
                selectedGroup,
                groupMatches: groupFilter,
                roundMatches: roundFilter,
                finalResult: roundFilter && groupFilter,
                groupComparison: {
                  studentGroup: student.group?.toUpperCase(),
                  selectedGroup: selectedGroup?.toUpperCase(),
                  matches:
                    student.group?.toUpperCase() ===
                    selectedGroup?.toUpperCase(),
                },
              });

              return roundFilter && groupFilter;
            }) || [];

        console.log(
          "Final filtered students:",
          processedStudents.map((s) => ({
            name: s.name,
            group: s.group,
            status: s.presentation_status,
          }))
        );

        setStudents(processedStudents);

        // Get existing ratings
        if (judgeData.id) {
          // Modify ratings fetching to include round
          const { data: ratingsData } = await supabase
            .from("dat_student_ratings")
            .select("*")
            .in(
              "student_id",
              processedStudents.map((s) => s.id)
            )
            .eq("judge_id", judgeData.id)
            .eq("round", selectedRound); // Filter by current round

          const initialRatings: { [key: string]: Rating } = {};
          ratingsData?.forEach((rating) => {
            initialRatings[rating.student_id] = {
              presentation_skills: rating.presentation_skills,
              usefulness: rating.usefulness,
              process_explanation: rating.process_explanation,
              functionality: rating.functionality,
              ai_utilization: rating.ai_utilization,
              total_score: rating.total_score,
              round: rating.round,
            };
          });
          setRatings(initialRatings);
        }
      }
    } catch (error) {
      console.error("Error in fetchJudgeDetailsAndStudents:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [router, selectedRound, selectedGroup]);

  useEffect(() => {
    fetchJudgeDetailsAndStudents();
  }, [fetchJudgeDetailsAndStudents]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  const handleViewSubmission = (studentId: string) => {
    router.push(`/dat/judge/submissions/${studentId}`);
  };

  const handleRatingSubmit = async (studentId: string) => {
    const rating = ratings[studentId];
    if (!rating || !judgeId) return;

    const newRating = {
      student_id: studentId,
      judge_id: judgeId,
      round: selectedRound, // Always use current selected round
      presentation_skills: rating.presentation_skills ?? 0,
      usefulness: rating.usefulness ?? 0,
      ai_utilization: rating.ai_utilization ?? 0,
      total_score: rating.total_score ?? 0,
      ...(selectedRound === "Round 1"
        ? { process_explanation: rating.process_explanation ?? 0 }
        : { functionality: rating.functionality ?? 0 }),
    };

    try {
      const { error } = await supabase
        .from("dat_student_ratings")
        .upsert(newRating, {
          onConflict: "student_id,judge_id,round", // Include round in conflict
        });

      if (error) throw error;
      await fetchJudgeDetailsAndStudents();
      setExpandedStudentId(null);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error saving rating:", error.message);
      } else {
        console.error("Error saving rating:", error);
      }
    }
  };

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

  const handleRatingChange = (
    studentId: string,
    field: keyof Rating,
    value: string
  ) => {
    // Allow empty string or convert to number and clamp between 1-10
    const numValue =
      value === "" ? 0 : Math.min(Math.max(parseInt(value) || 0, 0), 10);

    const newRatings = {
      ...ratings,
      [studentId]: {
        ...ratings[studentId],
        [field]: numValue,
      },
    };
    // Only calculate total if there are valid scores
    if (numValue > 0) {
      newRatings[studentId].total_score = calculateTotalScore(
        newRatings[studentId]
      );
    }
    setRatings(newRatings);
  };

  // Modify the rating form rendering to include the selected round
  const renderRatingForm = (student: Student) => {
    const existingRating = ratings[student.id] || {};
    const isRound1 = selectedRound === "Round 1"; // Use selectedRound instead of status

    return (
      <div className="mt-4 p-4 border-t">
        <div className="grid grid-cols-4 gap-4">
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
                handleRatingChange(
                  student.id,
                  "presentation_skills",
                  e.target.value
                )
              }
            />
          </div>
          <div>
            <Label>Usefulness (1-10)</Label>
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
              value={existingRating.usefulness || ""}
              onChange={(e) =>
                handleRatingChange(student.id, "usefulness", e.target.value)
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
                value={existingRating.process_explanation || ""}
                onChange={(e) =>
                  handleRatingChange(
                    student.id,
                    "process_explanation",
                    e.target.value
                  )
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
                value={existingRating.functionality || ""}
                onChange={(e) =>
                  handleRatingChange(
                    student.id,
                    "functionality",
                    e.target.value
                  )
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
              value={existingRating.ai_utilization || ""}
              onChange={(e) =>
                handleRatingChange(student.id, "ai_utilization", e.target.value)
              }
            />
          </div>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <div className="text-lg font-semibold">
            Total Score:{" "}
            {(
              ratings[student.id]?.total_score ?? student.rating?.total_score
            )?.toFixed(2) || "0.00"}
          </div>
          <Button
            onClick={() => handleRatingSubmit(student.id)}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {student.rating ? "Update Rating" : "Submit Rating"}
          </Button>
        </div>
      </div>
    );
  };

  const renderRoundSelector = () => {
    if (assignedRounds.length === 0) {
      return <div className="text-gray-500">No rounds assigned</div>;
    }

    return (
      <div className="w-[200px]">
        <Select value={selectedRound} onValueChange={setSelectedRound}>
          <SelectTrigger>
            <SelectValue placeholder="Select round" />
          </SelectTrigger>
          <SelectContent>
            {assignedRounds.map((round) => (
              <SelectItem key={round} value={round}>
                {round}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const renderGroupSelector = () => {
    if (judgeGroups.length === 0) {
      return <div className="text-gray-500">No groups assigned</div>;
    }

    return (
      <div className="flex gap-2">
        {judgeGroups.map((group) => (
          <Button
            key={group}
            variant={selectedGroup === group ? "default" : "outline"}
            className={selectedGroup === group ? "bg-rose-600 text-white" : ""}
            onClick={() => setSelectedGroup(group)}
          >
            Group {group}
          </Button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div
        className="flex justify-center items-center min-h-screen"
        style={{ backgroundColor: "#F7F1EF" }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-rose-600">
              Judge Dashboard
            </h1>
            <p className="text-gray-600">
              Review and evaluate student submissions
            </p>
          </div>
          <div className="flex gap-4">
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
            <Button
              onClick={() => router.push("/dat/judge/profile")}
              variant="outline"
            >
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            <p className="font-medium">Error loading data</p>
            <p className="text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchJudgeDetailsAndStudents();
              }}
            >
              Try again
            </Button>
          </div>
        )}

        {/* Add filters section */}
        <div className="mb-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex-1">{renderGroupSelector()}</div>
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500 min-w-[150px] text-right">
                Showing {students.length} students
              </p>
              {renderRoundSelector()}
            </div>
          </div>
        </div>

        {/* Headers Card */}
        <Card className="border-rose-200 mb-4">
          <CardContent className="py-4">
            <div className="grid grid-cols-6 items-center gap-4 px-4 font-bold text-rose-600">
              <div>Name</div>
              <div>Grade</div>
              <div>School</div>
              <div>Idea</div>
              <div>Rating</div>
              <div className="text-right">Actions</div>
            </div>
          </CardContent>
        </Card>

        {/* Data Card */}
        <Card className="border-rose-200">
          <CardContent className="py-6">
            {students.length > 0 ? (
              <div className="grid gap-4">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div
                      className="grid grid-cols-6 items-center gap-4 cursor-pointer"
                      onClick={() =>
                        setExpandedStudentId(
                          expandedStudentId === student.id ? null : student.id
                        )
                      }
                    >
                      <div className="font-medium text-gray-900">
                        {student.name}
                      </div>
                      <div className="text-gray-600">Grade {student.grade}</div>
                      <div className="text-gray-600">{student.school_name}</div>
                      <div className="text-gray-600">
                        {student.idea_title || "No title provided"}
                      </div>
                      <div className="text-gray-600">
                        {ratings[student.id] ? (
                          <span className="font-medium text-rose-600">
                            {ratings[student.id].total_score.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Not rated</span>
                        )}
                      </div>
                      <div className="text-right flex items-center justify-end">
                        <Button
                          variant="outline"
                          className="border-rose-200 text-rose-600 hover:bg-rose-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSubmission(student.id);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        {expandedStudentId === student.id ? (
                          <ChevronUp className="h-4 w-4 ml-2" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-2" />
                        )}
                      </div>
                    </div>
                    {expandedStudentId === student.id &&
                      renderRatingForm(student)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500 mb-2">No students found</p>
                <Button
                  onClick={() => fetchJudgeDetailsAndStudents()}
                  className="mt-4"
                  variant="outline"
                >
                  Refresh Data
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
