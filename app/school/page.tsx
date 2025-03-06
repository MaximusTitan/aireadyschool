"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SchoolOnboarding from "@/app/school/components/SchoolOnboarding";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { 
  School, 
  Building2, 
  Mail, 
  Phone, 
  BookOpen, 
  ArrowRight, 
  PlusCircle, 
  Users, 
  HomeIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
      setIsLoading(true);
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
              boards!inner (
                id,
                name,
                school_id,
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
            .eq("boards.school_id", userSiteId)
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
      } finally {
        setIsLoading(false);
      }
    };

    if (userRole && (userRole !== "School" || userSiteId)) {
      fetchSchools();
    }
  }, [supabase, userRole, userSiteId]);

  const SchoolSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <Skeleton className="h-7 w-3/4 mb-2" />
              <Skeleton className="h-9 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-3" />
            <Skeleton className="h-4 w-3/4 mb-3" />
            <Skeleton className="h-4 w-1/2 mb-5" />
            <Skeleton className="h-20 w-full mb-2 rounded-md" />
          </CardContent>
          <CardFooter className="flex justify-end bg-muted/30 pt-2">
            <Skeleton className="h-9 w-36" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
  
  const BoardCard = ({ board }: { board: Board }) => {
    // Count total grades and sections
    const totalSections = board.grades.reduce(
      (acc, grade) => acc + grade.sections.length, 
      0
    );
    
    return (
      <Card key={board.id} className="hover:shadow-md transition-all border-muted group">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h4 className="font-medium group-hover:text-primary transition-colors">{board.name}</h4>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {board.grades.length} Grades
              </Badge>
              <Badge variant="outline" className="text-xs">
                {totalSections} Sections
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardFooter className="flex justify-end bg-muted/30 pt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="group-hover:bg-primary group-hover:text-primary-foreground"
          >
            <Link href={`/school/${encodeURIComponent(board.name)}`} className="flex items-center">
              View Board
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="container py-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-lg p-6 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="space-y-1">
              <Skeleton className="h-9 w-48 mb-1" />
              <Skeleton className="h-5 w-64" />
            </div>
          </div>
          <SchoolSkeleton />
        </div>
      </div>
    );
  }

  if (userRole === "School" && !userSiteId) {
    return <SchoolOnboarding />;
  }

  return (
    <div className="container py-10 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-lg p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold flex items-center">
              <School className="mr-2 h-8 w-8 text-primary" />
              Schools Dashboard
            </h1>
            <p className="text-muted-foreground">
              {userRole === "School" 
                ? "Manage your school, boards, grades and sections" 
                : "View and manage schools"}
            </p>
          </div>
          
          {userRole === "School" && (
            <Button size="sm" asChild>
              <Link href="/school/members" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Manage Members
              </Link>
            </Button>
          )}
        </div>

        {schools.length === 0 ? (
          <div className="text-center p-12 bg-muted/30 rounded-lg">
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No Schools Available</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {userRole === "School" 
                ? "Your school profile hasn't been set up yet."
                : "There are no schools available in the system."}
            </p>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              {userRole === "School" ? "Set Up School Profile" : "Add School"}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schools.map((school) => (
              <Card key={school.id} className="overflow-hidden hover:shadow-md transition-all border-muted">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Building2 className="h-5 w-5 mr-2 text-primary" />
                      {school.name}
                    </h3>
                    {school.boards && (
                      <Badge variant="outline" className="py-1">
                        {school.boards.length} Board{school.boards.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <HomeIcon className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                      <p className="text-muted-foreground text-sm">{school.address}</p>
                    </div>
                    
                    {school.contact_info.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <p className="text-sm">{school.contact_info.email}</p>
                      </div>
                    )}
                    
                    {school.contact_info.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <p className="text-sm">{school.contact_info.phone}</p>
                      </div>
                    )}
                  </div>

                  {school.boards && school.boards.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-sm font-medium border-b pb-1">Boards</h4>
                      <div className="space-y-3">
                        {school.boards.map(board => (
                          <BoardCard key={board.id} board={board} />
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                {userRole === "School" && (
                  <CardFooter className="flex justify-end gap-2 bg-muted/30 pt-3">
                    <Button variant="outline" size="sm">
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Add Board
                    </Button>
                    <Button size="sm">
                      <ArrowRight className="h-4 w-4 mr-1" />
                      School Details
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
