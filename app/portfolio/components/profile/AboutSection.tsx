"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface AboutSectionProps {}

export default function AboutSection({}: AboutSectionProps) {
  const [about, setAbout] = useState("");
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  // Fetch student data on component mount
  useEffect(() => {
    async function fetchStudentData() {
      try {
        setIsLoading(true);
        
        // Get the current user's email from auth
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user || !user.email) {
          console.log("User not authenticated or missing email");
          setIsAuthenticated(false);
          
          // For development purposes only - get first student record
          // In production, you should remove this and handle unauthenticated state properly
          const { data: firstStudent } = await supabase
            .from('students')
            .select('student_email, about')
            .limit(1)
            .single();
            
          if (firstStudent) {
            console.log("Using first student as fallback:", firstStudent.student_email);
            setUserEmail(firstStudent.student_email);
            setAbout(firstStudent.about || "");
          }
          
          setIsLoading(false);
          return;
        }
        
        // User is authenticated
        setIsAuthenticated(true);
        setUserEmail(user.email);
        
        // Query the students table for the current user
        const { data, error } = await supabase
          .from('students')
          .select('about')
          .eq('student_email', user.email)
          .single();
        
        if (error) {
          console.error("Error fetching student data:", error);
          if (error.code === 'PGRST116') {
            console.log("No record found for this email, may need to create one");
          }
        } else if (data) {
          setAbout(data.about || "");
        }
      } catch (error) {
        console.error("Error in fetchStudentData:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStudentData();
  }, [supabase]);

  const handleAboutSave = async () => {
    if (!userEmail) {
      console.log("Cannot save without user email");
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Update the about field in the students table
      const { error } = await supabase
        .from('students')
        .update({ 
          about,
          updated_at: new Date().toISOString()
        })
        .eq('student_email', userEmail);
      
      if (error) {
        console.error("Error updating student data:", error);
        alert("Failed to save. Please try again.");
        return;
      }
      
      setIsEditingAbout(false);
    } catch (error) {
      console.error("Exception in handleAboutSave:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="mt-12 animate-pulse h-32 bg-gray-100 rounded-md"></div>;
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">About</h2>
        {userEmail && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsEditingAbout(true)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {!userEmail && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-700">
            {isAuthenticated 
              ? "Your profile hasn't been set up yet." 
              : "Please sign in to view and edit your profile."}
          </p>
        </div>
      )}
      
      {userEmail && (
        <>
          {isEditingAbout ? (
            <div className="space-y-2">
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="w-full p-2 border rounded-md min-h-[120px]"
                rows={5}
                placeholder="Tell us about yourself..."
              />
              <div className="flex gap-2">
                <Button onClick={handleAboutSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditingAbout(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {about ? (
                <p className="text-gray-600 leading-relaxed">{about}</p>
              ) : (
                <p className="text-gray-400 italic">No information provided yet.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}