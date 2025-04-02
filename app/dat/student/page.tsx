"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/app/dat/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image"; // Add this import
import { Info, User, BookOpen } from "lucide-react"; // Import User and BookOpen icons from lucide
import { ExpandableSuggestions } from "@/app/dat/components/ExpandableSuggestions";
import { PresentationStatus } from "@/app/dat/components/PresentationCard";
import { PrototypeStatus } from "@/app/dat/components/PrototypeCard";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  grade: string;
  photo?: string;
}
interface Idea {
  id: string;
  title?: string;
  status:
    | "not_submitted"
    | "review_pending"
    | "update_needed"
    | "review_updated"
    | "rejected"
    | "approved";
  admin_suggestions?: string;
  updated?: boolean;
}

interface PresentationData {
  presentation_link?: string;
  status: PresentationStatus; // Use the imported type instead of the inline definition
  created_at?: string;
  admin_suggestions?: string;
  updated?: boolean;
}

interface PrototypeData {
  prototype_link: string;
  status: PrototypeStatus; // Use the imported type instead
  created_at: string;
  admin_suggestions?: string;
  updated: boolean;
}

export default function StudentDashboard() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [idea, setIdea] = useState<Idea | null>(null);
  const [presentationStatus, setPresentationStatus] =
    useState<PresentationStatus | null>(null);
  const [prototypeStatus, setPrototypeStatus] =
    useState<PrototypeStatus | null>(null);
  const [presentationData, setPresentationData] =
    useState<PresentationData | null>(null);
  const [prototypeData, setPrototypeData] = useState<PrototypeData | null>(
    null
  );
  const [showInstructionGuide, setShowInstructionGuide] =
    useState<boolean>(false);

  const notifyPresentationChanges = async () => {
    if (profile?.id) {
      try {
        const { data, error } = await supabase
          .from("dat_presentation_links")
          .update({
            updated: true,
            status: "review_pending",
          })
          .eq("student_id", profile.id)
          .select("*")
          .single();

        if (error) throw error;
        if (data) {
          setPresentationData(data);
          setPresentationStatus(data.status);
          toast.success(
            "Your updated presentation has been submitted for review."
          );
        }
      } catch (error) {
        console.error("Error updating presentation status:", error);
        toast.error("There was an error. Please try again.");
      }
    }
  };

  // Update the notifyPrototypeChanges function
  const notifyPrototypeChanges = async () => {
    if (profile?.id) {
      try {
        const { data, error } = await supabase
          .from("dat_prototype_links")
          .update({
            updated: true,
            status: "review_pending", // when student re-submits, set to pending review
          })
          .eq("student_id", profile.id)
          .select("*")
          .single();

        console.log("Prototype Update:", { data, error }); // Debug log

        if (error) throw error;
        if (data) {
          setPrototypeData(data);
          setPrototypeStatus(data.status);
          toast.success(
            "Your updated prototype has been submitted for review."
          );
        }
      } catch (error) {
        console.error("Error updating prototype status:", error);
        toast.error("There was an error. Please try again.");
      }
    }
  };

  const notifyIdeaChanges = async () => {
    if (idea?.id) {
      try {
        const { data, error } = await supabase
          .from("dat_ideas")
          .update({
            updated: true,
            status: "review_pending",
          })
          .eq("id", idea.id)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setIdea(data);
          toast.success("Your updated idea has been submitted for review.");
        }
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("There was an error. Please try again.");
      }
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        const { data, error } = await supabase
          .from("dat_student_details")
          .select("*")
          .eq("email", user.email)
          .maybeSingle();
        if (!error) {
          setProfile(data);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  // New useEffect: Fetch idea if profile exists
  useEffect(() => {
    const fetchIdea = async () => {
      if (profile?.id) {
        const { data, error } = await supabase
          .from("dat_ideas")
          .select("id, status, title, admin_suggestions, updated")
          .eq("student_id", profile.id)
          .maybeSingle();
        if (!error && data) {
          setIdea(data);
        }
      }
    };
    fetchIdea();
  }, [profile]);

  // New useEffect: Fetch presentation details if profile exists
  useEffect(() => {
    const fetchPresentation = async () => {
      if (profile?.id) {
        const { data, error } = await supabase
          .from("dat_presentation_links")
          .select("*") // Change from just "status" to "*" to fetch all fields
          .eq("student_id", profile.id)
          .maybeSingle();
        if (!error && data) {
          setPresentationStatus(data.status);
          setPresentationData(data); // Set the entire presentation data object
        }
      }
    };
    fetchPresentation();
  }, [profile]);

  // Update fetchPrototype function in useEffect
  useEffect(() => {
    const fetchPrototype = async () => {
      if (profile?.id) {
        const { data, error } = await supabase
          .from("dat_prototype_links")
          .select("*") // Select all fields
          .eq("student_id", profile.id)
          .maybeSingle();

        if (!error && data) {
          setPrototypeData(data);
          setPrototypeStatus(data.status);
        }
      }
    };
    fetchPrototype();
  }, [profile]);

  useEffect(() => {
    const checkInstructionGuide = async () => {
      if (!profile?.id) return;

      const { data: guideData } = await supabase
        .from("dat_instruction_guides")
        .select("*")
        .eq("student_id", profile.id)
        .single();

      if (!guideData) {
        // First login - create guide record and show animation
        await supabase
          .from("dat_instruction_guides")
          .insert({ student_id: profile.id });
        setShowInstructionGuide(true);
      } else if (idea?.status === "approved" && !guideData.idea_approved_seen) {
        // Idea approved - show animation and update record
        setShowInstructionGuide(true);
        await supabase
          .from("dat_instruction_guides")
          .update({ idea_approved_seen: true })
          .eq("student_id", profile.id);
      } else if (
        presentationStatus === "round1_winner" &&
        !guideData.round1_winner_seen
      ) {
        // Round 1 winner - show animation and update record
        setShowInstructionGuide(true);
        await supabase
          .from("dat_instruction_guides")
          .update({ round1_winner_seen: true })
          .eq("student_id", profile.id);
      }
    };

    checkInstructionGuide();
  }, [profile?.id, idea?.status, presentationStatus]);

  const hideInstructionGuide = () => {
    setShowInstructionGuide(false);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );

  if (!profile) return <p>No profile found.</p>;

  return (
    <>
      <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
        <AnimatePresence>
          {showInstructionGuide && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={hideInstructionGuide}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, x: "100%" }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ scale: 0.8, opacity: 0, x: "100%" }}
                className="absolute top-4 right-4 bg-white/10 backdrop-blur-md p-4 rounded-xl shadow-xl"
              >
                <Link href="/dat/instructions/view" onClick={hideInstructionGuide}>
                  <motion.button
                    className="px-6 py-3 bg-rose-600 text-white rounded-lg flex items-center gap-2 hover:bg-rose-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <BookOpen className="h-5 w-5" />
                    View Instructions
                  </motion.button>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative container mx-auto p-6">
          {/* Existing content with pointer-events-none when overlay is active */}
          <div className={showInstructionGuide ? "pointer-events-none" : ""}>
            {/* Updated Header Section with profile icon */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-bold text-rose-600 mb-2">
                  Welcome, {profile.name}!
                </h1>
                <p className="text-gray-600">
                  Let your imagination shape the future of AI
                </p>
              </div>

              <div className="flex items-center gap-2">
                {showInstructionGuide ? (
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={{
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        "0 0 0 0px rgba(244, 63, 94, 0.2)",
                        "0 0 0 20px rgba(244, 63, 94, 0)",
                      ],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: 3,
                      repeatType: "reverse",
                    }}
                  >
                    <Link href="/dat/instructions/view">
                      <Button
                        variant="outline"
                        className="border-rose-200 hover:bg-rose-50 relative"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Instructions
                        <motion.div
                          className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      </Button>
                    </Link>
                  </motion.div>
                ) : (
                  <Link href="/dat/instructions/view">
                    <Button
                      variant="outline"
                      className="border-rose-200 hover:bg-rose-50"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Instructions
                    </Button>
                  </Link>
                )}
                <Link
                  href="/dat/student/profile"
                  className="flex items-center gap-2 bg-white p-2 rounded-full shadow-sm hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                    {profile.photo ? (
                      <Image
                        src={profile.photo}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-rose-600" />
                    )}
                  </div>
                </Link>
              </div>
            </div>

            {/* ================== 1. STATUS OVERVIEW SECTION ================== */}
            {((idea && !presentationData?.presentation_link) ||
              (presentationStatus && !prototypeData?.prototype_link) ||
              prototypeStatus) && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Status Overview
                </h2>
                {idea && !presentationData?.presentation_link && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-blue-700 mb-2"></h3>
                    <div className="w-full p-6 bg-white rounded-lg shadow-md border-l-4 border-blue-500">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-blue-700">
                          Idea Status
                        </h3>
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            idea.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : idea.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : idea.status === "update_needed"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : idea.status === "review_updated"
                                    ? "bg-orange-100 text-orange-800"
                                    : idea.status === "not_submitted"
                                      ? "bg-gray-100 text-gray-800"
                                      : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {idea.status === "review_updated"
                            ? "Review Updated"
                            : idea.status === "review_pending"
                              ? "Review Pending"
                              : idea.status === "update_needed"
                                ? "Update Needed"
                                : idea.status === "not_submitted"
                                  ? "Not Submitted"
                                  : idea.status.charAt(0).toUpperCase() +
                                    idea.status.slice(1)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <p className="text-base text-gray-700 text-left">
                          {idea.status === "not_submitted" &&
                            "Your idea has not been submitted yet."}
                          {idea.status === "review_pending" &&
                            "Your idea is currently under review by our team."}
                          {idea.status === "update_needed" &&
                            "Your idea needs some updates based on admin feedback."}
                          {idea.status === "review_updated" &&
                            "Your updated idea is being reviewed."}
                          {idea.status === "approved" &&
                            "Congratulations! Your idea has been approved. Now you can submit your presentation."}
                          {idea.status === "rejected" &&
                            "Your idea was not approved."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {presentationStatus && !prototypeData?.prototype_link && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-green-700 mb-2"></h3>
                    <div className="w-full p-6 bg-white rounded-lg shadow-md border-l-4 border-green-500">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-green-700">
                          Presentation Status
                        </h3>
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            presentationStatus === "qualified_for_round1"
                              ? "bg-green-100 text-green-800"
                              : presentationStatus === "rejected"
                                ? "bg-red-100 text-red-800"
                                : presentationStatus === "update_needed"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {presentationStatus.charAt(0).toUpperCase() +
                            presentationStatus.slice(1)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Info className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <p className="text-base text-gray-700 text-left">
                          {presentationStatus === "review_pending" &&
                            "Your presentation is currently under review by our team."}
                          {presentationStatus === "update_needed" &&
                            "Your presentation needs updates based on admin feedback."}
                          {presentationStatus === "qualified_for_round1" &&
                            "Congratulations! Your presentation has been approved."}
                          {presentationStatus === "rejected" &&
                            "Your presentation was not approved."}
                          {presentationStatus === "round1_winner" &&
                            "Congratulations! Your presentation was selected as the winner. Proceed with submitting the prototype."}{" "}
                          {/* Changed from winner_selected */}
                          {presentationStatus === "round1_runner_up" &&
                            "Congratulations! Your presentation was selected as the runner-up. Proceed with submitting the prototype."}{" "}
                          {/* Changed from runner_up_selected */}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {prototypeStatus && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-purple-700 mb-2"></h3>
                    <div className="w-full p-6 bg-white rounded-lg shadow-md">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-purple-700">
                          Prototype Status
                        </h3>
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            prototypeStatus === "qualified_for_round2"
                              ? "bg-green-100 text-green-800"
                              : prototypeStatus === "rejected"
                                ? "bg-red-100 text-red-800"
                                : prototypeStatus === "update_needed"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {prototypeStatus.charAt(0).toUpperCase() +
                            prototypeStatus.slice(1)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Info className="h-5 w-5 text-purple-500 flex-shrink-0" />
                        <p className="text-base text-gray-700 text-left">
                          {prototypeStatus === "review_pending" &&
                            "Your prototype is currently under review by our team."}
                          {prototypeStatus === "update_needed" &&
                            "Your prototype needs updates based on admin feedback."}
                          {prototypeStatus === "qualified_for_round2" &&
                            "Congratulations! Your prototype has been approved for Round 2."}
                          {prototypeStatus === "rejected" &&
                            "Your prototype was not approved."}
                          {prototypeStatus === "round2_winner" &&
                            "Congratulations! Your prototype was selected as Round 2 Winner. You're eligible for the finals!"}
                          {prototypeStatus === "round2_runner_up" &&
                            "Congratulations! Your prototype was selected as Round 2 Runner Up. You're eligible for the finals!"}
                          {prototypeStatus === "finals_winner" &&
                            "🏆 Congratulations! Your prototype was selected as the Finals Winner!"}
                          {prototypeStatus === "finals_runner_up" &&
                            "🥈 Congratulations! Your prototype was selected as the Finals Runner Up!"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================== 2. ADMIN FEEDBACK SECTION ================== */}
            {((idea?.admin_suggestions && idea.status === "update_needed") ||
              (presentationData?.admin_suggestions &&
                presentationData.status === "update_needed" &&
                !presentationData.updated) ||
              (prototypeData?.admin_suggestions &&
                prototypeData.status === "update_needed" &&
                !prototypeData.updated)) && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Admin Feedback
                </h2>
                <div className="grid gap-6">
                  {/* Idea Admin Feedback Card */}
                  {idea?.admin_suggestions &&
                    idea.status === "update_needed" &&
                    !idea.updated && (
                      <div className="p-6 bg-white rounded-lg shadow-md border-l-4 border-blue-500">
                        <h3 className="text-lg font-medium text-blue-700 mb-4">
                          Idea Feedback
                        </h3>
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <ExpandableSuggestions
                            suggestions={idea.admin_suggestions}
                          />
                        </div>
                        <div className="flex items-center justify-end mt-6">
                          <Button
                            variant="outline"
                            onClick={notifyIdeaChanges}
                            className={
                              idea.updated
                                ? "bg-gray-300 text-gray-700"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }
                            disabled={idea.updated}
                          >
                            {idea.updated
                              ? "Updates Submitted"
                              : "I have updated the idea"}
                          </Button>
                        </div>
                      </div>
                    )}

                  {/* Presentation Feedback Card */}
                  {presentationData?.admin_suggestions &&
                    presentationData.status === "update_needed" &&
                    !presentationData.updated && (
                      <div className="p-6 bg-white rounded-lg shadow-md border-l-4 border-green-500">
                        <h3 className="text-lg font-medium text-green-700 mb-4">
                          Presentation Feedback
                        </h3>
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <ExpandableSuggestions
                            suggestions={presentationData.admin_suggestions}
                          />
                        </div>
                        <div className="flex items-center justify-end mt-6">
                          <Button
                            variant="outline"
                            onClick={notifyPresentationChanges}
                            className={
                              presentationData.updated
                                ? "bg-gray-300 text-gray-700"
                                : "bg-green-600 text-white hover:bg-green-700"
                            }
                            disabled={presentationData.updated}
                          >
                            {presentationData.updated
                              ? "Updates Submitted"
                              : "I have updated the presentation"}
                          </Button>
                        </div>
                      </div>
                    )}

                  {/* Prototype Feedback Card */}
                  {prototypeData?.admin_suggestions &&
                    prototypeData.status === "update_needed" &&
                    !prototypeData.updated && (
                      <div className="p-6 bg-white rounded-lg shadow-md border-l-4 border-purple-500">
                        <h3 className="text-lg font-medium text-purple-700 mb-4">
                          Prototype Feedback
                        </h3>
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <ExpandableSuggestions
                            suggestions={prototypeData.admin_suggestions}
                          />
                        </div>
                        <div className="flex items-center justify-end mt-6">
                          <Button
                            variant="outline"
                            onClick={notifyPrototypeChanges}
                            className={
                              prototypeData.updated
                                ? "bg-gray-300 text-gray-700"
                                : "bg-purple-600 text-white hover:bg-purple-700"
                            }
                            disabled={prototypeData.updated}
                          >
                            {prototypeData.updated
                              ? "Updates Submitted"
                              : "I have updated the prototype"}
                          </Button>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* ================== 3. MY PROJECT SECTION ================== */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                My Project
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-rose-600 mb-2"></h3>
                  <Link href="/dat/student/ideas" className="block">
                    <div className="w-full p-6 bg-white border border-rose-200 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer">
                      <div className="flex flex-col items-start justify-center space-y-4">
                        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8 text-rose-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0012 18.75c-1.03 0-1.96-.413-2.64-1.084l-.547-.547z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-rose-600">
                          Idea
                        </h3>
                        <p className="text-sm text-gray-600 text-left">
                          View and manage your AI innovation idea
                        </p>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                          {idea?.title || "View details"}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
                {idea?.status === "approved" && (
                  <div>
                    <h3 className="text-xl font-semibold text-rose-600 mb-2"></h3>
                    <Link href="/dat/student/presentation" className="block">
                      <div className="w-full p-6 bg-white border border-rose-200 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer">
                        <div className="flex flex-col items-start justify-center space-y-4">
                          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-8 w-8 text-rose-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-xl font-semibold text-rose-600">
                            Presentation
                          </h3>
                          <p className="text-sm text-gray-600 text-left">
                            Manage your project presentation
                          </p>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                            {presentationData?.presentation_link
                              ? "View presentation"
                              : "Submit now"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                )}
                {/* Prototype Section - Only visible for Round 1 winners/runners-up */}
                {(presentationStatus === "round1_winner" ||
                  presentationStatus === "round1_runner_up" ||
                  prototypeStatus === "round2_winner" ||
                  prototypeStatus === "round2_runner_up" ||
                  prototypeStatus === "finals_winner" ||
                  prototypeStatus === "finals_runner_up") && (
                  <div>
                    <h3 className="text-xl font-semibold text-rose-600 mb-2"></h3>
                    <Link href="/dat/student/prototype" className="block">
                      <div className="w-full p-6 bg-white border border-rose-200 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer">
                        <div className="flex flex-col items-start justify-center space-y-4">
                          {/* ...existing prototype card content... */}
                          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-8 w-8 text-rose-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                              />
                            </svg>
                          </div>
                          <h3 className="text-xl font-semibold text-rose-600">
                            Prototype
                          </h3>
                          <p className="text-sm text-gray-600 text-left">
                            Manage your working prototype
                          </p>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                            {prototypeData?.prototype_link
                              ? "View prototype"
                              : "Submit now"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
