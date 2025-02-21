"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import SchoolOnboarding from "@/app/school/components/SchoolOnboarding";
import { createClient } from "@/utils/supabase/client";

interface Subject {
  id: string;
  name: string;
}

interface Section {
  id: string;
  name: string;
}

interface Grade {
  id: string;
  name: string;
  sections: Section[];
}

interface Board {
  id: string;
  name: string;
  grades: Grade[];
  subjects: Subject[];
}

interface School {
  id: string;
  site_id: string;
  name: string;
  address: string;
  contact_info: {
    email?: string;
    phone?: string;
  };
  boards?: Board[];
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userSiteId, setUserSiteId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Get role from metadata
        setUserRole(user.user_metadata.role);

        // Only fetch site_id from users table
        const { data: userData } = await supabase
          .from("users")
          .select("site_id")
          .eq("user_id", user.id)
          .single();

        if (userData) {
          setUserSiteId(userData.site_id);
        }
      }
    };

    getUserData();
  }, [supabase]);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        if (userRole === "School" && userSiteId) {
          // If user is a school, only fetch their school
          const { data, error } = await supabase
            .from("schools")
            .select(
              `
              id,
              site_id,
              name,
              address,
              contact_info,
              boards (
                id,
                name,
                grades (
                  id,
                  name,
                  sections (
                    id,
                    name
                  )
                ),
                subjects (
                  id,
                  name
                )
              )
            `
            )
            .eq("site_id", userSiteId)
            .single();

          if (error) throw error;
          setSchools(data ? [data] : []);
        } else {
          // For other roles, fetch all schools
          const { data, error } = await supabase.from("schools").select(`
              id,
              site_id,
              name,
              address,
              contact_info
            `);

          if (error) throw error;
          setSchools(data || []);
        }
      } catch (error) {
        console.error("Error fetching schools:", error);
      }
    };

    if (userRole && (userRole !== "School" || userSiteId)) {
      fetchSchools();
    }
  }, [supabase, userRole, userSiteId]);

  if (userRole === "School" && !userSiteId) {
    return <SchoolOnboarding />;
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Schools</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map((school) => (
          <Card key={school.id} className="overflow-hidden">
            <CardHeader>
              <h3 className="text-xl font-semibold">{school.name}</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-muted-foreground mb-2">{school.address}</p>
                  <div className="text-sm space-y-1">
                    <p>Email: {school.contact_info.email}</p>
                    <p>Phone: {school.contact_info.phone}</p>
                  </div>
                </div>

                {school.boards && (
                  <div className="space-y-4 mt-4">
                    {school.boards.map((board) => (
                      <div key={board.id} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">{board.name}</h4>

                        {/* Subjects */}
                        {board.subjects && board.subjects.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-sm font-medium mb-1">
                              Subjects:
                            </h5>
                            <div className="flex flex-wrap gap-1">
                              {board.subjects.map((subject: Subject) => (
                                <span
                                  key={subject.id}
                                  className="text-xs bg-muted px-2 py-1 rounded"
                                >
                                  {subject.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Grades and Sections */}
                        {board.grades && board.grades.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium mb-1">
                              Grades:
                            </h5>
                            <div className="space-y-2">
                              {board.grades.map((grade) => (
                                <div key={grade.id} className="text-sm">
                                  <span className="font-medium">
                                    {grade.name}
                                  </span>
                                  {grade.sections && (
                                    <span className="text-muted-foreground">
                                      {" - "}
                                      {grade.sections
                                        .map((s: Section) => s.name)
                                        .join(", ")}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
