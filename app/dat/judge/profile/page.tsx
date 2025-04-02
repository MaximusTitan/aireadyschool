"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/app/dat/utils/supabaseClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface JudgeDetails {
  id: string;
  name: string;
  email: string;
  city: string;
  round: string[];
  groups: string[]; // Updated to match the database column name
  schools: string[];
}
interface School {
  id: string;
  school_name: string;
  city: string;
}

export default function JudgeProfile() {
  const [judgeDetails, setJudgeDetails] = useState<JudgeDetails | null>(null);
  const [assignedSchools, setAssignedSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchJudgeDetails = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/sign-in");
        return;
      }

      const { data, error } = await supabase
        .from("dat_judge_details")
        .select("*")
        .eq("email", user.email)
        .single();

      if (error || !data) throw error || new Error("Judge not found");
      setJudgeDetails(data);

      if (data.schools && data.schools.length > 0) {
        const { data: schoolsData, error: schoolsError } = await supabase
          .from("dat_school_details")
          .select("id, school_name, city")
          .in("id", data.schools);
        if (schoolsError) throw schoolsError;
        setAssignedSchools(schoolsData || []);
      }
    } catch (error) {
      console.error("Error fetching judge details:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchJudgeDetails();
  }, [fetchJudgeDetails]);

  const formatGroups = (groups: string[] | null | undefined) => {
    if (!groups || !Array.isArray(groups)) return "None";

    const groupNames: { [key: string]: string } = {
      A: "Group A (Grade 5-6)",
      B: "Group B (Grade 7-8)",
      C: "Group C (Grade 9-10)",
      D: "Group D (Grade 11-12)",
    };

    return groups.map((g) => groupNames[g] || g).join(", ");
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
        <div className="mb-8 flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-rose-600">Judge Profile</h1>
            <p className="text-gray-600">
              Your personal information and assigned schools
            </p>
          </div>
        </div>

        <Card className="border-rose-200">
          <CardHeader>
            <h2 className="text-xl font-semibold text-rose-600">
              Personal Information
            </h2>
          </CardHeader>
          <CardContent>
            <p>
              <strong>Name:</strong> {judgeDetails?.name}
            </p>
            <p>
              <strong>Email:</strong> {judgeDetails?.email}
            </p>
            <p>
              <strong>City:</strong> {judgeDetails?.city}
            </p>
            <p>
              <strong>Rounds:</strong>{" "}
              {Array.isArray(judgeDetails?.round)
                ? judgeDetails.round.join(", ")
                : judgeDetails?.round}
            </p>
            <p>
              <strong>Groups:</strong> {formatGroups(judgeDetails?.groups)}
            </p>
          </CardContent>
        </Card>

        <div className="mt-6">
          <Card className="border-rose-200">
            <CardHeader>
              <h2 className="text-xl font-semibold text-rose-600">
                Assigned Schools
              </h2>
            </CardHeader>
            <CardContent>
              {assignedSchools.length > 0 ? (
                <ul className="space-y-2">
                  {assignedSchools.map((school) => (
                    <li
                      key={school.id}
                      className="p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <span className="font-medium">
                          {school.school_name}
                        </span>
                        <span className="text-gray-500 ml-2">
                          - {school.city}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No schools assigned.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
