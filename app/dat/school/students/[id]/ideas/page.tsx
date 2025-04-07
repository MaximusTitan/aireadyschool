"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/app/dat/utils/supabaseClient";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Idea {
  id: string;
  title: string;
  brief_description: string;
  why_this_idea: string;
  how_get_this_idea: string;
  rating: number | null;
  created_at: string;
  status: string;
  admin_suggestions?: string;
}

interface Presentation {
  presentation_link: string;
  status: string;
  rating: number | null;
  created_at: string;
  admin_suggestions?: string;
}

interface Prototype {
  prototype_link: string;
  status: string;
  rating: number | null;
  created_at: string;
  admin_suggestions?: string;
}

export default function StudentIdeasSchool() {
  const params = useParams();
  const studentId = params.id;
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [prototype, setPrototype] = useState<Prototype | null>(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyPrototypeSuccess, setCopyPrototypeSuccess] = useState(false);
  const [presentationVisible, setPresentationVisible] = useState(false);
  const [studentName, setStudentName] = useState<string>("");

  // Helper functions for status display
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "qualified_for_round1":
      case "qualified_for_round2":
        return {
          bg: "bg-green-50",
          text: "text-green-700",
          border: "border-green-200",
          icon: "✓",
        };
      case "rejected":
        return {
          bg: "bg-red-50",
          text: "text-red-700",
          border: "border-red-200",
          icon: "×",
        };
      case "not_submitted":
        return {
          bg: "bg-gray-50",
          text: "text-gray-700",
          border: "border-gray-200",
          icon: "⌀",
        };
      case "review_pending":
      case "pending":
        return {
          bg: "bg-blue-50",
          text: "text-blue-700",
          border: "border-blue-200",
          icon: "⌛",
        };
      case "update_needed":
        return {
          bg: "bg-yellow-50",
          text: "text-yellow-700",
          border: "border-yellow-200",
          icon: "!",
        };
      case "review_updated":
        return {
          bg: "bg-orange-50",
          text: "text-orange-700",
          border: "border-orange-200",
          icon: "↻",
        };
      case "round1_winner":
      case "round2_winner":
      case "finals_winner":
        return {
          bg: "bg-indigo-50",
          text: "text-indigo-700",
          border: "border-indigo-200",
          icon: "🏆",
        };
      case "round1_runner_up":
      case "round2_runner_up":
      case "finals_runner_up":
        return {
          bg: "bg-teal-50",
          text: "text-teal-700",
          border: "border-teal-200",
          icon: "🥈",
        };
      default:
        return {
          bg: "bg-blue-50",
          text: "text-blue-700",
          border: "border-blue-200",
          icon: "⋯",
        };
    }
  };

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

  const getOriginalLink = (url: string) => {
    if (url.includes("docs.google.com/presentation")) {
      return url.split("/embed")[0] + "/edit";
    }
    return url;
  };

  useEffect(() => {
    const fetchIdeas = async () => {
      const { data, error } = await supabase
        .from("dat_ideas")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      if (!error && data) setIdeas(data);
      setLoading(false);
    };
    fetchIdeas();
  }, [studentId]);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const { data, error } = await supabase
          .from("dat_student_details") // Changed from "students" to "student_details"
          .select("name")
          .eq("id", studentId)
          .single();

        if (error) {
          console.error("Error fetching student name:", error);
          return;
        }

        if (data && data.name) {
          setStudentName(data.name);
        }
      } catch (error) {
        console.error("Exception when fetching student data:", error);
      }
    };

    fetchStudentData();
  }, [studentId]);

  useEffect(() => {
    const fetchPresentation = async () => {
      const { data, error } = await supabase
        .from("dat_presentation_links")
        .select("*")
        .eq("student_id", studentId)
        .single();

      if (error) {
        // Check if this is just a "no rows returned" error
        if (error.code === "PGRST116") {
          // This is not an actual error but just means no data found
          console.log("No presentation submission found for this student");
          setPresentation(null);
        } else {
          // This is a real error
          console.error("Error fetching presentation:", error);
          setPresentation(null);
        }
      } else {
        setPresentation(data);
      }
    };
    fetchPresentation();
  }, [studentId]);

  useEffect(() => {
    const fetchPrototype = async () => {
      const { data, error } = await supabase
        .from("dat_prototype_links")
        .select("*")
        .eq("student_id", studentId)
        .single();

      if (error) {
        // Check if this is just a "no rows returned" error
        if (error.code === "PGRST116") {
          // This is not an actual error but just means no data found
          console.log("No prototype submission found for this student");
          setPrototype(null);
        } else {
          // This is a real error
          console.error("Error fetching prototype:", error);
          setPrototype(null);
        }
      } else {
        setPrototype(data);
      }
    };
    fetchPrototype();
  }, [studentId]);

  if (loading) return <p>Loading ideas...</p>;

  return (
    <div
      className="container mx-auto p-6 min-h-screen"
      style={{ backgroundColor: "#F7F1EF" }}
    >
      <div className="flex items-center mb-8">
        <Link href="/dat/school/students" className="mr-4">
          <Button
            variant="outline"
            size="sm"
            className="hover:bg-gray-100 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-rose-600">
            {studentName
              ? `${studentName}'s Submissions`
              : "Student Submissions"}
          </h1>
        </div>
      </div>

      {/* Idea Cards */}
      {ideas.length === 0 ? (
        <p className="text-center text-gray-500">No ideas submitted.</p>
      ) : (
        ideas.map((idea) => (
          <Card key={idea.id} className="mb-4 shadow-md rounded-xl">
            <CardHeader className="border-b pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {idea.title}
                    <p className="text-sm text-gray-500">
                      Submitted on{" "}
                      {new Date(idea.created_at).toLocaleDateString()}
                    </p>
                  </CardTitle>
                </div>

                {/* Status Badge */}
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    getStatusColor(idea.status).bg
                  } ${getStatusColor(idea.status).text} border ${
                    getStatusColor(idea.status).border
                  }`}
                >
                  <span className="mr-1">
                    {getStatusColor(idea.status).icon}
                  </span>
                  {idea.status.charAt(0).toUpperCase() +
                    idea.status.slice(1).replace(/_/g, " ")}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 px-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">
                  Description
                </h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {idea.brief_description}
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900">
                    Why This Idea?
                  </h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {idea.why_this_idea}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900">
                    How Did You Get This Idea?
                  </h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {idea.how_get_this_idea}
                  </p>
                </div>
              </div>

              {/* Removed Admin Feedback Section */}
            </CardContent>
          </Card>
        ))
      )}

      {/* Presentation Card */}
      <Card className="mt-6 shadow-md rounded-xl">
        <CardHeader className="border-b pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Presentation
                {presentation?.created_at && (
                  <p className="text-sm text-gray-500">
                    Submitted on{" "}
                    {new Date(presentation.created_at).toLocaleDateString()}
                  </p>
                )}
              </CardTitle>
            </div>

            {/* Status Badge */}
            {presentation && (
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  getStatusColor(presentation.status).bg
                } ${getStatusColor(presentation.status).text} border ${
                  getStatusColor(presentation.status).border
                }`}
              >
                <span className="mr-1">
                  {getStatusColor(presentation.status).icon}
                </span>
                {presentation.status.charAt(0).toUpperCase() +
                  presentation.status.slice(1).replace(/_/g, " ")}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6 px-6">
          {presentation ? (
            <>
              {/* Link Section */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setPresentationVisible(!presentationVisible)}
                  className="bg-rose-600 hover:bg-rose-500 text-white transition-colors duration-200"
                >
                  {presentationVisible
                    ? "Hide Presentation"
                    : "View Presentation"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      getOriginalLink(presentation.presentation_link || "")
                    );
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }}
                  className="bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 transition-colors duration-200"
                >
                  {copySuccess ? "Link Copied!" : "Copy Link"}
                </Button>
              </div>

              {/* Presentation Viewer */}
              {presentationVisible && (
                <div className="aspect-video w-full max-w-3xl mx-auto bg-gray-100 rounded-lg overflow-hidden">
                  <iframe
                    src={formatPresentationLink(
                      presentation.presentation_link || ""
                    )}
                    title="Presentation"
                    width="100%"
                    height="100%"
                    style={{ border: "none" }}
                    allowFullScreen
                  />
                </div>
              )}

              {/* Removed Admin Feedback Section */}
            </>
          ) : (
            <p className="text-center text-gray-500">
              No presentation submitted yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Prototype Card */}
      <Card className="mt-6 shadow-md rounded-xl">
        <CardHeader className="border-b pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Prototype
                {prototype?.created_at && (
                  <p className="text-sm text-gray-500">
                    Submitted on{" "}
                    {new Date(prototype.created_at).toLocaleDateString()}
                  </p>
                )}
              </CardTitle>
            </div>

            {/* Status Badge */}
            {prototype && (
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  getStatusColor(prototype.status).bg
                } ${getStatusColor(prototype.status).text} border ${
                  getStatusColor(prototype.status).border
                }`}
              >
                <span className="mr-1">
                  {getStatusColor(prototype.status).icon}
                </span>
                {(() => {
                  const status = prototype.status;
                  return status
                    ? status.charAt(0).toUpperCase() +
                        status.slice(1).replace(/_/g, " ")
                    : "Not Submitted";
                })()}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6 px-6">
          {prototype ? (
            <>
              {/* Link Section */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() =>
                    prototype && window.open(prototype.prototype_link, "_blank")
                  }
                  className="bg-rose-600 hover:bg-rose-500 text-white transition-colors duration-200"
                >
                  View Prototype
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      prototype.prototype_link || ""
                    );
                    setCopyPrototypeSuccess(true);
                    setTimeout(() => setCopyPrototypeSuccess(false), 2000);
                  }}
                  className="bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 transition-colors duration-200"
                >
                  {copyPrototypeSuccess ? "Link Copied!" : "Copy Link"}
                </Button>
              </div>

              {/* Removed Admin Feedback Section */}
            </>
          ) : (
            <p className="text-center text-gray-500">
              No prototype submitted yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
