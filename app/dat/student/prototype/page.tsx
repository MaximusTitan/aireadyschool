"use client";
import React, { useState, useEffect, FormEvent } from "react";
import { supabase } from "@/app/dat/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, User } from "lucide-react";

export default function PrototypeLinkPage() {
  const [prototypeLink, setPrototypeLink] = useState<string>("");
  const [existingLink, setExistingLink] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Fetch the existing prototype link for the current user
  useEffect(() => {
    const fetchExistingLink = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        const { data: studentData } = await supabase
          .from("dat_student_details")
          .select("id")
          .eq("email", user.email)
          .maybeSingle();
        if (!studentData) return;
        const studentId = studentData.id;
        const { data: protoData } = await supabase
          .from("dat_prototype_links")
          .select("*")
          .eq("student_id", studentId)
          .maybeSingle();
        if (protoData) {
          setExistingLink(protoData.prototype_link);
          setPrototypeLink(protoData.prototype_link);
        }
      }
    };
    fetchExistingLink();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        const { data: studentData, error: studentError } = await supabase
          .from("dat_student_details")
          .select("id")
          .eq("email", user.email)
          .maybeSingle();
        if (studentError || !studentData) {
          console.error("Student details not found:", studentError);
          return;
        }
        const studentId = studentData.id;
        const { data, error } = await supabase
          .from("dat_prototype_links")
          .upsert(
            {
              student_id: studentId,
              prototype_link: prototypeLink,
              status: "review_pending", // Changed from 'pending' to 'review_pending'
            },
            {
              onConflict: "student_id",
            }
          )
          .select();
        if (error) {
          console.error("Error saving prototype link:", error.message);
          alert("Error saving prototype link: " + error.message);
        } else {
          console.log("Prototype link saved:", data);
          setExistingLink(prototypeLink);
          setIsEditing(false);
        }
      }
    } catch (err) {
      console.error("Exception in handleSubmit:", err);
      alert(
        "Error saving prototype link: " +
          (err instanceof Error ? err.message : String(err))
      );
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
      <div className="container mx-auto p-6">
        {/* Updated Header with improved typography */}
        <div className="flex items-center mb-8">
          <Button
            variant="outline"
            size="sm"
            className="mr-4"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold text-rose-600">Prototype Link</h1>
          <div className="flex-grow" />
          <Link href="/student/profile">
            <Button variant="outline" className="rounded-full p-3">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        {/* Conditionally render existing link view or form with updated card styling */}
        <div className="max-w-xl mx-auto">
          {existingLink && !isEditing ? (
            <div className="space-y-6 p-6 border rounded-lg bg-white shadow-sm">
              <p className="text-lg text-gray-700">
                Your submitted prototype link:
              </p>
              <div className="p-3 bg-gray-50 rounded-md border border-gray-200 break-all">
                <a
                  href={existingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {existingLink}
                </a>
              </div>
              <Button
                variant="outline"
                className="w-full py-2 border-rose-200 hover:bg-rose-50 text-rose-600"
                onClick={() => setIsEditing(true)}
              >
                Edit Prototype Link
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-6 border rounded-lg bg-white shadow-sm"
            >
              <div className="space-y-2">
                <label
                  htmlFor="prototype-url"
                  className="text-sm font-medium text-gray-700"
                >
                  Prototype URL
                </label>
                <input
                  id="prototype-url"
                  type="url"
                  value={prototypeLink}
                  onChange={(e) => setPrototypeLink(e.target.value)}
                  placeholder="Enter your prototype URL"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-rose-600 text-white py-3 rounded-lg hover:bg-rose-700 transition-all"
              >
                {existingLink ? "Update Prototype Link" : "Save Prototype Link"}
              </Button>
              {existingLink && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full py-2 border border-gray-300 hover:bg-gray-100 transition-all"
                  onClick={() => {
                    setPrototypeLink(existingLink);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
