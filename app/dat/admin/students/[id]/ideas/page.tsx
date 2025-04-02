"use client";

import React, { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import IdeaCard from "@/app/dat/components/IdeaCard";
import PresentationCard from "@/app/dat/components/PresentationCard";
import PrototypeCard from "@/app/dat/components/PrototypeCard";
import type { PresentationStatus } from "@/app/dat/components/PresentationCard";
import type { PrototypeStatus } from "@/app/dat/components/PrototypeCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/app/dat/utils/supabaseClient";

type IdeaStatus =
  | "not_submitted"
  | "review_pending"
  | "update_needed"
  | "review_updated"
  | "rejected"
  | "approved";

interface Idea {
  id: string;
  title: string;
  brief_description: string;
  why_this_idea: string;
  how_get_this_idea: string;
  status: IdeaStatus;
  created_at: string;
  admin_suggestions?: string;
  updated?: boolean;
}

interface Prototype {
  prototype_link: string;
  status: PrototypeStatus;
  created_at: string;
  admin_suggestions?: string;
}

// Add interfaces for detailed ratings
interface DetailedRating {
  id: string;
  student_id: string;
  judge_id: string;
  judge_name?: string; // Will be populated after fetching
  round: string;
  presentation_skills: number;
  usefulness: number;
  process_explanation?: number;
  functionality?: number;
  ai_utilization: number;
  total_score: number;
  created_at: string;
}

function StudentIdeasAdminClient({ studentId }: { studentId: string }) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStatus, setEditingStatus] = useState<{
    [key: string]: boolean;
  }>({});
  const [tempStatus, setTempStatus] = useState<{ [key: string]: IdeaStatus }>(
    {}
  );
  const [presentationLink, setPresentationLink] = useState<string | null>(null);
  const [presentationStatus, setPresentationStatus] =
    useState<PresentationStatus>("not_submitted");
  const [editingPresentationStatus, setEditingPresentationStatus] =
    useState(false);
  const [prototype, setPrototype] = useState<Prototype | null>(null);
  const [editingPrototypeStatus, setEditingPrototypeStatus] = useState(false);
  const [prototypeTempStatus, setPrototypeTempStatus] =
    useState<PrototypeStatus>("not_submitted");
  const [presentationVisible, setPresentationVisible] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyPrototypeSuccess, setCopyPrototypeSuccess] = useState(false);
  const [presentationCreatedAt, setPresentationCreatedAt] = useState<
    string | null
  >(null);
  const [presentationTempStatus, setPresentationTempStatus] =
    useState<PresentationStatus>("not_submitted");
  const [presentationData, setPresentationData] = useState<{
    presentation_link?: string;
    status?: string;
    created_at?: string;
    creativity_rating?: number;
    concept_rating?: number;
    process_rating?: number;
    originality_rating?: number;
    knowledge_rating?: number;
    admin_suggestions?: string;
  } | null>(null);
  const [hasWinnerInGroup, setHasWinnerInGroup] = useState(false);
  const [hasRunnerUpInGroup, setHasRunnerUpInGroup] = useState(false);
  const [hasRound2WinnerInGroup, setHasRound2WinnerInGroup] = useState(false);
  const [hasRound2RunnerUpInGroup, setHasRound2RunnerUpInGroup] =
    useState(false);
  const [hasFinalsWinner, setHasFinalsWinner] = useState(false);
  const [hasFinalsRunnerUp, setHasFinalsRunnerUp] = useState(false);
  const [round1Ratings, setRound1Ratings] = useState<DetailedRating[]>([]);
  const [round2Ratings, setRound2Ratings] = useState<DetailedRating[]>([]);
  const [finalsRatings, setFinalsRatings] = useState<DetailedRating[]>([]);
  const [studentName, setStudentName] = useState<string>("");

  const notifyIdeaChanges = async (ideaId: string) => {
    try {
      const { error } = await supabase
        .from("dat_ideas")
        .update({ updated: true })
        .eq("id", ideaId);

      if (!error) {
        // Update the local ideas state to reflect the change
        setIdeas(
          ideas.map((idea) =>
            idea.id === ideaId ? { ...idea, updated: true } : idea
          )
        );
        console.log(`Idea ${ideaId} has been marked as updated`);
      } else {
        console.error("Error updating idea status:", error);
      }
    } catch (err) {
      console.error("Error in notifyIdeaChanges:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch student details first to get name
        const { data: studentDetails, error: studentDetailsError } =
          await supabase
            .from("dat_student_details")
            .select("id, name, school_id, school_name, group")
            .eq("id", studentId)
            .single();

        if (studentDetailsError) {
          console.error("Error fetching student details:", studentDetailsError);
        } else if (studentDetails) {
          setStudentName(studentDetails.name);
        }

        const { data: ideasData, error: ideasError } = await supabase
          .from("dat_ideas")
          .select("*")
          .eq("student_id", studentId)
          .order("created_at", { ascending: false });

        if (!ideasError && ideasData) {
          setIdeas(ideasData);
        }

        // Updated presentation fetch query
        const { data: presentationData, error: presentationError } =
          await supabase
            .from("dat_presentation_links")
            .select(
              `
            *,
            presentation_link,
            status,
            created_at,
            admin_suggestions,
            updated
          `
            )
            .eq("student_id", studentId)
            .maybeSingle();

        console.log("Presentation Data:", presentationData); // Add this for debugging

        if (!presentationError && presentationData) {
          setPresentationData(presentationData);
          setPresentationLink(presentationData.presentation_link);
          setPresentationStatus(presentationData.status || "pending");
          setPresentationCreatedAt(presentationData.created_at);
        }

        const { data: prototypeData, error: prototypeError } = await supabase
          .from("dat_prototype_links")
          .select(
            `
            created_at,
            prototype_link,
            status,
            admin_suggestions
          `
          )
          .eq("student_id", studentId)
          .maybeSingle();

        if (!prototypeError && prototypeData) {
          setPrototype({
            prototype_link: prototypeData.prototype_link,
            // Convert string status to PrototypeStatus type
            status:
              (prototypeData.status as PrototypeStatus) || "review_pending",
            created_at: prototypeData.created_at,
            admin_suggestions: prototypeData.admin_suggestions,
          });
          setPrototypeTempStatus(
            (prototypeData.status as PrototypeStatus) || "review_pending"
          );
        }

        // Fetch student details to get their group and school

        if (studentDetails) {
          // Get students from the same school and group (excluding current student)
          if (studentDetails.school_id && studentDetails.group) {
            const { data: groupStudents } = await supabase
              .from("dat_student_details")
              .select("id")
              .eq("school_id", studentDetails.school_id)
              .eq("group", studentDetails.group)
              .neq("id", studentId); // Exclude the current student

            if (groupStudents && groupStudents.length > 0) {
              const studentIds = groupStudents.map((s) => s.id);

              // Update check for winners/runners-up in this group for both rounds
              const [
                presentationWinners,
                presentationRunnerUps,
                prototypeWinners,
                prototypeRunnerUps,
              ] = await Promise.all([
                // Check for presentation winners
                supabase
                  .from("dat_presentation_links")
                  .select("id")
                  .in("student_id", studentIds)
                  .eq("status", "round1_winner"), // Changed from winner_selected
                // Check for presentation runners-up
                supabase
                  .from("dat_presentation_links")
                  .select("id")
                  .in("student_id", studentIds)
                  .eq("status", "round1_runner_up"), // Changed from runner_up_selected
                // Check for prototype winners
                supabase
                  .from("dat_prototype_links")
                  .select("id")
                  .in("student_id", studentIds)
                  .eq("status", "round2_winner"),
                // Check for prototype runners-up
                supabase
                  .from("dat_prototype_links")
                  .select("id")
                  .in("student_id", studentIds)
                  .eq("status", "round2_runner_up"),
              ]);

              // Set flags for presentation round
              setHasWinnerInGroup(Boolean(presentationWinners.data?.length));
              setHasRunnerUpInGroup(
                Boolean(presentationRunnerUps.data?.length)
              );

              // Set flags for prototype round
              setHasRound2WinnerInGroup(Boolean(prototypeWinners.data?.length));
              setHasRound2RunnerUpInGroup(
                Boolean(prototypeRunnerUps.data?.length)
              );
            }
          }
        }

        // Fetch student details to get their city
        const { data: studentDetailsCity, error: studentDetailsCityError } =
          await supabase
            .from("dat_student_details")
            .select("id, city, group")
            .eq("id", studentId)
            .single();

        if (studentDetailsCityError) {
          console.error(
            "Error fetching student details:",
            studentDetailsCityError
          );
        }

        if (studentDetailsCity?.city && studentDetailsCity?.group) {
          // Get all students from the same city AND group (excluding current student)
          const { data: cityGroupStudents } = await supabase
            .from("dat_student_details")
            .select("id")
            .eq("city", studentDetailsCity.city)
            .eq("group", studentDetailsCity.group) // Added group filter
            .neq("id", studentId);

          if (cityGroupStudents && cityGroupStudents.length > 0) {
            const studentIds = cityGroupStudents.map((s) => s.id);

            // Check for prototype winners/runners-up in this city and group
            const [prototypeWinners, prototypeRunnerUps] = await Promise.all([
              // Check for prototype winners in the city and group
              supabase
                .from("dat_prototype_links")
                .select("id")
                .in("student_id", studentIds)
                .eq("status", "round2_winner"),
              // Check for prototype runners-up in the city and group
              supabase
                .from("dat_prototype_links")
                .select("id")
                .in("student_id", studentIds)
                .eq("status", "round2_runner_up"),
            ]);

            // Set flags for prototype round city-wise and group-wise
            setHasRound2WinnerInGroup(Boolean(prototypeWinners.data?.length));
            setHasRound2RunnerUpInGroup(
              Boolean(prototypeRunnerUps.data?.length)
            );
          }
        }

        // Check for existing finals winners/runners-up within the same GROUP
        if (studentDetailsCity?.group) {
          const [finalsWinner, finalsRunnerUp] = await Promise.all([
            supabase
              .from("dat_prototype_links")
              .select(
                `
                id,
                student_details!inner(group)
              `
              )
              .eq("status", "finals_winner")
              .eq("student_details.group", studentDetailsCity.group),
            supabase
              .from("dat_prototype_links")
              .select(
                `
                id,
                student_details!inner(group)
              `
              )
              .eq("status", "finals_runner_up")
              .eq("student_details.group", studentDetailsCity.group),
          ]);

          // Set flags for finals (now group-specific)
          setHasFinalsWinner(Boolean(finalsWinner.data?.length));
          setHasFinalsRunnerUp(Boolean(finalsRunnerUp.data?.length));
        }

        // Fixed: Fetch ratings without using the problematic join
        try {
          // Step 1: Get all ratings for the student
          const { data: ratingsData, error: ratingsError } = await supabase
            .from("dat_student_ratings")
            .select("*")
            .eq("student_id", studentId);

          if (!ratingsError && ratingsData) {
            // Step 2: Get all judge IDs from the ratings
            const judgeIds = [...new Set(ratingsData.map((r) => r.judge_id))];

            // Step 3: Fetch judge names
            const { data: judgeData } = await supabase
              .from("dat_judge_details")
              .select("id, name")
              .in("id", judgeIds);

            // Step 4: Create a map of judge IDs to names
            const judgeMap = new Map();
            judgeData?.forEach((judge) => {
              judgeMap.set(judge.id, judge.name);
            });

            // Step 5: Manually combine the data
            const processedRatings = ratingsData.map((rating) => ({
              ...rating,
              judge_name: judgeMap.get(rating.judge_id) || "Unknown Judge",
            }));

            const round1 = processedRatings.filter(
              (r) => r.round === "Round 1"
            );
            const round2 = processedRatings.filter(
              (r) => r.round === "Round 2"
            );
            const finals = processedRatings.filter((r) => r.round === "Finals");

            // Set the ratings by round
            setRound1Ratings(round1);
            setRound2Ratings(round2);
            setFinalsRatings(finals);
          }
        } catch (error) {
          console.error("Error processing ratings:", error);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" || e.keyCode === 27) {
        setIsFullScreen(false);
      }
    }

    if (isFullScreen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullScreen]);

  const handleApproval = async (
    ideaId: string,
    newStatus: "approved" | "rejected"
  ) => {
    const { error } = await supabase
      .from("dat_ideas")
      .update({
        status: newStatus,
        updated: false, // Reset the updated flag when admin changes status
      })
      .eq("id", ideaId);
    if (!error) {
      setIdeas(
        ideas.map((idea) =>
          idea.id === ideaId
            ? { ...idea, status: newStatus, updated: false }
            : idea
        )
      );
    }
  };

  const cancelEditStatus = (ideaId: string) => {
    setEditingStatus((prev) => ({ ...prev, [ideaId]: false }));
  };

  const submitStatus = async (ideaId: string) => {
    const newStatus = tempStatus[ideaId];
    const { error } = await supabase
      .from("dat_ideas")
      .update({ status: newStatus })
      .eq("id", ideaId);
    if (!error) {
      setIdeas(
        ideas.map((idea) =>
          idea.id === ideaId ? { ...idea, status: newStatus } : idea
        )
      );
      setEditingStatus((prev) => ({ ...prev, [ideaId]: false }));
    }
  };

  const submitPresentationStatus = async () => {
    try {
      const { error } = await supabase
        .from("dat_presentation_links")
        .update({ status: presentationTempStatus })
        .eq("student_id", studentId);
      if (error) {
        console.error("Error saving presentation link:", error.message);
        alert("Error saving presentation link: " + error.message);
        return;
      }
      setPresentationStatus(presentationTempStatus);
      setEditingPresentationStatus(false);
    } catch (err) {
      console.error("Exception in submitPresentationStatus:", err);
      alert(
        "Error saving presentation link: " +
          (err instanceof Error ? err.message : err)
      );
    }
  };

  const toggleEditPresentationStatus = () => {
    setPresentationTempStatus(presentationStatus);
    setEditingPresentationStatus(true);
  };

  const cancelEditPresentationStatus = () => {
    setEditingPresentationStatus(false);
  };

  const submitPrototypeStatus = async () => {
    const { error } = await supabase
      .from("dat_prototype_links")
      .update({ status: prototypeTempStatus })
      .eq("student_id", studentId);
    if (!error && prototype) {
      setPrototype({
        ...prototype,
        status: prototypeTempStatus,
      });
      setEditingPrototypeStatus(false);
    }
  };

  const cancelEditPrototypeStatus = () => {
    setEditingPrototypeStatus(false);
  };

  const handleCopyPrototypeLink = async () => {
    if (prototype?.prototype_link) {
      try {
        await navigator.clipboard.writeText(prototype.prototype_link);
        setCopyPrototypeSuccess(true);
        setTimeout(() => setCopyPrototypeSuccess(false), 2000);
      } catch (err) {
        console.error("Failed to copy link:", err);
      }
    }
  };

  const submitPresentationSuggestion = async (suggestion: string) => {
    const { error } = await supabase
      .from("dat_presentation_links")
      .update({
        admin_suggestions: suggestion,
        updated: false,
        status: "needs_update", // Set status to 'needs_update' when admin suggests changes
      })
      .eq("student_id", studentId);

    if (!error) {
      const { data } = await supabase
        .from("dat_presentation_links")
        .select("*")
        .eq("student_id", studentId)
        .single();

      if (data) {
        setPresentationData(data);
        setPresentationStatus(data.status);
      }
    }
  };

  const submitPrototypeSuggestion = async (suggestion: string) => {
    const { error } = await supabase
      .from("dat_prototype_links")
      .update({
        admin_suggestions: suggestion,
        updated: false,
        status: "needs_update", // Set status to 'needs_update' when admin suggests changes
      })
      .eq("student_id", studentId);

    if (!error) {
      const { data } = await supabase
        .from("dat_prototype_links")
        .select("*")
        .eq("student_id", studentId)
        .single();

      if (data) {
        setPrototype(data);
      }
    }
  };

  if (loading) return <p>Loading ideas...</p>;

  const submitSuggestion = async (ideaId: string, suggestion: string) => {
    const { error } = await supabase
      .from("dat_ideas")
      .update({
        admin_suggestions: suggestion,
        status: "update_needed", // changed from 'needs_update'
        updated: false,
      })
      .eq("id", ideaId);

    if (!error) {
      // Update the local ideas state to reflect the changes
      setIdeas(
        ideas.map((idea) =>
          idea.id === ideaId
            ? {
                ...idea,
                admin_suggestions: suggestion,
                status: "update_needed",
                updated: false,
              }
            : idea
        )
      );
    }
  };

  // Function to render ratings table for a specific round
  const renderRatingsTable = (
    ratings: DetailedRating[],
    isRound1: boolean = true
  ) => {
    if (!ratings || ratings.length === 0) {
      return (
        <p className="text-gray-500 italic mt-2">
          No ratings available for this round.
        </p>
      );
    }

    const fields = isRound1
      ? [
          "Presentation Skills",
          "Usefulness",
          "Process Explanation",
          "AI Utilization",
        ]
      : [
          "Presentation Skills",
          "Usefulness",
          "Functionality",
          "AI Utilization",
        ];

    const avgRating = {
      presentation_skills: 0,
      usefulness: 0,
      process_explanation: 0,
      functionality: 0,
      ai_utilization: 0,
      total_score: 0,
    };

    ratings.forEach((rating) => {
      avgRating.presentation_skills += rating.presentation_skills;
      avgRating.usefulness += rating.usefulness;
      avgRating.ai_utilization += rating.ai_utilization;
      avgRating.total_score += rating.total_score;

      if (isRound1 && rating.process_explanation) {
        avgRating.process_explanation += rating.process_explanation;
      } else if (!isRound1 && rating.functionality) {
        avgRating.functionality += rating.functionality;
      }
    });

    Object.keys(avgRating).forEach((key) => {
      avgRating[key as keyof typeof avgRating] /= ratings.length;
    });

    return (
      <div className="mt-4 overflow-hidden border rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-rose-50">
              <TableHead>Judge</TableHead>
              {fields.map((field) => (
                <TableHead key={field}>{field}</TableHead>
              ))}
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ratings.map((rating) => (
              <TableRow key={rating.id}>
                <TableCell className="font-medium">
                  {rating.judge_name}
                </TableCell>
                <TableCell>{rating.presentation_skills}</TableCell>
                <TableCell>{rating.usefulness}</TableCell>
                <TableCell>
                  {isRound1 ? rating.process_explanation : rating.functionality}
                </TableCell>
                <TableCell>{rating.ai_utilization}</TableCell>
                <TableCell className="font-bold text-rose-600">
                  {rating.total_score.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-gray-50">
              <TableCell className="font-bold">Average</TableCell>
              <TableCell>{avgRating.presentation_skills.toFixed(2)}</TableCell>
              <TableCell>{avgRating.usefulness.toFixed(2)}</TableCell>
              <TableCell>
                {isRound1
                  ? avgRating.process_explanation.toFixed(2)
                  : avgRating.functionality.toFixed(2)}
              </TableCell>
              <TableCell>{avgRating.ai_utilization.toFixed(2)}</TableCell>
              <TableCell className="font-bold text-rose-600">
                {avgRating.total_score.toFixed(2)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  };

  // Update how PresentationCard is rendered to include the ratings
  const renderPresentationCard = () => {
    if (!presentationLink) return null;

    return (
      <Card className="mb-6 border-rose-200">
        <CardContent className="p-6">
          {/* ...existing PresentationCard content... */}
          <PresentationCard
            presentationLink={presentationLink}
            presentationStatus={presentationStatus}
            setPresentationStatus={setPresentationStatus}
            editingPresentationStatus={editingPresentationStatus}
            presentationTempStatus={presentationTempStatus}
            setPresentationTempStatus={setPresentationTempStatus}
            submitPresentationStatus={submitPresentationStatus}
            cancelEditPresentationStatus={cancelEditPresentationStatus}
            toggleEditPresentationStatus={toggleEditPresentationStatus}
            copySuccess={copySuccess}
            setCopySuccess={setCopySuccess}
            presentationVisible={presentationVisible}
            setPresentationVisible={setPresentationVisible}
            isFullScreen={isFullScreen}
            setIsFullScreen={setIsFullScreen}
            studentId={studentId}
            created_at={presentationCreatedAt || undefined}
            admin_suggestions={presentationData?.admin_suggestions}
            submitSuggestion={submitPresentationSuggestion}
            disableWinner={hasWinnerInGroup}
            disableRunnerUp={hasRunnerUpInGroup}
          />

          {/* Add Round 1 Ratings Section - Always show this section */}
          <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-medium text-rose-600 mb-2">
              Round 1 Ratings
            </h3>
            {round1Ratings.length > 0 ? (
              renderRatingsTable(round1Ratings, true)
            ) : (
              <p className="text-gray-500 italic mt-2">
                No ratings available for Round 1.
                {presentationStatus === "qualified_for_round1"
                  ? " (This student is qualified for Round 1 but has not been rated yet)"
                  : " (This student must be qualified for Round 1 to be rated)"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Update how PrototypeCard is rendered to include Round 2 and Finals ratings
  const renderPrototypeCard = () => {
    if (!prototype) return null;

    return (
      <Card className="mb-6 border-rose-200">
        <CardContent className="p-6">
          {/* ...existing PrototypeCard content... */}
          <PrototypeCard
            prototype={prototype}
            editingPrototypeStatus={editingPrototypeStatus}
            setEditingPrototypeStatus={setEditingPrototypeStatus}
            prototypeTempStatus={prototypeTempStatus}
            setPrototypeTempStatus={setPrototypeTempStatus}
            submitPrototypeStatus={submitPrototypeStatus}
            cancelEditPrototypeStatus={cancelEditPrototypeStatus}
            handleCopyPrototypeLink={handleCopyPrototypeLink}
            copyPrototypeSuccess={copyPrototypeSuccess}
            studentId={studentId}
            setPrototype={setPrototype}
            submitSuggestion={submitPrototypeSuggestion}
            admin_suggestions={prototype?.admin_suggestions}
            disableWinner={hasRound2WinnerInGroup}
            disableRunnerUp={hasRound2RunnerUpInGroup}
            disableFinalsWinner={hasFinalsWinner}
            disableFinalsRunnerUp={hasFinalsRunnerUp}
          />

          {/* Always display the ratings sections for debugging */}
          <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-medium text-rose-600 mb-2">
              Round 2 Ratings
            </h3>
            {round2Ratings.length > 0 ? (
              renderRatingsTable(round2Ratings, false)
            ) : (
              <p className="text-gray-500 italic mt-2">
                No ratings available for Round 2.
                {prototype.status === "qualified_for_round2"
                  ? " (This student is qualified for Round 2 but has not been rated yet)"
                  : " (This student must be qualified for Round 2 to be rated)"}
              </p>
            )}
          </div>

          <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-medium text-rose-600 mb-2">
              Finals Ratings
            </h3>
            {finalsRatings.length > 0 ? (
              renderRatingsTable(finalsRatings, false)
            ) : (
              <p className="text-gray-500 italic mt-2">
                No ratings available for Finals.
                {["round2_winner", "round2_runner_up"].includes(
                  prototype.status
                )
                  ? " (This student is qualified for Finals but has not been rated yet)"
                  : " (This student must be qualified for Finals to be rated)"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Update the main return statement to use the new rendering functions
  if (loading) return <p>Loading ideas...</p>;

  return (
    <Suspense fallback={<p>Loading page...</p>}>
      <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
        <div className="container mx-auto p-6">
          <div className="mb-8 flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-rose-600">
                {studentName ? `${studentName}'s Submissions` : "Submissions"}
              </h1>
              <p className="text-gray-600">
                Review and update the ratings and approval status for student
                ideas
              </p>
            </div>
          </div>

          {/* Render Prototype Card with Round 2 and Finals ratings */}
          {renderPrototypeCard()}

          {/* Render Presentation Card with Round 1 ratings */}
          {renderPresentationCard()}

          {/* Added gap between PresentationCard and IdeaCards */}
          <div className="mt-8"></div>

          {/* Render Ideas last */}
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              submitSuggestion={submitSuggestion}
              editingStatus={editingStatus}
              setEditingStatus={setEditingStatus}
              tempStatus={tempStatus}
              setTempStatus={setTempStatus}
              handleApproval={handleApproval}
              submitStatus={submitStatus}
              cancelEditStatus={cancelEditStatus}
              notifyIdeaChanges={notifyIdeaChanges}
            />
          ))}
        </div>
      </div>
    </Suspense>
  );
}

// Page component with React.use() for params
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params using React.use()
  const resolvedParams = React.use(params);
  const studentId = resolvedParams.id;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudentIdeasAdminClient studentId={studentId} />
    </Suspense>
  );
}
