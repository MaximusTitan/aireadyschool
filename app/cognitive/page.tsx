"use client";

import { useState, useEffect } from "react";
import Header from "../profile/components/profile/Header";
import { CognitiveAssessment } from "./components/CognitiveAssessment";
import { createClient } from "@/utils/supabase/client";

export default function CognitivePage() {
  const [studentEmail, setStudentEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentEmail();
  }, []);

  const fetchStudentEmail = async () => {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      setError("Failed to authenticate user");
      setIsLoading(false);
      return;
    }

    if (!user?.email) {
      setError("User email not found");
      setIsLoading(false);
      return;
    }

    setStudentEmail(user.email);
    setIsLoading(false);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {studentEmail && <CognitiveAssessment studentEmail={studentEmail} />}
        </div>
      </main>
    </div>
  );
}
