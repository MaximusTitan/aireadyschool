"use client";
import React, { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, User, ExternalLink } from "lucide-react";
import { supabase } from "@/app/dat/utils/supabaseClient";

export default function PresentationLinkPage() {
  const [presentationLink, setPresentationLink] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [editing, setEditing] = useState(false);

  // Update this function to match PresentationCard implementation
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

  const getDisplayLink = (url: string) => {
    // For display, show the URL without the embed suffix
    if (url.includes("docs.google.com/presentation")) {
      return url.replace("/embed", "/edit");
    }
    return url;
  };

  // On mount, fetch existing presentation link for the student.
  useEffect(() => {
    const fetchPresentationLink = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) {
        console.error("User not found");
        return;
      }
      const { data: studentData, error: studentError } = await supabase
        .from("dat_student_details")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();
      if (studentError || !studentData?.id) {
        console.error("Student not found", studentError);
        return;
      }
      // Fetch existing presentation link
      const { data: linkData, error: linkError } = await supabase
        .from("dat_presentation_links")
        .select("presentation_link")
        .eq("student_id", studentData.id)
        .maybeSingle();
      if (!linkError && linkData) {
        // Don't re-format already formatted links, just set them directly
        console.log("Setting presentation link:", linkData.presentation_link);
        setPresentationLink(linkData.presentation_link);
        setIsSubmitted(true);
        setEditing(false);
      }
    };
    fetchPresentationLink();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // Get current user info
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) {
        console.error("User not found");
        return;
      }

      // Fetch the student record using the current user's email.
      const { data: studentData, error: studentError } = await supabase
        .from("dat_student_details")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();

      if (studentError || !studentData?.id) {
        console.error("Student not found", studentError);
        return;
      }

      const formattedLink = formatPresentationLink(presentationLink);
      if (!formattedLink) {
        return; // Invalid link format, error already shown to user
      }

      console.log("Saving presentation link:", formattedLink);

      // Upsert the presentation link using the unique student constraint.
      const { error } = await supabase.from("dat_presentation_links").upsert(
        {
          student_id: studentData.id,
          presentation_link: formattedLink,
          status: "review_pending", // Use the new enum value
        },
        {
          onConflict: "student_id",
        }
      );

      if (error) {
        console.error("Error saving presentation link:", error);
        alert(
          "Error saving presentation link: " +
            (error.message || JSON.stringify(error))
        );
      } else {
        setPresentationLink(formattedLink);
        setIsSubmitted(true);
        setEditing(false);
      }
    } catch (err) {
      console.error("Exception in handleSubmit:", err);
      alert(
        "Error saving presentation link: " +
          (err instanceof Error ? err.message : JSON.stringify(err))
      );
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
      <div className="container mx-auto p-6">
        {/* Header with Back and Profile */}
        <div className="flex items-center mb-8">
          <Button
            variant="outline"
            size="sm"
            className="mr-4"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold text-rose-600">
            Presentation Link
          </h1>
          <div className="flex-grow" />
          <Link href="/student/profile">
            <Button variant="outline" className="rounded-full p-3">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* If a link is submitted and not in edit mode, show it in a larger container */}
        {isSubmitted && !editing ? (
          <div className="max-w-5xl mx-auto">
            <div className="space-y-6 p-6 border rounded-lg bg-white shadow-sm">
              <p className="text-lg text-gray-800 font-medium">
                Your submitted presentation:
              </p>

              {/* Increased the height of the presentation container */}
              <div className="mx-auto aspect-video h-[400px] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                <iframe
                  src={formatPresentationLink(presentationLink)}
                  title="Presentation"
                  width="100%"
                  height="100%"
                  style={{ border: "none" }}
                  allowFullScreen
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-md border border-gray-200 flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-gray-500" />
                <a
                  href={getDisplayLink(presentationLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline break-all text-sm"
                >
                  {getDisplayLink(presentationLink)}
                </a>
              </div>

              <Button
                variant="outline"
                onClick={() => setEditing(true)}
                className="w-full border-rose-200 hover:bg-rose-50 text-rose-600"
              >
                Edit Presentation Link
              </Button>
            </div>
          </div>
        ) : (
          // Keep the form at a smaller width for better input experience
          <div className="max-w-xl mx-auto">
            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-6 border rounded-lg bg-white shadow-sm"
            >
              <div className="space-y-2">
                <label
                  htmlFor="presentation-url"
                  className="text-sm font-medium text-gray-700"
                >
                  Presentation URL
                </label>
                <input
                  id="presentation-url"
                  type="url"
                  value={presentationLink}
                  onChange={(e) => setPresentationLink(e.target.value)}
                  placeholder="Enter your presentation URL"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Please enter a Google Slides presentation link
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-rose-600 text-white py-3 rounded-lg hover:bg-rose-700 transition-all"
              >
                {isSubmitted
                  ? "Update Presentation Link"
                  : "Save Presentation Link"}
              </Button>

              {isSubmitted && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full py-2 border border-gray-300 hover:bg-gray-100 transition-all"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
