"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import {
  Section,
  Subject,
  Teacher,
  TeacherData,
  Student,
} from "@/app/school/types";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Mail, Book, User, Edit, Eye, UserPlus, BookPlus, UserPlus2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SectionPage({
  params,
}: {
  params: Promise<{ board: string; grade: string; section: string }>;
}) {
  const resolvedParams = use(params);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("teachers");
  const decodedBoardName = decodeURIComponent(resolvedParams.board);
  const decodedGradeName = decodeURIComponent(resolvedParams.grade);
  const decodedSectionName = decodeURIComponent(resolvedParams.section).replace(
    "Section-",
    ""
  );
  const supabase = createClient();

  useEffect(() => {
    const fetchSectionData = async () => {
      setIsLoading(true);
      try {
        // Get the current user's school_id
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Get user's school site_id
        const { data: userData } = await supabase
          .from("users")
          .select("site_id")
          .eq("user_id", user.id)
          .single();

        if (!userData?.site_id) return;

        // Get board data
        const { data: boardData } = await supabase
          .from("boards")
          .select("id")
          .eq("school_id", userData.site_id)
          .eq("name", decodedBoardName)
          .single();

        if (!boardData) return;

        // Get grade data
        const { data: gradeData } = await supabase
          .from("grades")
          .select("id")
          .eq("board_id", boardData.id)
          .eq("name", decodedGradeName)
          .single();

        if (!gradeData) return;

        // Get section data
        const { data: sectionData } = await supabase
          .from("sections")
          .select("id")
          .eq("grade_id", gradeData.id)
          .eq("name", decodedSectionName)
          .single();

        if (!sectionData) return;

        // Fetch subjects for this board
        const { data: subjectsData } = await supabase
          .from("subjects")
          .select("*")
          .eq("board_id", boardData.id);

        setSubjects((subjectsData || []) as Subject[]);

        interface TeacherAssignmentResponse {
          teacher: {
            id: string;
            user_id: string;
          };
          subject: {
            id: string;
            name: string;
          };
        }

        // Fetch teachers and their assignments
        const { data: teacherAssignments } = await supabase
          .from("teacher_assignments")
          .select(
            `
            teacher:teachers!inner (
              id,
              user_id
            ),
            subject:subjects!inner (
              id,
              name
            )
          `
          )
          .eq("board_id", boardData.id)
          .eq("grade_id", gradeData.id)
          .eq("section_id", sectionData.id);

        if (teacherAssignments) {
          interface TeacherEmailData {
            id: string;
            email: string;
            subject: {
              id: string;
              name: string;
            };
          }

          // Fetch teacher emails from auth.users
          const teacherEmails: TeacherEmailData[] = await Promise.all(
            teacherAssignments.map(async (ta: any) => {
              const { data: userData } = await supabase
                .from("users")
                .select("email")
                .eq("user_id", ta.teacher.user_id)
                .single();
              return {
                id: ta.teacher.id,
                email: userData?.email || "No email found",
                subject: ta.subject,
              };
            })
          );

          const processedTeachers: Teacher[] = teacherEmails.map((teacher) => ({
            id: teacher.id,
            auth: {
              email: teacher.email,
            },
            subject: {
              id: teacher.subject.id,
              name: teacher.subject.name,
              board_id: boardData.id,
            },
          }));

          setTeachers(processedTeachers);
        }

        // Fetch students for this section
        const { data: studentsData } = await supabase
          .from("school_students")
          .select("id, user_id, roll_number")
          .eq("section_id", sectionData.id)
          .order('roll_number', { ascending: true });

        if (studentsData) {
          // Fetch student emails from auth.users
          const studentEmails: Student[] = await Promise.all(
            (studentsData || []).map(
              async (student: {
                id: string;
                user_id: string;
                roll_number?: string;
              }) => {
                const { data: userData } = await supabase
                  .from("users")
                  .select("email")
                  .eq("user_id", student.user_id)
                  .single();
                return {
                  id: student.id,
                  auth: {
                    email: userData?.email || "No email found",
                  },
                  roll_number: student.roll_number,
                };
              }
            )
          );
          setStudents(studentEmails);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSectionData();
  }, [decodedBoardName, decodedGradeName, decodedSectionName]);

  const TeachersSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden border border-muted">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
          </CardContent>
          <CardFooter className="flex justify-end gap-2 bg-muted/30 p-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  const SubjectsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardFooter className="flex justify-end bg-muted/30 p-2">
            <Skeleton className="h-8 w-16" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  const StudentsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardFooter className="flex justify-end gap-2 bg-muted/30 p-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="container py-10 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-lg p-6 shadow-sm mb-6">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/school">School</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/school/${resolvedParams.board}`}>
                {decodedBoardName}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                href={`/school/${resolvedParams.board}/${resolvedParams.grade}`}
              >
                {decodedGradeName}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Section {decodedSectionName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold">Section {decodedSectionName}</h1>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm py-1 px-3">
              {decodedBoardName}
            </Badge>
            <Badge variant="secondary" className="text-sm py-1 px-3">
              {decodedGradeName}
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              {students.length} Students
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-3">
            <TabsTrigger value="teachers" className="flex items-center gap-2">
              <UserPlus2 className="h-4 w-4" />
              <span className="hidden sm:inline">Teachers</span>
              <Badge variant="outline" className="ml-1">
                {teachers.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex items-center gap-2">
              <Book className="h-4 w-4" />
              <span className="hidden sm:inline">Subjects</span>
              <Badge variant="outline" className="ml-1">
                {subjects.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Students</span>
              <Badge variant="outline" className="ml-1">
                {students.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teachers" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Teachers</h2>
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Assign Teacher</span>
              </Button>
            </div>

            {isLoading ? (
              <TeachersSkeleton />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teachers.length > 0 ? (
                  teachers.map((teacher) => (
                    <Card 
                      key={`${teacher.id}-${teacher.subject?.id}`}
                      className="overflow-hidden transition-all hover:shadow-md border-muted"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-5 w-5 text-muted-foreground" />
                          <h3 className="text-lg font-medium">Teacher</h3>
                        </div>
                        <p className="text-sm font-medium break-all">{teacher.auth.email}</p>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex items-center gap-2">
                          <Book className="h-4 w-4 text-muted-foreground" />
                          <p className="text-muted-foreground font-medium">
                            {teacher.subject?.name || "No subject assigned"}
                          </p>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end gap-2 bg-muted/30 pt-2">
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4 mr-1" />
                          Contact
                        </Button>
                        <Button size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Profile
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-10 px-4 text-center bg-muted/30 rounded-lg">
                    <UserPlus2 className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-3">No teachers assigned to this section yet.</p>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign Teacher
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="subjects" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Subjects</h2>
              <Button size="sm" className="gap-2">
                <BookPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Subject</span>
              </Button>
            </div>

            {isLoading ? (
              <SubjectsSkeleton />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {subjects.length > 0 ? (
                  subjects.map((subject) => (
                    <Card
                      key={subject.id}
                      className="hover:bg-muted/50 transition-colors hover:shadow-sm group"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{subject.name}</h3>
                          <Book className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardFooter className="flex justify-end bg-muted/30 pt-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-10 px-4 text-center bg-muted/30 rounded-lg">
                    <Book className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-3">No subjects available for this board.</p>
                    <Button size="sm">
                      <BookPlus className="h-4 w-4 mr-2" />
                      Add Subject
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Students</h2>
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Student</span>
              </Button>
            </div>

            {isLoading ? (
              <StudentsSkeleton />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.length > 0 ? (
                  students.map((student) => (
                    <Card 
                      key={student.id}
                      className="overflow-hidden transition-all hover:shadow-md border-muted"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <h3 className="text-lg font-medium">Student</h3>
                          </div>
                          {student.roll_number && (
                            <Badge variant="outline" className="ml-auto">
                              #{student.roll_number}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium break-all mt-2">{student.auth.email}</p>
                      </CardHeader>
                      <CardFooter className="flex justify-end gap-2 bg-muted/30 pt-2">
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4 mr-1" />
                          Contact
                        </Button>
                        <Button size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Profile
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-10 px-4 text-center bg-muted/30 rounded-lg">
                    <User className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-3">No students enrolled in this section yet.</p>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Student
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
