"use client";

import React, { useState, useEffect } from "react";
import { SkillsSection } from "./skills/SkillsSection";
import Header from "./profile/Header";
import ProfileHeader from "./profile/ProfileHeader";
import InterestsSection from "./profile/InterestsSection";
import VideoSection from "./media/VideoSection";
import PresentationSection from "./media/PresentationSection";
import ArtworkSection from "./media/ArtworkSection";
import ResearchWorkSection from "./media/ResearchWorkSection";
import { AppSection } from "./media/AppSection";
import AboutSection from "./profile/AboutSection";
import { createClient } from "@/utils/supabase/client";


interface StudentPortfolioProps {
  initialEmail?: string;
}

export function StudentPortfolio({ initialEmail }: StudentPortfolioProps) {
  const [studentEmail, setStudentEmail] = useState<string | null>(initialEmail || null);
  const [isLoading, setIsLoading] = useState(!initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [isPublicView, setIsPublicView] = useState(!!initialEmail);

  useEffect(() => {
    if (!initialEmail) {
      fetchStudentEmail();
    }
  }, [initialEmail]);

  const fetchStudentEmail = async () => {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Error fetching user:", error);
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
      {!isPublicView && <Header />}
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {studentEmail && (
            <>
              <ProfileHeader />
              <AboutSection/>
              <SkillsSection />
              <InterestsSection />
              <VideoSection />
              <PresentationSection />
              <ArtworkSection />
              <ResearchWorkSection />
              <AppSection />
              
            </>
          )}
        </div>
      </main>
    </div>
  );
}

