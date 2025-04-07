"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, School, Check, X, LogOut, BookOpen, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/app/dat/utils/supabaseClient";

interface PendingSchool {
  id: number;
  school_name: string;
  contact_name: string;
  email: string;
  status: string;
}

export default function AdminDashboard() {
  const [pendingSchools, setPendingSchools] = useState<PendingSchool[]>([]);
  const [loadingApproval, setLoadingApproval] = useState<number | null>(null);
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalStudents: 0,
    groupA: 0,
    groupB: 0,
    groupC: 0,
    groupD: 0,
  });
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch total approved schools
      const { count: schoolCount } = await supabase
        .from("dat_school_details")
        .select("*", { count: "exact" })
        .eq("status", "approved");

      // Fetch total students
      const { count: studentCount } = await supabase
        .from("dat_student_details")
        .select("*", { count: "exact" });

      // Fetch students with grades
      const { data: gradeData } = await supabase
        .from("dat_student_details")
        .select("grade")
        .not("grade", "is", null);

      const groupStats = {
        groupA: 0,
        groupB: 0,
        groupC: 0,
        groupD: 0,
      };

      // Map grades to groups and count
      if (gradeData) {
        gradeData.forEach((item) => {
          const grade = Number(item.grade);
          if (grade <= 6) groupStats.groupA++;
          else if (grade <= 8) groupStats.groupB++;
          else if (grade <= 10) groupStats.groupC++;
          else if (grade <= 12) groupStats.groupD++;
        });
      }

      // Update stats
      setStats({
        totalSchools: schoolCount || 0,
        totalStudents: studentCount || 0,
        ...groupStats,
      });

      // Fetch pending schools
      const { data: pendingData } = await supabase
        .from("dat_school_details")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      setPendingSchools(pendingData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleApproval = async (
    schoolId: number,
    approved: boolean,
    paymentRequired: boolean
  ) => {
    setLoadingApproval(schoolId);
    const registrationLink = `${window.location.origin}/dat/register/student/${schoolId}`;

    const { error } = await supabase
      .from("dat_school_details")
      .update({
        status: approved ? "approved" : "rejected",
        payment_required: paymentRequired,
        ...(approved && { registration_link: registrationLink }),
      })
      .eq("id", schoolId);

    if (!error) {
      await fetchData();
    }
    setLoadingApproval(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-rose-600">Admin Dashboard</h1>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/dat/admin/register-judge")}
            >
              Register Judge
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/dat/instructions")}
            >
              <BookOpen className="h-4 w-4 mr-1" />
              Instructions
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="p-2"
              title="Logout"
            >
              <LogOut className="h-5 w-5 text-rose-600" />
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link href="/dat/admin/schools">
            <Card className="bg-white hover:shadow-lg transition-all cursor-pointer border-rose-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <School className="h-8 w-8 text-rose-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Schools</p>
                    <p className="text-3xl font-bold text-rose-600">
                      {stats.totalSchools}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dat/admin/students">
            <Card className="bg-white hover:shadow-lg transition-all cursor-pointer border-rose-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <User className="h-8 w-8 text-rose-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Students</p>
                    <p className="text-3xl font-bold text-rose-600">
                      {stats.totalStudents}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Add group statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[
            { group: "A", grades: "5-6" },
            { group: "B", grades: "7-8" },
            { group: "C", grades: "9-10" },
            { group: "D", grades: "11-12" },
          ].map(({ group, grades }) => (
            <Link
              key={group}
              href={{
                pathname: "/dat/admin/students",
                query: { group },
              }}
            >
              <Card className="bg-white border-rose-200 hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Users className="h-8 w-8 text-rose-600" />
                    <div>
                      <p className="text-sm text-gray-600">
                        Group {group} (Grade {grades})
                      </p>
                      <p className="text-3xl font-bold text-rose-600">
                        {stats[`group${group}` as keyof typeof stats]}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="border-rose-200">
          <CardHeader>
            <h2 className="text-xl font-semibold text-rose-600">
              Pending School Approvals
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingSchools.map((school) => (
                <div
                  key={school.id}
                  className="flex items-center justify-between border-b pb-4"
                >
                  <div>
                    <p className="font-semibold">{school.school_name}</p>
                    <p className="text-sm text-gray-500">
                      {school.contact_name} - {school.email}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex items-center mr-4 gap-2">
                      <Switch
                        id={`payment-${school.id}`}
                        defaultChecked={true}
                        onCheckedChange={(checked) => {
                          if (!checked) {
                            const confirm = window.confirm(
                              "Are you sure you want to make registration free for this school?"
                            );
                            if (!confirm) {
                              // Need to manually revert the switch if user cancels
                              const switchElement = document.getElementById(
                                `payment-${school.id}`
                              ) as HTMLButtonElement;
                              if (switchElement) {
                                switchElement.click();
                              }
                            }
                          }
                        }}
                      />
                      <label
                        htmlFor={`payment-${school.id}`}
                        className="text-sm text-gray-600 select-none"
                      >
                        Require Payment
                      </label>
                    </div>
                    <Button
                      onClick={() => {
                        const switchElement = document.getElementById(
                          `payment-${school.id}`
                        ) as HTMLButtonElement;
                        const paymentRequired =
                          switchElement?.getAttribute("aria-checked") ===
                          "true";
                        handleApproval(school.id, true, paymentRequired);
                      }}
                      variant="outline"
                      size="sm"
                      className="text-green-600"
                      disabled={loadingApproval === school.id}
                    >
                      {loadingApproval === school.id ? (
                        <div className="animate-spin mr-1">⏳</div>
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleApproval(school.id, false, true)}
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      disabled={loadingApproval === school.id}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
              {pendingSchools.length === 0 && (
                <p className="text-gray-500 text-center">
                  No pending approvals
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
