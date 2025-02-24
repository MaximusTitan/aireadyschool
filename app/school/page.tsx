"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SchoolOnboarding from "@/app/school/components/SchoolOnboarding";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

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
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUserData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setUserRole(user.user_metadata.role);

          const { data: userData } = await supabase
            .from("users")
            .select("site_id")
            .eq("user_id", user.id)
            .single();

          if (userData) {
            setUserSiteId(userData.site_id);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    getUserData();
  }, [supabase]);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        if (userRole === "School" && userSiteId) {
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

          if (data && data.boards) {
            data.boards = data.boards.map((board) => ({
              ...board,
              grades: board.grades
                .sort(
                  (a: Grade, b: Grade) =>
                    parseInt(a.name.replace("Grade ", "")) -
                    parseInt(b.name.replace("Grade ", ""))
                )
                .map((grade) => ({
                  ...grade,
                  sections: grade.sections.sort((a: Section, b: Section) =>
                    a.name.localeCompare(b.name)
                  ),
                })),
            }));
          }

          setSchools(data ? [data] : []);
        } else {
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

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

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
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold">{school.name}</h3>
                {userRole === "School" && (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/school/members">Manage Members</Link>
                  </Button>
                )}
              </div>
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
                      <Link
                        href={`/school/${encodeURIComponent(board.name)}`}
                        key={board.id}
                        className="block border rounded-lg p-4 hover:bg-muted transition-colors"
                      >
                        <h4 className="font-medium mb-2">{board.name}</h4>
                      </Link>
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
