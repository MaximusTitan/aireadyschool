"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client"; // Replace supabase import
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon, CircleUser, BookOpen } from "lucide-react";
import Link from "next/link";

export default function SchoolDashboard() {
  const [registrationLink, setRegistrationLink] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [stats, setStats] = useState({
    students: 0,
    groupA: 0,
    groupB: 0,
    groupC: 0,
    groupD: 0,
  });
  const [schoolName, setSchoolName] = useState<string>("");

  useEffect(() => {
    const fetchSchoolData = async () => {
      const supabase = createClient(); // Initialize Supabase client
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        const { data: schoolData } = await supabase
          .from("dat_school_details")
          .select("id, registration_link, school_name")
          .eq("email", user.email)
          .single();

        if (schoolData) {
          if (schoolData.registration_link) {
            setRegistrationLink(schoolData.registration_link);
          }
          setSchoolName(schoolData.school_name || "");

          // Get students with their grades for this school
          const { data: studentsData } = await supabase
            .from("dat_student_details")
            .select("grade")
            .eq("school_id", schoolData.id)
            .not("grade", "is", null);

          const groupCounts = { A: 0, B: 0, C: 0, D: 0 };
          let totalStudents = 0;

          if (studentsData) {
            totalStudents = studentsData.length;
            studentsData.forEach((student) => {
              const grade = parseInt(student.grade);
              if (grade === 5 || grade === 6) groupCounts.A++;
              else if (grade === 7 || grade === 8) groupCounts.B++;
              else if (grade === 9 || grade === 10) groupCounts.C++;
              else if (grade === 11 || grade === 12) groupCounts.D++;
            });
          }

          setStats({
            students: totalStudents,
            groupA: groupCounts.A,
            groupB: groupCounts.B,
            groupC: groupCounts.C,
            groupD: groupCounts.D,
          });
        }
      }
    };

    fetchSchoolData();
  }, []);

  return (
    <div
      className="container mx-auto p-6 min-h-screen"
      style={{ backgroundColor: "#F7F1EF" }}
    >
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-rose-600">
            {schoolName ? `${schoolName} Dashboard` : "School Dashboard"}
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your school`s participation in the competition
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dat/instructions/view_school">
            <Button
              variant="outline"
              className="border-rose-200 hover:bg-rose-50"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Instructions
            </Button>
          </Link>
          <Link href="/dat/school/profile">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full hover:bg-gray-100"
            >
              <CircleUser className="h-8 w-8 text-rose-600" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Total Students Card */}
        <Card className="shadow-md rounded-xl">
          <div className="p-2">
            <Link href="/dat/school/students" className="block">
              <div className="bg-white rounded-lg p-6 text-rose-600 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-black">
                  Total Students
                </h3>
                <p className="text-4xl font-bold">{stats.students}</p>
              </div>
            </Link>
          </div>
        </Card>

        {/* Group Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { group: "A", grades: "5/6", count: stats.groupA },
            { group: "B", grades: "7/8", count: stats.groupB },
            { group: "C", grades: "9/10", count: stats.groupC },
            { group: "D", grades: "11/12", count: stats.groupD },
          ].map((item) => (
            <Card key={item.group} className="shadow-md rounded-xl">
              <Link
                href={`/dat/school/students?group=${item.group}`}
                className="block"
              >
                <div className="p-6">
                  <div className="bg-white rounded-lg text-rose-600">
                    <h3 className="text-lg font-bold text-black">
                      Group {item.group}
                    </h3>
                    <p className="text-sm text-black mt-1">
                      (Grade {item.grades})
                    </p>
                    <p className="text-4xl font-bold mt-2">{item.count}</p>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>

        {/* Registration Link Card */}
        {registrationLink && (
          <Card className="shadow-md rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Registration Link
                  </h3>
                  <p className="text-gray-500 mt-1">
                    Share this link with students to join the competition
                  </p>
                </div>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(registrationLink);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }}
                  variant="outline"
                  className="bg-rose-600 hover:bg-rose-500 text-white transition-colors duration-200"
                >
                  {copySuccess ? (
                    <span className="flex items-center gap-2">
                      Copied! <LinkIcon className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Copy Link <LinkIcon className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
