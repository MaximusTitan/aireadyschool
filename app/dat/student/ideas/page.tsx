"use client";
import React, { useState, useEffect, FormEvent } from "react";
import { createClient } from "@/utils/supabase/client"; // Replace supabase import
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { User, Pencil, Sparkles, Brain, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  grade: string;
  photo?: string;
  // ...other fields...
}

interface IdeaType {
  id?: string;
  title: string;
  brief_description: string;
  why_this_idea: string;
  how_get_this_idea: string;
}

export default function StudentIdeaPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [idea, setIdea] = useState<IdeaType>({
    title: "",
    brief_description: "",
    why_this_idea: "",
    how_get_this_idea: "",
  });
  const [submittedIdea, setSubmittedIdea] = useState<IdeaType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [ideaExpanded, setIdeaExpanded] = useState(false);

  useEffect(() => {
    const fetchProfileAndIdea = async () => {
      const supabase = createClient(); // Initialize Supabase client
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        const { data: profileData, error } = await supabase
          .from("dat_student_details")
          .select("*")
          .eq("email", user.email)
          .maybeSingle();
        if (!error) setProfile(profileData);

        if (profileData?.id) {
          const { data: ideaData, error: ideaError } = await supabase
            .from("dat_ideas")
            .select("*")
            .eq("student_id", profileData.id)
            .maybeSingle();
          if (!ideaError && ideaData) {
            setSubmittedIdea(ideaData);
          }
        }
      }
      setLoading(false);
    };
    fetchProfileAndIdea();
  }, []);

  // autoResize handler remains unchanged
  const autoResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = "auto";
    target.style.height = `${target.scrollHeight}px`;
    if (parseInt(target.style.height) < 80) {
      target.style.height = "80px";
    }
  };

  const handleIdeaSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    const supabase = createClient(); // Initialize Supabase client

    if (!isEditing) {
      const { data, error } = await supabase
        .from("dat_ideas")
        .insert([
          {
            student_id: profile.id,
            ...idea,
            status: "review_pending", // Set initial status to review_pending
          },
        ])
        .select();
      if (!error && data && data.length > 0) {
        setSubmittedIdea(data[0]);
        setIdea({
          title: "",
          brief_description: "",
          why_this_idea: "",
          how_get_this_idea: "",
        });
      }
    } else {
      const { error } = await supabase
        .from("dat_ideas")
        .update({ ...idea })
        .eq("id", submittedIdea?.id);
      if (!error) {
        setSubmittedIdea({ ...idea, id: submittedIdea?.id });
        setIsEditing(false);
      }
    }
  };

  const handleEditClick = () => {
    if (submittedIdea) {
      setIdea(submittedIdea);
      setIsEditing(true);
    }
  };

  const toggleIdeaExpanded = () => {
    setIdeaExpanded((prev) => !prev);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce delay-100"></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce delay-200"></div>
        </div>
      </div>
    );
  if (!profile) return <p>No profile found.</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header Section with Back Button */}
        <div className="flex items-center mb-8">
          <Button
            variant="outline"
            size="sm"
            className="mr-4"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">My Idea</h1>
          <div className="flex-grow" /> {/* fills remaining space */}
          <Link href="/dat/student/profile">
            <Button variant="outline" className="rounded-full p-3">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        {!submittedIdea || isEditing ? (
          <Card className="border-2 border-rose-100 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <Pencil className="h-6 w-6 text-rose-500" />
                ) : (
                  <Sparkles className="h-6 w-6 text-rose-500" />
                )}
                <h2 className="text-2xl font-semibold text-rose-600">
                  {isEditing ? "Edit Your Idea" : "Submit Your Idea"}
                </h2>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleIdeaSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={idea.title}
                    onChange={(e) =>
                      setIdea({ ...idea, title: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                    placeholder="Enter your idea title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brief Description
                  </label>
                  <textarea
                    value={idea.brief_description}
                    onChange={(e) =>
                      setIdea({ ...idea, brief_description: e.target.value })
                    }
                    onInput={autoResize}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none overflow-hidden min-h-[80px]"
                    required
                    placeholder="Describe your idea briefly"
                    rows={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Why This Idea?
                  </label>
                  <textarea
                    value={idea.why_this_idea}
                    onChange={(e) =>
                      setIdea({ ...idea, why_this_idea: e.target.value })
                    }
                    onInput={autoResize}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none overflow-hidden min-h-[80px]"
                    required
                    placeholder="Explain why you chose this idea"
                    rows={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    How Did You Get This Idea?
                  </label>
                  <textarea
                    value={idea.how_get_this_idea}
                    onChange={(e) =>
                      setIdea({ ...idea, how_get_this_idea: e.target.value })
                    }
                    onInput={autoResize}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none overflow-hidden min-h-[80px]"
                    required
                    placeholder="Explain how you came up with this idea"
                    rows={1}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white py-3 rounded-lg hover:from-rose-600 hover:to-rose-700 transition-all"
                >
                  {isEditing ? "Update Idea" : "Submit Idea"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="container mx-auto p-6">
            <div onClick={toggleIdeaExpanded} className="w-full cursor-pointer">
              <Card className="border-2 border-rose-100 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Brain className="h-6 w-6 text-rose-500" />
                      <h2 className="text-2xl font-semibold text-rose-600">
                        Your Submitted Idea
                      </h2>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Trigger edit without collapsing card
                        handleEditClick();
                      }}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit Idea
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Title</h3>
                    <p className="mt-1 text-lg">{submittedIdea?.title}</p>
                  </div>
                  {ideaExpanded && (
                    <>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Brief Description
                        </h3>
                        <p className="mt-1 text-lg">
                          {submittedIdea?.brief_description}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Why This Idea?
                        </h3>
                        <p className="mt-1 text-lg">
                          {submittedIdea?.why_this_idea}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          How Did You Get This Idea?
                        </h3>
                        <p className="mt-1 text-lg">
                          {submittedIdea?.how_get_this_idea}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
